import type { ProgressEvent, Quote } from "@tao.com/intents-sdk"

import type { ExecutionProgress } from "../execution-steps"
import {
  applyProgressEvent,
  completeSubmission,
  startExecution,
  stopExecution,
  trackingSteps,
} from "../execution-steps"

const hash = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, "0")}`

const run = (progress: ExecutionProgress, events: ProgressEvent[]) =>
  events.reduce(applyProgressEvent, progress)

/** `id:status[:note]` for each step, for compact expectations. */
const summary = (progress: ExecutionProgress) =>
  progress.steps.map((step) => [step.id, step.status, step.note].filter(Boolean).join(":"))

const quote = {} as Quote

describe("startExecution", () => {
  it("starts preparing the one signature", () => {
    const progress = startExecution()
    expect(summary(progress)).toEqual([
      "sign:active:preparing",
      "submitted:pending",
      "inBlock:pending",
      "orderOpen:pending",
    ])
    expect(progress.hasSigningStarted).toBe(false)
    expect(progress.submittedHash).toBeUndefined()
  })
})

describe("applyProgressEvent", () => {
  it("signs, submits with the extrinsic hash, then waits for the block and the order", () => {
    let progress = run(startExecution(), [
      { step: "quoting" },
      { step: "quoted", quote },
      { step: "checking-balance" },
    ])
    expect(summary(progress)[0]).toBe("sign:active:preparing")

    progress = applyProgressEvent(progress, { step: "quote-refreshing", reason: "expired" })
    expect(summary(progress)[0]).toBe("sign:active:updatingPrice")

    progress = applyProgressEvent(progress, { step: "awaiting-signature" })
    expect(summary(progress)[0]).toBe("sign:active:signing")
    expect(progress.hasSigningStarted).toBe(true)

    progress = applyProgressEvent(progress, { step: "substrate-submitted", extrinsicHash: hash(1) })
    expect(summary(progress)).toEqual([
      "sign:done",
      "submitted:done",
      "inBlock:active:confirming",
      "orderOpen:pending",
    ])
    expect(progress.steps[1]?.hash).toBe(hash(1))
    expect(progress.submittedHash).toBe(hash(1))

    progress = applyProgressEvent(progress, {
      step: "substrate-confirmed",
      extrinsicHash: hash(1),
      blockHash: hash(2),
      orderId: hash(3),
    })
    expect(summary(progress)).toEqual([
      "sign:done",
      "submitted:done",
      "inBlock:done",
      "orderOpen:done",
    ])
    expect(progress.steps[1]?.hash).toBe(hash(1))
  })

  it("ignores the EVM wallet's events and the quoting ones", () => {
    const progress = startExecution()
    expect(
      run(progress, [
        { step: "switching-chain", chainId: 964 },
        { step: "quoting" },
        { step: "quoted", quote },
        { step: "swap-quoted", minUsdc: 1n, quotedUsdc: 1n, poolFee: 500, source: "quoter" },
        { step: "approval-required", amount: 1n },
        { step: "submitted", txHash: hash(9) },
      ]),
    ).toBe(progress)
  })
})

describe("stopExecution", () => {
  const signing = run(startExecution(), [{ step: "awaiting-signature" }])
  const submitted = applyProgressEvent(signing, {
    step: "substrate-submitted",
    extrinsicHash: hash(1),
  })

  it("fails the active step when nothing was sent, or the batch rolled back", () => {
    expect(summary(stopExecution(startExecution(), "failed"))[0]).toBe("sign:failed")
    expect(summary(stopExecution(submitted, "failed"))).toEqual([
      "sign:done",
      "submitted:done",
      "inBlock:failed",
      "orderOpen:pending",
    ])
  })

  it("shows the batch in a block but the swap not opened", () => {
    expect(summary(stopExecution(submitted, "notOpened"))).toEqual([
      "sign:done",
      "submitted:done",
      "inBlock:done",
      "orderOpen:failed",
    ])
  })

  it("never calls an unconfirmed batch failed", () => {
    const stopped = stopExecution(submitted, "unconfirmed")
    expect(summary(stopped)).toEqual([
      "sign:done",
      "submitted:done",
      "inBlock:unknown",
      "orderOpen:pending",
    ])
    expect(stopped.steps.some((step) => step.status === "failed")).toBe(false)
    expect(stopped.steps[1]?.hash).toBe(hash(1))
  })
})

describe("completeSubmission", () => {
  it("marks every step done and links the extrinsic", () => {
    const done = completeSubmission(startExecution(), hash(4))
    expect(done.steps.every((step) => step.status === "done")).toBe(true)
    expect(done.steps[1]?.hash).toBe(hash(4))
    expect(done.submittedHash).toBe(hash(4))
  })
})

describe("trackingSteps", () => {
  it("follows the order to delivery or refund", () => {
    const ids = (state: Parameters<typeof trackingSteps>[0]) =>
      trackingSteps(state).map((step) => `${step.id}:${step.status}`)
    expect(ids("open")).toEqual(["delivering:active", "delivered:pending"])
    expect(ids("filled")).toEqual(["delivering:done", "delivered:done"])
    expect(ids("awaiting-refund")).toEqual(["delivering:failed", "refund:active"])
    expect(ids("refunded")).toEqual(["delivering:failed", "refund:done"])
  })
})
