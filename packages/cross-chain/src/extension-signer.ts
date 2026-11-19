import type { SubstrateSigner } from "@tao.com/intents-sdk"

import type { Hex } from "./calls"
import type {
  SapiPayloadBuilder,
  SapiSubstrateSignerDeps,
  SignedBatch,
  SubmitAndWatchResult,
} from "./substrate-signer"
import { buildSapiBatchPayload, createSapiSubstrateSigner } from "./substrate-signer"

/**
 * `createSapiSubstrateSigner` wired to the wallet: sapi builds the batch payload in the UI, and the
 * service worker signs and submits it (`api.subSign` / `api.subSubmitAndWatch`, the
 * `pri(substrate.rpc.sign)` / `pri(substrate.rpc.submitAndWatch)` messages).
 *
 * `sapi` and `api` are typed by the slices used, so this package doesn't depend on the extension.
 */

/** What sapi's `getExtrinsicPayload` resolves to: the signer payload, plus metadata we don't use. */
export type SapiExtrinsicPayload<TSignerPayload> = { payload: TSignerPayload }

/** The slice of sapi's `ScaleApi` the signer uses. */
export type ExtensionSignerSapi<TPayload extends SapiExtrinsicPayload<unknown>> =
  SapiPayloadBuilder<TPayload> & {
    /** The payload's estimated fee (`TransactionPaymentApi.query_info`'s `partial_fee`), in rao. */
    getFeeEstimate: (payload: TPayload["payload"]) => Promise<bigint>
    /** A storage value, decoded (`null` when the chain has none). */
    getStorage: <T>(pallet: string, entry: string, keys: unknown[]) => Promise<T>
    /** A metadata constant, decoded. */
    getConstant: <T>(pallet: string, constant: string) => T
  }

/** The slice of the extension's UI `api` the signer uses. */
export type ExtensionSignerApi<TSignerPayload, TTxInfo> = {
  subSign: (payload: TSignerPayload) => Promise<SignedBatch>
  subSubmitAndWatch: (
    payload: TSignerPayload,
    signature: Hex,
    txInfo?: TTxInfo,
  ) => Promise<SubmitAndWatchResult>
}

export type ExtensionSubstrateSignerOptions<
  TPayload extends SapiExtrinsicPayload<unknown>,
  TTxInfo,
> = {
  /** The coldkey that signs (SS58). It must be a local keypair account: the service worker refuses others. */
  address: string
  /** sapi for Bittensor. */
  sapi: ExtensionSignerSapi<TPayload>
  /** The UI's message wrappers. */
  api: ExtensionSignerApi<TPayload["payload"], TTxInfo>
  /** Passed to `api.subSubmitAndWatch`, for the History entry. */
  txInfo?: TTxInfo
  /**
   * Report `spendableAfterFee` (read with sapi: `System.Account`, `Balances.ExistentialDeposit` and
   * the payload's fee estimate), so the SDK refuses a batch the coldkey can't pay for before it is
   * signed. Default `true`.
   */
  checkSpendable?: boolean
}

/** The free rao left to move after the fee: free − max(frozen, existential deposit) − fee, at least 0. */
export const spendableAfterFee = ({
  free,
  frozen,
  existentialDeposit,
  fee,
}: {
  free: bigint
  frozen: bigint
  existentialDeposit: bigint
  fee: bigint
}) => {
  const untouchable = frozen > existentialDeposit ? frozen : existentialDeposit
  const spendable = free - untouchable - fee
  return spendable > 0n ? spendable : 0n
}

/** `System.Account`'s value as sapi decodes it (`AccountInfo<u32, AccountData<u64>>`). */
type AccountInfo = { data: { free: bigint; frozen: bigint } }

const toRao = (value: unknown, what: string): bigint => {
  if (typeof value === "bigint") return value
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value)
  throw new Error(`Cross-chain: can't read ${what} (got ${typeof value})`)
}

/** `spendableAfterFee` for `address`, read with sapi. Throws when something can't be read. */
export const readSpendableAfterFee = async <TPayload extends SapiExtrinsicPayload<unknown>>(
  sapi: ExtensionSignerSapi<TPayload>,
  address: string,
  payload: TPayload,
) => {
  const existentialDeposit = toRao(
    sapi.getConstant<unknown>("Balances", "ExistentialDeposit"),
    "the existential deposit",
  )
  const [account, fee] = await Promise.all([
    sapi.getStorage<AccountInfo | null>("System", "Account", [address]),
    sapi.getFeeEstimate(payload.payload),
  ])
  // An account the chain doesn't store has nothing.
  return spendableAfterFee({
    free: account ? toRao(account.data.free, "the free balance") : 0n,
    frozen: account ? toRao(account.data.frozen, "the frozen balance") : 0n,
    existentialDeposit,
    fee: toRao(fee, "the fee estimate"),
  })
}

/**
 * The SDK's `SubstrateSigner` for a local keypair account of this wallet on Bittensor:
 *
 * - `buildBatchPayload`: sapi's `getExtrinsicPayload` for `Utility.batch_all` (`buildSapiBatchPayload`);
 * - `sign`: `api.subSign(payload.payload)`, which signs in the service worker and broadcasts nothing;
 * - `submitAndWatch`: `api.subSubmitAndWatch(payload.payload, signature, txInfo)`, which resolves
 *   once the batch is in a block;
 * - `spendableAfterFee` (unless `checkSpendable` is `false`): `readSpendableAfterFee`.
 */
export const createExtensionSubstrateSigner = <
  TPayload extends SapiExtrinsicPayload<unknown>,
  TTxInfo = never,
>({
  address,
  sapi,
  api,
  txInfo,
  checkSpendable = true,
}: ExtensionSubstrateSignerOptions<TPayload, TTxInfo>): SubstrateSigner => {
  const deps: SapiSubstrateSignerDeps<TPayload> = {
    address,
    buildBatchPayload: (calls) => buildSapiBatchPayload(sapi, address, calls),
    sign: (payload) => api.subSign(payload.payload),
    submitAndWatch: (payload, signature) =>
      api.subSubmitAndWatch(payload.payload, signature, txInfo),
  }
  if (checkSpendable)
    deps.getSpendableAfterFee = (payload) => readSpendableAfterFee(sapi, address, payload)
  return createSapiSubstrateSigner(deps)
}
