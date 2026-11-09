import type { SubstrateCall } from "@tao.com/intents-sdk"
import {
  AccountId,
  Binary,
  Enum,
  FixedSizeBinary,
  getSs58AddressInfo,
} from "@polkadot-api/substrate-bindings"
import { SubstrateError } from "@tao.com/intents-sdk"

/**
 * Maps the calls of a TAO.com Intents batch (the SDK's `SubstrateCall`, polkadot-js style:
 * camelCase `section` / `method` and positional `args`) to the values sapi encodes
 * (`sapi.getDecodedCall(pallet, method, args)`: metadata pallet / call names and named fields).
 *
 * The SDK (1.4.1) only ever puts four calls in a batch. Each one is mapped explicitly below, with
 * its fields in the order of the Bittensor runtime metadata (checked against the repo's
 * `.papi/scale/bittensor.scale`, spec 361, and mainnet spec 488: identical for these calls).
 * Anything else, or a different number of arguments, throws: an SDK upgrade that changes the batch
 * must fail before anything is signed, not be encoded by guesswork.
 */

export type Hex = `0x${string}`

/**
 * One entry of `Utility.batch_all`'s `calls`, in the shape `sapi.getDecodedCall` returns:
 * `{ type: <pallet>, value: { type: <call>, value: <named fields> } }`.
 */
export type SapiCall = {
  type: string
  value: { type: string; value: Record<string, unknown> }
}

/** The batch the SDK asks for (`utility.batchAll`), as sapi names it. */
export const BATCH_PALLET = "Utility"
export const BATCH_METHOD = "batch_all"

/** `Utility.batch_all`'s arguments for sapi: `getExtrinsicPayload(BATCH_PALLET, BATCH_METHOD, toBatchAllArgs(calls), ...)`. */
export const toBatchAllArgs = (calls: SapiCall[]) => ({ calls })

/** Bittensor's SS58 prefix (`System.SS58Prefix`). Account ids are handed to sapi as SS58 strings. */
export const BITTENSOR_SS58_PREFIX = 42

const accountIdCodec = AccountId(BITTENSOR_SS58_PREFIX)

const U16_MAX = 0xffff
const U64_LIMIT = 1n << 64n
const U256_LIMIT = 1n << 256n
const U64_MASK = U64_LIMIT - 1n

type Convert = (value: unknown, where: string) => unknown

const describe = (value: unknown) =>
  typeof value === "bigint"
    ? `${value}n`
    : typeof value === "string"
      ? JSON.stringify(value)
      : Array.isArray(value)
        ? `an array of ${value.length}`
        : value === null
          ? "null"
          : typeof value

const invalid = (where: string, expected: string, value: unknown) =>
  new SubstrateError(`Cross-chain batch: ${where} must be ${expected}, got ${describe(value)}.`)

const isHex = (value: unknown, bytes?: number): value is Hex =>
  typeof value === "string" &&
  (bytes === undefined
    ? /^0x([0-9a-fA-F]{2})*$/.test(value)
    : value.length === 2 + bytes * 2 && /^0x[0-9a-fA-F]*$/.test(value))

const hexToBytes = (hex: Hex) => Binary.fromHex(hex).asBytes()

/** An unsigned integer below `limit`, from a bigint or a safe integer number. */
const toUint = (value: unknown, limit: bigint, where: string, type: string): bigint => {
  const n =
    typeof value === "bigint"
      ? value
      : typeof value === "number" && Number.isSafeInteger(value)
        ? BigInt(value)
        : undefined
  if (n === undefined || n < 0n || n >= limit) throw invalid(where, `a ${type}`, value)
  return n
}

/** `AccountId32`: an SS58 address (any prefix, checksum verified) or a `0x` 32-byte account id. */
const toAccountId: Convert = (value, where) => {
  if (isHex(value, 32)) return accountIdCodec.dec(hexToBytes(value))
  if (typeof value === "string") {
    const info = getSs58AddressInfo(value)
    if (info.isValid && info.publicKey.length === 32) return accountIdCodec.dec(info.publicKey)
  }
  throw invalid(where, "an SS58 address or a 0x 32-byte account id", value)
}

/** `MultiAddress`: always the `Id` variant, as the staking batch builds it. */
const toMultiAddressId: Convert = (value, where) => Enum("Id", toAccountId(value, where) as string)

/** `H160` (`[u8; 20]`): a `0x` 20-byte address, as `FixedSizeBinary<20>`. */
const toH160: Convert = (value, where) => {
  if (!isHex(value, 20)) throw invalid(where, "a 0x 20-byte address", value)
  return FixedSizeBinary.fromHex(value)
}

/** `Vec<u8>`: `0x` hex (or bytes), as `Binary`. */
const toBytes: Convert = (value, where) => {
  if (value instanceof Uint8Array) return Binary.fromBytes(value)
  if (!isHex(value)) throw invalid(where, "0x hex bytes", value)
  return Binary.fromHex(value)
}

const toU16: Convert = (value, where) => Number(toUint(value, BigInt(U16_MAX) + 1n, where, "u16"))
/**
 * `u64`, and `Compact<u64>` too (the metadata decides the encoding): Bittensor's `Balance` is a
 * u64, so a transfer's value is one.
 */
const toU64: Convert = (value, where) => toUint(value, U64_LIMIT, where, "u64")

