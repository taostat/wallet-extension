import type { SubstrateEvent } from "@tao.com/intents-sdk"

/**
 * # Event normalisation contract
 *
 * `submitAndWatch` (implemented in the service worker) reports the included batch's events as the
 * SDK's `SubstrateEvent[]`: plain JSON, exactly what the SDK's own `polkadotSigner` produces. With a
 * polkadot-js registry built from the chain's metadata (as `watchSubstrateTransaction` does), that is:
 *
 * ```ts
 * records
 *   .filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(extrinsicIndex))
 *   .map(({ event }) => ({
 *     section: event.section,                        // "evm", "system", "balances", "subtensorModule"
 *     method: event.method,                          // "Log", "ExecutedFailed", "ExtrinsicFailed"
 *     data: event.data.map((d) => d.toJSON()),       // positional fields, plain JSON
 *   }))
 * ```
 *
 * - **Which events:** every `System.Events` record of the block that included the batch whose phase
 *   is `ApplyExtrinsic(<the batch's index in that block>)`, in order. No other extrinsic's events,
 *   no `Initialization` / `Finalization` events.
 * - **`section`:** the pallet name in polkadot-js's lower camel case: `System` → `system`,
 *   `Balances` → `balances`, `SubtensorModule` → `subtensorModule`, `EVM` → `evm`,
 *   `Utility` → `utility`, `TransactionPayment` → `transactionPayment`. Not papi's `EVM` / `System`.
 * - **`method`:** the event variant name as in the metadata: `Log`, `Executed`, `ExecutedFailed`,
 *   `ExtrinsicSuccess`, `ExtrinsicFailed`, `BatchCompleted`, ...
 * - **`data`:** the event's fields in metadata order, each as polkadot-js `toJSON()` would give it.
 *
 * What the SDK (1.4.1) actually reads, and so what must be exact:
 *
 * - `evm.Log`: `data[0]` is the log, `{ address, topics, data }`: `address` the 0x 20-byte emitter,
 *   `topics` 0x 32-byte hex strings, `data` 0x hex. The SDK finds the opened order as the `Log` whose
 *   `address` is the Intents contract and whose `topics[0]` is the `Open` event selector (both
 *   compared case-insensitively) and takes `topics[1]` as the order id. Write hex in lower case, as
 *   polkadot-js does: the order id is used as is.
 * - `evm.ExecutedFailed` (`data: [address]`): its presence means an EVM call inside the batch
 *   reverted (`EvmCallFailedError`, with `data` kept as its `details`). `evm.Executed` is the success
 *   counterpart; the SDK does not read it.
 * - A batch that failed on chain is not read from the events: `submitAndWatch` returns `ok: false`
 *   and `error` (see `SubmitAndWatchResult`). `system.ExtrinsicFailed` among the events is treated
 *   as a failure too.
 *
 * `eventsProblem` checks the parts the SDK depends on, and the signer refuses events that break
 * them: a service worker that gets the shape wrong fails loudly instead of the SDK reporting "no
 * `Open` event, nothing was opened" for an order that did open.
 */

const SECTION = /^[a-z][A-Za-z0-9]*$/
const METHOD = /^[A-Z][A-Za-z0-9]*$/
const HEX = /^0x([0-9a-fA-F]{2})*$/
const H160 = /^0x[0-9a-fA-F]{40}$/
const H256 = /^0x[0-9a-fA-F]{64}$/

export const isEvent = (event: SubstrateEvent, section: string, method: string) =>
  event.section === section && event.method === method

/** Why `events` breaks the contract above, or `null` when it holds. */
export const eventsProblem = (events: unknown): string | null => {
  if (!Array.isArray(events)) return "events is not an array"
  for (const [i, event] of events.entries()) {
    if (typeof event !== "object" || event === null) return `event ${i} is not an object`
    const { section, method, data } = event as Record<string, unknown>
    if (typeof section !== "string" || !SECTION.test(section))
      return `event ${i} has section ${JSON.stringify(section)}; expected polkadot-js lower camel case (e.g. "evm")`
    if (typeof method !== "string" || !METHOD.test(method))
      return `event ${i} (${section}) has method ${JSON.stringify(method)}; expected the variant name (e.g. "Log")`
    if (!Array.isArray(data)) return `event ${i} (${section}.${method}) has no data array`
    if (section === "evm" && method === "Log") {
      const log = data[0] as Record<string, unknown> | undefined
      if (
        typeof log !== "object" ||
        log === null ||
        typeof log.address !== "string" ||
        !H160.test(log.address) ||
        !Array.isArray(log.topics) ||
        !log.topics.every((t) => typeof t === "string" && H256.test(t)) ||
        typeof log.data !== "string" ||
        !HEX.test(log.data)
      )
        return `event ${i} (evm.Log) is not { address: 0x20 bytes, topics: 0x32 bytes[], data: 0x hex }`
    }
  }
  return null
}
