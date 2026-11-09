import {
  applyProgressEvent,
  buildExecuteParams,
  completeSubmission,
  CrossChainConfig,
  CrossChainErrorCode,
  describeCrossChainError,
  ExecuteFailureOutcome,
  ExecutionProgress,
  executionStopFor,
  INTENTS_PARTNER_ID,
  Order,
  ProgressEvent,
  Quote,
  QuoteParams,
  resolveSellFailure,
  ReviewFeedback,
  startExecution,
  stopExecution,
  SubstrateSigner,
} from "@taostats-wallet/cross-chain"
import { log } from "extension-shared"
import { useCallback, useEffect, useRef, useState } from "react"

import { getTaoIntents } from "./intents"

/** One sell to send, as the review accepted it. */
export type SellRunInput = {
  /** The review's firm quote params: route, amount, recipient, alpha hotkey. */
  params: QuoteParams
  /** The accepted output less slippage: nothing below it is signed. */
  minOutputAmount: bigint
  slippageBps: number
  signer: SubstrateSigner
  /** `OUTPUT_BELOW_MINIMUM`: ask the review for a new price. */
  onPriceMoved?: () => void
}

export type SellExecutionState =
  /** Reviewing; `feedback` says how the last attempt ended, if it failed. */
  | { status: "idle"; feedback?: ReviewFeedback }
  | { status: "running"; progress: ExecutionProgress }
  /** The order is open: this screen follows it while it is open. */
  | {
      status: "submitted"
      progress: ExecutionProgress
      order: Order
      /** The quote the SDK opened the order with (it re-quotes inside `execute`). */
      quote: Quote
    }
  /** The batch went out but whether it is in a block can't be told. Not a failure. */
  | {
      status: "unconfirmed"
      progress: ExecutionProgress
      txHash: `0x${string}`
      code: CrossChainErrorCode
    }
  /** The batch is in a block but the swap didn't open: nothing to retry. */
  | {
      status: "failed"
      progress: ExecutionProgress
      failure: Extract<ExecuteFailureOutcome, { kind: "failed" }>
    }

type ActiveRun = { controller: AbortController; progress: ExecutionProgress }

/**
 * Sends one sell through the SDK's `execute` from the account's signer, and follows it to an open
 * order. Money moves here, so:
 *
 * - One run at a time; `start` does nothing while one is in flight. It only runs from the review's
 *   Confirm, and never retries by itself.
 * - `cancel` (and closing the modal) aborts only before signing starts. After that the run is
 *   left to finish: a batch signed after an abort could still be sent, and nobody would follow it.
 * - Errors become codes (`describeCrossChainError`); where they leave the screen is
 *   `resolveSellFailure`. A batch that was sent and then lost track of is `unconfirmed`, never
 *   called failed.
 */
export const useSellExecution = (config: CrossChainConfig) => {
  const [state, setState] = useState<SellExecutionState>({ status: "idle" })
  const activeRun = useRef<ActiveRun | null>(null)
  const isMounted = useRef(true)

  // Closing before signing starts stops the SDK (an abort is the SDK operation's own cancellation,
  // outside React); after that, the run finishes on its own.
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      const run = activeRun.current
      if (run && !run.progress.hasSigningStarted) run.controller.abort()
    }
  }, [])

  const start = useCallback(
    async (input: SellRunInput) => {
      if (activeRun.current) return
      const run: ActiveRun = { controller: new AbortController(), progress: startExecution() }
      activeRun.current = run
      setState({ status: "running", progress: run.progress })

      const onProgress = (event: ProgressEvent) => {
        run.progress = applyProgressEvent(run.progress, event)
        if (event.step === "substrate-submitted" || event.step === "substrate-confirmed")
          log.debug(`[cross-chain] ${event.step}`, { extrinsicHash: event.extrinsicHash })
        if (isMounted.current && activeRun.current === run)
          setState({ status: "running", progress: run.progress })
      }

      // Whether the batch failed on chain with a dispatch error (rolled back, nothing moved): the
      // SDK reports some of those as EVM_CALL_FAILED, like a batch that went through without
      // opening the swap, so the signer's own outcome is kept to tell them apart.
      let batchRolledBack = false
      const signer: SubstrateSigner = {
        ...input.signer,
        signAndSendBatch: async (calls, options) => {
          try {
            return await input.signer.signAndSendBatch(calls, options)
          } catch (error) {
            if (describeCrossChainError(error).rolledBack) batchRolledBack = true
            throw error
          }
        },
      }

      const execute = () =>
        getTaoIntents(config).execute({
          ...buildExecuteParams({
            params: input.params,
            minOutputAmount: input.minOutputAmount,
            slippageBps: input.slippageBps,
            partnerId: INTENTS_PARTNER_ID,
          }),
          substrate: signer,
          signal: run.controller.signal,
          onProgress,
        })
      // Only `execute` is inside the `try`: once it returns the order is open, and nothing after
      // it may be mistaken for a failed sell (which would invite the user to pay twice).
      let result: Awaited<ReturnType<typeof execute>>
      try {
        result = await execute()
      } catch (error) {
        activeRun.current = null
        const details = describeCrossChainError(error)
        const outcome = resolveSellFailure(details, {
          submittedHash: run.progress.submittedHash,
          now: Date.now(),
          batchRolledBack,
        })
        log.debug("[cross-chain] Sell stopped", {
          code: details.code,
          outcome: outcome.kind,
          extrinsicHash: run.progress.submittedHash,
        })
        if (!isMounted.current) return
        const progress = stopExecution(run.progress, executionStopFor(outcome))
        switch (outcome.kind) {
          case "review":
            setState({ status: "idle", feedback: outcome.feedback })
            if (outcome.feedback.priceMovedAt !== undefined) input.onPriceMoved?.()
            return
          case "failed":
            setState({ status: "failed", progress, failure: outcome })
            return
          case "unconfirmed":
            setState({
              status: "unconfirmed",
              progress,
              txHash: outcome.txHash,
              code: outcome.code,
            })
            return
        }
      }

      activeRun.current = null
      log.debug("[cross-chain] Sell opened", {
        orderId: result.orderId,
        extrinsicHash: result.extrinsicHash,
      })
      if (!isMounted.current) return
      setState({
        status: "submitted",
        progress: completeSubmission(run.progress, result.extrinsicHash),
        order: result.order,
        quote: result.quote,
      })
    },
    [config],
  )

  /** Stops a run before signing starts. `false` once it has. */
  const cancel = useCallback((): boolean => {
    const run = activeRun.current
    if (!run || run.progress.hasSigningStarted) return false
    run.controller.abort()
    return true
  }, [])

  /** Clears the last attempt's message (e.g. once a new price was accepted). */
  const clearFeedback = useCallback(() => {
    setState((current) =>
      current.status === "idle" && current.feedback ? { status: "idle" } : current,
    )
  }, [])

  return {
    state,
    start,
    cancel,
    clearFeedback,
    /** It can still be stopped: signing hasn't started. */
    canCancel: state.status === "running" && !state.progress.hasSigningStarted,
  }
}

export type SellExecution = ReturnType<typeof useSellExecution>