/**
 * `U256` (`[u64; 4]` in the metadata): papi takes it as four little-endian 64-bit limbs, least
 * significant first, which encodes to the same 32 little-endian bytes as polkadot-js's `U256`.
 */
const toU256: Convert = (value, where) => {
  const n = toUint(value, U256_LIMIT, where, "u256")
  return [0n, 64n, 128n, 192n].map((shift) => (n >> shift) & U64_MASK)
}

/** `Option<T>`: polkadot-js's `null` (or `undefined`) is papi's `undefined` (None). */
const optional =
  (convert: Convert): Convert =>
  (value, where) =>
    value === null || value === undefined ? undefined : convert(value, where)

/**
 * `access_list` / `authorization_list`: the SDK always sends `[]`. A non-empty list would need its
 * items converted too, so it is refused rather than passed through unconverted.
 */
const emptyList: Convert = (value, where) => {
  if (!Array.isArray(value)) throw invalid(where, "an array", value)
  if (value.length > 0)
    throw new SubstrateError(
      `Cross-chain batch: ${where} is not empty (${value.length} items); the wallet only supports an empty list.`,
    )
  return []
}

type CallSpec = {
  /** Pallet and call names as the runtime metadata (and sapi) name them. */
  pallet: string
  method: string
  /** The call's fields in metadata order, each with how the SDK's positional arg is converted. */
  fields: ReadonlyArray<readonly [name: string, convert: Convert]>
}

/** The calls the SDK puts in a batch, keyed by its polkadot-js `section.method`. */
const SDK_CALLS: Record<string, CallSpec> = {
  // { section: "balances", method: "transferKeepAlive", args: [dest, value] }
  "balances.transferKeepAlive": {
    pallet: "Balances",
    method: "transfer_keep_alive",
    fields: [
      ["dest", toMultiAddressId], // MultiAddress<AccountId32, ()>
      ["value", toU64], // Compact<u64> (Balance)
    ],
  },
  // { section: "subtensorModule", method: "transferStake",
  //   args: [destinationColdkey, hotkey, originNetuid, destinationNetuid, alphaAmount] }
  "subtensorModule.transferStake": {
    pallet: "SubtensorModule",
    method: "transfer_stake",
    fields: [
      ["destination_coldkey", toAccountId], // AccountId32
      ["hotkey", toAccountId], // AccountId32
      ["origin_netuid", toU16], // u16
      ["destination_netuid", toU16], // u16
      ["alpha_amount", toU64], // u64
    ],
  },
  // { section: "evm", method: "call",
  //   args: [source, target, input, value, gasLimit, maxFeePerGas, null, null, [], []] }
  "evm.call": {
    pallet: "EVM",
    method: "call",
    fields: [
      ["source", toH160], // H160
      ["target", toH160], // H160
      ["input", toBytes], // Vec<u8>
      ["value", toU256], // U256
      ["gas_limit", toU64], // u64
      ["max_fee_per_gas", toU256], // U256
      ["max_priority_fee_per_gas", optional(toU256)], // Option<U256>
      ["nonce", optional(toU256)], // Option<U256>
      ["access_list", emptyList], // Vec<(H160, Vec<H256>)>
      ["authorization_list", emptyList], // Vec<AuthorizationListItem>
    ],
  },
  // { section: "evm", method: "withdraw", args: [address, value] }
  "evm.withdraw": {
    pallet: "EVM",
    method: "withdraw",
    fields: [
      ["address", toH160], // H160
      ["value", toU64], // u64 (BalanceOf)
    ],
  },
}

/** Field names per metadata call (`"EVM.call"` → `["source", ...]`), in metadata order. */
export const SDK_CALL_FIELDS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  Object.values(SDK_CALLS).map(({ pallet, method, fields }) => [
    `${pallet}.${method}`,
    fields.map(([name]) => name),
  ]),
)

/** Map one SDK call to sapi's call value. Throws `SubstrateError` for anything it doesn't know. */
export const toSapiCall = (call: SubstrateCall): SapiCall => {
  const name = `${call?.section}.${call?.method}`
  const spec = Object.prototype.hasOwnProperty.call(SDK_CALLS, name) ? SDK_CALLS[name] : undefined
  if (!spec)
    throw new SubstrateError(
      `Cross-chain batch: unsupported call \`${name}\`. The wallet maps only ${Object.keys(
        SDK_CALLS,
      )
        .map((k) => `\`${k}\``)
        .join(", ")}; the SDK may have changed.`,
    )
  if (!Array.isArray(call.args) || call.args.length !== spec.fields.length)
    throw new SubstrateError(
      `Cross-chain batch: \`${name}\` takes ${spec.fields.length} arguments (${spec.fields
        .map(([field]) => field)
        .join(
          ", ",
        )}), got ${Array.isArray(call.args) ? call.args.length : describe(call.args)}; the SDK may have changed.`,
    )

  const value: Record<string, unknown> = {}
  spec.fields.forEach(([field, convert], i) => {
    value[field] = convert(call.args[i], `\`${name}\` argument ${i + 1} (${field})`)
  })
  return { type: spec.pallet, value: { type: spec.method, value } }
}

/** Map a whole SDK batch, in order. */
export const toSapiCalls = (calls: SubstrateCall[]): SapiCall[] => {
  if (!Array.isArray(calls) || calls.length === 0)
    throw new SubstrateError("Cross-chain batch: there are no calls to sign.")
  return calls.map(toSapiCall)
}
