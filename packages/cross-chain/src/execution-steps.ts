import type { OrderState, ProgressEvent } from "@tao.com/intents-sdk"

/**
 * The sell's stepper, as a pure model of the SDK's `onProgress` events on the coldkey (substrate)
 * path. Ported from the website's `execution-steps.ts`, with the coldkey path's own steps:
 *
 * Sign → Submitted (`substrate-submitted`, from the signer's `onSigned`, with the extrinsic hash) →
 * In a block → Swap open (`substrate-confirmed`: the SDK reads the order from the block's events,
 * so both arrive together). Once the order is open, its tracking follows: Delivering → Delivered,
 * or Delivering (failed) → Refund.
 */

export type ExecutionStepId =
  | "sign"
  | "submitted"
  | "inBlock"
  | "orderOpen"
  | "delivering"
  | "delivered"
  | "refund"

/**
 * `unknown`: the batch was sent but its outcome can't be told (the submit failed, or it wasn't
 * seen in a block in time). Not a failure: it may still be included.
 */
export type ExecutionStepStatus = "pending" | "active" | "done" | "failed" | "unknown"

/** Short helper text under the active step. */
export type ExecutionStepNote =
  /** The SDK checks balances and takes the final price before signing. */
  | "preparing"
  /** The wallet is signing the batch. */
  | "signing"
  /** Sent; waiting for the chain to include it. */
  | "confirming"
  /** The SDK is taking a new price (`quote-refreshing`). */
  | "updatingPrice"

export type ExecutionStep = {
  id: ExecutionStepId
  status: ExecutionStepStatus
  note?: ExecutionStepNote
  /** The extrinsic this step sent, for a link. */
  hash?: `0x${string}`
}

export type ExecutionProgress = {
  steps: ExecutionStep[]
  /**
   * Signing has started (`awaiting-signature`). From then on the run is never aborted: a batch
   * signed after an abort could still be sent, and nobody would follow it.
   */
  hasSigningStarted: boolean
  /** The batch's extrinsic hash, once signed and about to be broadcast (`onSigned`). */
  submittedHash: `0x${string}` | undefined
}

/** The first steps of a run, before any progress: preparing to sign. */
export function startExecution(): ExecutionProgress {
  return {
    steps: [
      { id: "sign", status: "active", note: "preparing" },
      { id: "submitted", status: "pending" },
      { id: "inBlock", status: "pending" },
      { id: "orderOpen", status: "pending" },
    ],
    hasSigningStarted: false,
    submittedHash: undefined,
  }
}

/**
 * `id` becomes the active step: active steps before it are done, those after it go back to
 * pending.
 */
function activate(
  steps: readonly ExecutionStep[],
  id: ExecutionStepId,
  patch: Pick<ExecutionStep, "note" | "hash"> = {},
): ExecutionStep[] {
  const index = steps.findIndex((step) => step.id === id)
  if (index === -1) return [...steps]
  return steps.map((step, i) => {
    if (i === index)
      return { ...step, status: "active", note: patch.note, hash: patch.hash ?? step.hash }
    if (i < index)
      return step.status === "done" ? step : { ...step, status: "done", note: undefined }
    return step.status === "active" ? { ...step, status: "pending", note: undefined } : step
  })
}

function patchStep(
  steps: readonly ExecutionStep[],
  id: ExecutionStepId,
  patch: Partial<ExecutionStep>,
): ExecutionStep[] {
  return steps.map((step) => (step.id === id ? { ...step, ...patch } : step))
}

/** Every step up to and including `id` done. */
function completeThrough(steps: readonly ExecutionStep[], id: ExecutionStepId): ExecutionStep[] {
  const index = steps.findIndex((step) => step.id === id)
  return steps.map((step, i) => (i <= index ? { ...step, status: "done", note: undefined } : step))
}

/** The progress after one of the SDK's `onProgress` events. */
export function applyProgressEvent(
  progress: ExecutionProgress,
  event: ProgressEvent,
): ExecutionProgress {
  const { steps } = progress
  switch (event.step) {
    case "checking-balance":
      return { ...progress, steps: activate(steps, "sign", { note: "preparing" }) }
    case "quote-refreshing":
      return {
        ...progress,
        steps: steps.map((step) =>
          step.status === "active" ? { ...step, note: "updatingPrice" } : step,
        ),
      }
    case "awaiting-signature":
      return {
        ...progress,
        hasSigningStarted: true,
        steps: activate(steps, "sign", { note: "signing" }),
      }
    case "substrate-submitted": {
      const hash = event.extrinsicHash
      return {
        ...progress,
        hasSigningStarted: true,
        submittedHash: hash,
        steps: activate(
          patchStep(completeThrough(steps, "submitted"), "submitted", { hash }),
          "inBlock",
          {
            note: "confirming",
          },
        ),
      }
    }
    case "substrate-confirmed": {
      const hash = event.extrinsicHash
      return {
        ...progress,
        hasSigningStarted: true,
        submittedHash: hash,
        steps: patchStep(completeThrough(steps, "orderOpen"), "submitted", { hash }),
      }
    }
    // The EVM wallet path's events, and the quoting ones: nothing to show on this path.
    case "switching-chain":
    case "approval-required":
    case "approval-submitted":
    case "approval-confirmed":
    case "submitted":
    case "confirmed":
    case "quoting":
    case "quoted":
    case "swap-quoted":
      return progress
  }
}

/** How a run that didn't open an order ended, for the stepper. */
export type ExecutionStop =
  /** Nothing was sent, or the batch failed on chain and was rolled back. */
  | "failed"
  /** The batch is in a block, but the swap didn't open (`EVM_CALL_FAILED`). */
  | "notOpened"
  /** Sent, but whether it is in a block can't be told: it may still be included. */
  | "unconfirmed"

/** The run stopped: mark the steps as `stop` says. */
export function stopExecution(progress: ExecutionProgress, stop: ExecutionStop): ExecutionProgress {
  const { steps } = progress
  switch (stop) {
    case "notOpened":
      return {
        ...progress,
        steps: patchStep(completeThrough(steps, "inBlock"), "orderOpen", {
          status: "failed",
          note: undefined,
        }),
      }
    case "unconfirmed":
      return {
        ...progress,
        steps: patchStep(completeThrough(steps, "submitted"), "inBlock", {
          status: "unknown",
          note: undefined,
        }),
      }
    case "failed":
      return {
        ...progress,
        steps: steps.map((step) =>
          step.status === "active" ? { ...step, status: "failed", note: undefined } : step,
        ),
      }
  }
}

/** Every step done: the order is open. */
export function completeSubmission(
  progress: ExecutionProgress,
  hash: `0x${string}` | undefined,
): ExecutionProgress {
  const submittedHash = hash ?? progress.submittedHash
  return {
    ...progress,
    submittedHash,
    steps: progress.steps.map((step) => ({
      ...step,
      status: "done",
      note: undefined,
      ...(step.id === "submitted" && submittedHash !== undefined && { hash: submittedHash }),
    })),
  }
}

/** The steps after the order is open, from its last known state. */
export function trackingSteps(state: OrderState): ExecutionStep[] {
  switch (state) {
    case "open":
      return [
        { id: "delivering", status: "active" },
        { id: "delivered", status: "pending" },
      ]
    case "filled":
      return [
        { id: "delivering", status: "done" },
        { id: "delivered", status: "done" },
      ]
    case "awaiting-refund":
      return [
        { id: "delivering", status: "failed" },
        { id: "refund", status: "active" },
      ]
    case "refunded":
      return [
        { id: "delivering", status: "failed" },
        { id: "refund", status: "done" },
      ]
  }
}
