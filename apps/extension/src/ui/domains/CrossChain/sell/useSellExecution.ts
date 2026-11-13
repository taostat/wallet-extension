import {
  applyProgressEvent,
  buildExecuteParams,
  completeSubmission,
  CrossChainConfig,
  CrossChainErrorCode,
  CrossChainSellRecord,
  describeCrossChainError,
  ExecuteFailureOutcome,
  ExecutionProgress,
  executionStopFor,
  INTENTS_PARTNER_ID,
  isReportedFailure,
  openedSellRecord,
  Order,
  parseAmountToRaw,
  ProgressEvent,
  Quote,
  quoteInputRao,
  QuoteParams,
  resolveSellFailure,
  ReviewFeedback,
  SellAnalyticsContext,
  SellInput,
  SellOutput,
  sellRecordId,
  startExecution,
  stopExecution,
  strandedSellRecord,
  SubstrateSigner,
  swapFailedEvent,
  swapSubmittedEvent,
  unconfirmedSellRecord,
} from "@taostats-wallet/cross-chain"
import { log } from "extension-shared"
import { useCallback, useEffect, useRef, useState } from "react"

import { captureCrossChainEvent } from "../crossChainAnalytics"
import {
  removeCrossChainSell,
  resolveCrossChainUnconfirmedSell,
  saveCrossChainSell,
  setSellInFlight,
} from "../records/sellRecordsStore"
import { getTaoIntents } from "./intents"

/** What the saved record of a sell says about it, besides what the run learns. */
export type SellRecordContext = {
  /** The paying account (SS58). */
  address: string
  input: SellInput
  output: SellOutput
  /** The sold token's symbol, for display. */
  symbol?: string
  /** The review's latest quote output, for a send whose order isn't known yet. */
  expectedOutputRaw: bigint
  /** The swap's coarse USD size, for analytics. */
  usdBucket?: string
}

const analyticsContextOf = (context: SellRecordContext): SellAnalyticsContext => ({
  from: context.input.kind,
  to: context.output,
  ...(context.usdBucket !== undefined && { usdBucket: context.usdBucket }),
})

/** The record fields every kind of saved sell shares. */
const recordBase = (input: SellRunInput, now: number) => ({
  address: input.record.address,
  from: input.record.input,
  to: input.record.output,
  amountInRaw: parseAmountToRaw(input.params.amount ?? "", 9) ?? 0n,
  amountOutRaw: input.record.expectedOutputRaw,
  recipient: input.params.recipient ?? "",
  ...(input.record.symbol !== undefined && { symbol: input.record.symbol }),
  ...(input.record.usdBucket !== undefined && { usdBucket: input.record.usdBucket }),
  now,
})

/** Saves a record; a storage problem never stops the run's own screen. */
const saveRecord = async (build: () => CrossChainSellRecord) => {
  try {
    const record = build()
    await saveCrossChainSell(record)
    return record
  } catch (error) {
    log.error("[cross-chain] Couldn't save the sell", { error })
    return undefined
  }
}

/** A store write that fails is logged; it never stops the run. */
const writeSafely = async (write: () => Promise<unknown>) => {
  try {
    await write()
  } catch (error) {
    log.error("[cross-chain] Couldn't update the sell", { error })
  }
}

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
  /** What the saved record says about the sell. */
  record: SellRecordContext
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
      /** The saved record, which the trackers keep up to date. */
      recordId: string | undefined
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
 * - What happened is saved before anything else (state, analytics), even with the modal closed:
 *   the send as soon as it is signed, then the opened order (followed by the trackers), a send
 *   whose outcome is unknown ("Check again"), or alpha a batch left at the account's EVM mirror
 *   ("Move back to this account").
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

      // The send is saved as soon as it is signed and about to go out (as unconfirmed), so a page
      // closed before the run ends still leaves it to check again. The run's end replaces it (the
      // opened order, stranded alpha), resolves it, or removes it (rolled back: nothing moved).
      // Writes are queued behind the cross-page lock in the order asked for; `saved` is the early
      // save, which the run's end waits for before replacing or removing it.
      let sent: { id: string; at: number; saved: Promise<unknown> } | undefined
      const onProgress = (event: ProgressEvent) => {
        run.progress = applyProgressEvent(run.progress, event)
        if (event.step === "substrate-submitted" || event.step === "substrate-confirmed")
          log.debug(`[cross-chain] ${event.step}`, { extrinsicHash: event.extrinsicHash })
        if (event.step === "substrate-submitted" && !sent) {
          const at = Date.now()
          const id = sellRecordId(event.extrinsicHash)
          const saved = saveRecord(() =>
            unconfirmedSellRecord({ ...recordBase(input, at), extrinsicHash: event.extrinsicHash }),
          )
          sent = { id, at, saved }
          setSellInFlight(id, true)
        }
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
        const now = sent?.at ?? Date.now()
        await sent?.saved
        switch (outcome.kind) {
          case "unconfirmed":
            await saveRecord(() =>
              unconfirmedSellRecord({ ...recordBase(input, now), extrinsicHash: outcome.txHash }),
            )
            break
          case "failed": {
            const { strandedAlpha, txHash } = outcome
            const sentId = sent?.id
            if (strandedAlpha)
              await saveRecord(() =>
                strandedSellRecord({
                  ...recordBase(input, now),
                  strandedAlpha,
                  ...(txHash !== undefined && { extrinsicHash: txHash }),
                }),
              )
            // TAO: it waits at the account's EVM address for the next sell; nothing to do.
            else if (sentId)
              await writeSafely(() =>
                resolveCrossChainUnconfirmedSell(sentId, { kind: "notOpened" }),
              )
            break
          }
          case "review": {
            // Rolled back on chain: nothing moved, nothing to keep.
            const sentId = sent?.id
            if (sentId) await writeSafely(() => removeCrossChainSell(sentId))
            break
          }
        }
        if (sent) setSellInFlight(sent.id, false)
        // A send that may still land isn't a failure: "Check again" reports how it ended.
        if (isReportedFailure(details) && outcome.kind !== "unconfirmed")
          captureCrossChainEvent(swapFailedEvent(analyticsContextOf(input.record), details.code))
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
      // Saved first: from here the trackers follow it, with the modal open or closed.
      await sent?.saved
      const record = await saveRecord(() =>
        openedSellRecord({
          ...recordBase(input, sent?.at ?? Date.now()),
          // What the order was opened with: the SDK re-quotes inside `execute`.
          amountInRaw: quoteInputRao(result.quote),
          amountOutRaw: result.quote.outputAmount,
          extrinsicHash: result.extrinsicHash,
          order: result.order.toJSON(),
        }),
      )
      if (sent) setSellInFlight(sent.id, false)
      captureCrossChainEvent(swapSubmittedEvent(analyticsContextOf(input.record)))
      if (!isMounted.current) return
      setState({
        status: "submitted",
        progress: completeSubmission(run.progress, result.extrinsicHash),
        order: result.order,
        quote: result.quote,
        recordId: record?.id,
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
