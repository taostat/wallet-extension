import {
  CrossChainErrorCode,
  describeCrossChainError,
  ProgressEvent,
  recoveryFinishedEvent,
  RecoveryKind,
  recoveryStartedEvent,
  resolveRecoveryFailure,
} from "@taostats-wallet/cross-chain"
import { log } from "extension-shared"
import { useCallback, useEffect, useRef, useState } from "react"

import { captureCrossChainEvent } from "../crossChainAnalytics"

type Hex = `0x${string}`

/** What `recoverRefund` and `recoverStake` resolve to. */
export type RecoveryResult = { extrinsicHash: Hex; blockHash: Hex; amount: bigint }

export type RecoveryState =
  /** Reviewing; `error` says why the last attempt didn't move anything. */
  | { status: "idle"; error?: CrossChainErrorCode }
  | { status: "running" }
  | { status: "done"; hash: Hex; amount: bigint }
  /** There was nothing there to move (moved already, from here or elsewhere). */
  | { status: "nothingLeft" }
  /** Sent, outcome unknown: it may still be included. Not a failure, and no retry from here. */
  | { status: "unconfirmed"; txHash: Hex }

/** One recovery at a time in this page, whatever screen started it. */
let isAnyRecoveryRunning = false

/**
 * Runs one recovery (`recoverRefund` or `recoverStake`, one batch signed by the coldkey), only from
 * its Confirm and never retried by itself. Money moves here, so as for the sell:
 *
 * - what happened is saved first (`onMoved`, `onNothingLeft`), even if the screen has gone;
 * - errors become codes and `resolveRecoveryFailure` decides where they leave the screen: a batch
 *   that was sent and then lost track of is `unconfirmed`, never called failed.
 */
export const useRecovery = (kind: RecoveryKind) => {
  const [state, setState] = useState<RecoveryState>({ status: "idle" })
  const isMounted = useRef(true)

  // Whether the screen is still there to show the result (a flag outside React's state).
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const run = useCallback(
    async ({
      execute,
      onMoved,
      onNothingLeft,
    }: {
      execute: (onProgress: (event: ProgressEvent) => void) => Promise<RecoveryResult>
      /** Saves the result (a store write). */
      onMoved: (result: RecoveryResult) => Promise<unknown>
      /** Saves that nothing was there (a store write). */
      onNothingLeft: () => Promise<unknown>
    }) => {
      if (isAnyRecoveryRunning) return
      isAnyRecoveryRunning = true
      const show = (next: RecoveryState) => {
        if (isMounted.current) setState(next)
      }
      show({ status: "running" })
      captureCrossChainEvent(recoveryStartedEvent(kind))

      let submittedHash: Hex | undefined
      const onProgress = (event: ProgressEvent) => {
        if (event.step === "substrate-submitted") {
          submittedHash = event.extrinsicHash
          log.debug("[cross-chain] Recovery submitted", { kind, extrinsicHash: submittedHash })
        }
      }

      try {
        let result: RecoveryResult
        try {
          result = await execute(onProgress)
        } catch (error) {
          const details = describeCrossChainError(error)
          const failure = resolveRecoveryFailure(details, { submittedHash })
          log.debug("[cross-chain] Recovery stopped", {
            kind,
            code: details.code,
            outcome: failure.kind,
            extrinsicHash: submittedHash,
          })
          switch (failure.kind) {
            case "cancelled":
              show({ status: "idle" })
              return
            case "nothingLeft":
              await saveSafely(onNothingLeft)
              captureCrossChainEvent(recoveryFinishedEvent(kind, "nothingLeft"))
              show({ status: "nothingLeft" })
              return
            case "unconfirmed":
              captureCrossChainEvent(recoveryFinishedEvent(kind, "unconfirmed"))
              show({ status: "unconfirmed", txHash: failure.txHash })
              return
            case "error":
              captureCrossChainEvent(recoveryFinishedEvent(kind, "failed", failure.code))
              show({ status: "idle", error: failure.code })
              return
          }
        }
        log.debug("[cross-chain] Recovery done", { kind, extrinsicHash: result.extrinsicHash })
        await saveSafely(() => onMoved(result))
        captureCrossChainEvent(recoveryFinishedEvent(kind, "moved"))
        show({ status: "done", hash: result.extrinsicHash, amount: result.amount })
      } finally {
        isAnyRecoveryRunning = false
      }
    },
    [kind],
  )

  return { state, run }
}

/** A store write that fails doesn't make the recovery look failed: it went through. */
const saveSafely = async (save: () => Promise<unknown>) => {
  try {
    await save()
  } catch (error) {
    log.error("[cross-chain] Couldn't save the recovery", { error })
  }
}
