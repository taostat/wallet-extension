import type { DispatchError, EventRecord } from "@polkadot/types/interfaces"
import type { AnyJson, Registry } from "@polkadot/types/types"

/**
 * One event of an extrinsic, written the way polkadot-js names it: the pallet in lower camel case
 * (`system`, `evm`, `subtensorModule`), the variant name (`ExtrinsicSuccess`, `Log`), and the fields
 * in metadata order as `toJSON()` gives them. It is the swap SDK's `SubstrateEvent`.
 */
export type SubstrateExtrinsicEvent = {
  section: string
  method: string
  data: AnyJson[]
}

/** What an included extrinsic did: its own events, and whether it failed on chain. */
export type SubstrateExtrinsicOutcome = {
  /** The extrinsic's events, in block order. */
  events: SubstrateExtrinsicEvent[]
  /** `false` when the extrinsic failed on chain (`system.ExtrinsicFailed`). */
  ok: boolean
  /** When `ok` is `false`: the dispatch error, written by `describeDispatchError`. */
  error?: string
}

/** A decoded `System.Events` record (`FrameSystemEventRecord`, or `EventRecord` on old chains). */
export type ExtrinsicEventRecord = Pick<EventRecord, "phase" | "event">

const isExtrinsicFailed = ({ event }: ExtrinsicEventRecord) =>
  event.section === "system" && event.method === "ExtrinsicFailed"

/**
 * A dispatch error as polkadot-js describes it:
 *
 * - `Module`: `<pallet in lower camel case>.<Error>`, followed by `: <docs>` when the metadata has
 *   docs (`balances.InsufficientBalance: Balance too low to send value.`), from
 *   `registry.findMetaError`; `Module: <index and error as JSON>` when the metadata doesn't know it;
 * - `Token` / `Arithmetic` / `Transactional`: `token.<Variant>` / `arithmetic.<Variant>` /
 *   `transactional.<Variant>` (`token.FundsUnavailable`);
 * - any other variant: its name (`BadOrigin`).
 */
export const describeDispatchError = (registry: Registry, error: DispatchError): string => {
  if (error.isModule) {
    try {
      const { section, name, docs } = registry.findMetaError(error.asModule)
      const text = docs.join(" ").trim()
      return `${section}.${name}${text ? `: ${text}` : ""}`
    } catch {
      return `Module: ${JSON.stringify(error.asModule.toJSON())}`
    }
  }
  if (error.isToken) return `token.${error.asToken.type}`
  if (error.isArithmetic) return `arithmetic.${error.asArithmetic.type}`
  if (error.isTransactional) return `transactional.${error.asTransactional.type}`
  return error.type
}

/**
 * The events of the extrinsic at `extrinsicIndex` in a block, from that block's decoded
 * `System.Events` records: every record whose phase is `ApplyExtrinsic(extrinsicIndex)`, in order,
 * as `{ section, method, data: data.map((d) => d.toJSON()) }`. Records of other extrinsics, and
 * `Initialization` / `Finalization` records, are left out.
 *
 * `ok` is `false` when one of them is `system.ExtrinsicFailed`; `error` then describes its dispatch
 * error (`describeDispatchError`). A reverted EVM call inside a batch doesn't fail the extrinsic: it
 * shows as an `evm.ExecutedFailed` event.
 */
export const getExtrinsicOutcome = (
  registry: Registry,
  records: Iterable<ExtrinsicEventRecord>,
  extrinsicIndex: number,
): SubstrateExtrinsicOutcome => {
  const own = [...records].filter(
    ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(extrinsicIndex),
  )

  const events = own.map(({ event }) => ({
    section: event.section,
    method: event.method,
    data: event.data.map((d) => d.toJSON()),
  }))

  const failed = own.find(isExtrinsicFailed)
  if (!failed) return { events, ok: true }

  const dispatchError = failed.event.data[0] as DispatchError | undefined
  if (!dispatchError) return { events, ok: false }
  return { events, ok: false, error: describeDispatchError(registry, dispatchError) }
}
