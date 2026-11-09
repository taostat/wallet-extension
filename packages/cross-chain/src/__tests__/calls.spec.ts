import type { SubstrateCall } from "@tao.com/intents-sdk"
import { Enum } from "@polkadot-api/substrate-bindings"
import { SubstrateError } from "@tao.com/intents-sdk"

import { BATCH_METHOD, BATCH_PALLET, SDK_CALL_FIELDS, toSapiCall, toSapiCalls } from "../calls"
import { buildSapiBatchPayload } from "../substrate-signer"
import { createPolkadotJs, createTestSapi } from "./chain"
import {
  ALICE,
  ALICE_ID,
  alphaSellBatch,
  approveCall,
  BOB,
  BOB_ID,
  evmCall,
  evmWithdraw,
  MIRROR,
  openCall,
  SETTLER,
  SOURCE,
  taoSellBatch,
  transferKeepAlive,
  transferStake,
} from "./sdk-calls"

const sapi = createTestSapi()
const pjs = createPolkadotJs()

const U64_MAX = (1n << 64n) - 1n
const U256_MAX = (1n << 256n) - 1n

/** Our bytes for one call: the mapped value through sapi's real `getExtrinsicPayload`. */
const sapiCallHex = async (call: SubstrateCall) => {
  const { type, value } = toSapiCall(call)
  const { payload } = await sapi.getExtrinsicPayload(type, value.type, value.value, {
    address: ALICE,
  })
  return payload.method
}

/** Our bytes for a batch: what the signer builds (`Utility.batch_all` through sapi). */
const sapiBatchHex = async (calls: SubstrateCall[]) => {
  const { payload } = await buildSapiBatchPayload(sapi, ALICE, toSapiCalls(calls))
  return payload.method
}

describe("the call fields come from the Bittensor metadata", () => {
  it("lists each call's fields in metadata order", () => {
    const { lookup, metadata } = sapi.chain
    const fromMetadata = Object.fromEntries(
      Object.keys(SDK_CALL_FIELDS).map((key) => {
        const [palletName, method] = key.split(".")
        const pallet = metadata.pallets.find((p) => p.name === palletName)!
        const calls = lookup(pallet.calls!.type)
        if (calls.type !== "enum") throw new Error(`${palletName} calls are not an enum`)
        const call = calls.value[method]
        if (call.type !== "struct") throw new Error(`${key} has no named fields`)
        return [key, Object.keys(call.value)]
      }),
    )

    expect(fromMetadata).toEqual(SDK_CALL_FIELDS)
    expect(SDK_CALL_FIELDS).toEqual({
      "Balances.transfer_keep_alive": ["dest", "value"],
      "SubtensorModule.transfer_stake": [
        "destination_coldkey",
        "hotkey",
        "origin_netuid",
        "destination_netuid",
        "alpha_amount",
      ],
      "EVM.call": [
        "source",
        "target",
        "input",
        "value",
        "gas_limit",
        "max_fee_per_gas",
        "max_priority_fee_per_gas",
        "nonce",
        "access_list",
        "authorization_list",
      ],
      "EVM.withdraw": ["address", "value"],
    })
  })
})

describe("our sapi bytes equal polkadot-js's for the SDK's positional args", () => {
  const cases: Array<[string, SubstrateCall]> = [
    ["balances.transferKeepAlive (0x account id)", transferKeepAlive()],
    ["balances.transferKeepAlive (SS58, Compact<u64> max)", transferKeepAlive(BOB, U64_MAX)],
    ["balances.transferKeepAlive (value 0)", transferKeepAlive(MIRROR, 0n)],
    ["subtensorModule.transferStake", transferStake()],
    ["subtensorModule.transferStake (root, u64 max)", transferStake(U64_MAX, 0)],
    ["subtensorModule.transferStake (netuid u16 max)", transferStake(1n, 65_535)],
    [
      // The SDK moves stake within one subnet; distinct values catch a field-order mistake.
      "subtensorModule.transferStake (distinct netuids)",
      { section: "subtensorModule", method: "transferStake", args: [BOB_ID, MIRROR, 3, 64, 5n] },
    ],
    ["evm.call (staking approve)", approveCall()],
    ["evm.call (open, 1.5 TAO)", openCall()],
    ["evm.call (U256 above 2^64)", openCall((1n << 200n) + (1n << 130n) + (1n << 70n) + 5n)],
    ["evm.call (U256 max, empty input)", evmCall(SETTLER, "0x", U256_MAX, U64_MAX, U256_MAX)],
    [
      "evm.call (both Options set)",
      {
        section: "evm",
        method: "call",
        args: [SOURCE, SETTLER, "0x1234", 1n, 21_000n, 2n, (1n << 255n) + 3n, 9n, [], []],
      },
    ],
    ["evm.withdraw", evmWithdraw()],
    ["evm.withdraw (u64 max)", evmWithdraw(U64_MAX)],
  ]

  it.each(cases)("%s", async (_name, call) => {
    expect(await sapiCallHex(call)).toBe(pjs.callHex(call))
  })

  it("a whole alpha sell batch (all four calls)", async () => {
    const calls = alphaSellBatch()
    const ours = await sapiBatchHex(calls)
    expect(ours).toBe(pjs.batchHex(calls))
    // Utility (11) . batch_all (2), five calls.
    expect(ours.startsWith("0x0b0214")).toBe(true)
  })

  it("a whole native TAO sell batch", async () => {
    const calls = taoSellBatch()
    expect(await sapiBatchHex(calls)).toBe(pjs.batchHex(calls))
  })
})

describe("our bytes decode back to the SDK's values", () => {
  it("round-trips the alpha sell batch through papi's decoder", async () => {
    const method = await sapiBatchHex(alphaSellBatch())
    const decoded = sapi.getDecodedCallFromPayload({ method })
    expect(decoded.pallet).toBe(BATCH_PALLET)
    expect(decoded.method).toBe(BATCH_METHOD)

    const calls = decoded.args.calls as Array<{
      type: string
      value: { type: string; value: Record<string, { asHex?: () => string } | unknown> }
    }>
    expect(calls.map((c) => `${c.type}.${c.value.type}`)).toEqual([
      "SubtensorModule.transfer_stake",
      "Balances.transfer_keep_alive",
      "EVM.call",
      "EVM.call",
      "EVM.withdraw",
    ])

    const [stake, transfer, approve, open, withdraw] = calls.map((c) => c.value.value)
    const hex = (v: unknown) => (v as { asHex: () => string }).asHex()

    expect(stake.destination_coldkey).toBe(
      toSapiCall(transferStake()).value.value.destination_coldkey,
    )
    expect(stake.hotkey).toBe(BOB)
    expect(stake.origin_netuid).toBe(64)
    expect(stake.destination_netuid).toBe(64)
    expect(stake.alpha_amount).toBe(1_500_000_002n)

    expect(transfer.dest).toEqual(toSapiCall(transferKeepAlive()).value.value.dest)
    expect(transfer.value).toBe(1_320_000_500n)

    expect(hex(approve.source)).toBe(SOURCE.toLowerCase())
    expect(hex(approve.input)).toBe((approveCall().args[2] as string).toLowerCase())

    expect(hex(open.target)).toBe(SETTLER.toLowerCase())
    expect(open.value).toEqual([0n, 0n, 0n, 0n])
    expect(open.gas_limit).toBe(660_000n)
    expect(open.max_fee_per_gas).toEqual([10_000_000_000n, 0n, 0n, 0n])
    expect(open.max_priority_fee_per_gas).toBeUndefined()
    expect(open.nonce).toBeUndefined()
    expect(open.access_list).toEqual([])
    expect(open.authorization_list).toEqual([])

    expect(hex(withdraw.address)).toBe(SOURCE.toLowerCase())
    expect(withdraw.value).toBe(1_234_567n)
  })
})

describe("toSapiCall", () => {
  it("gives sapi.getDecodedCall's shape", () => {
    const call = toSapiCall(evmWithdraw())
    expect(call).toEqual(sapi.getDecodedCall("EVM", "withdraw", call.value.value))
  })

  it("writes account ids as Bittensor SS58, whatever form the SDK used", () => {
    expect(toSapiCall(transferKeepAlive(ALICE_ID)).value.value.dest).toEqual(Enum("Id", ALICE))
    expect(toSapiCall(transferStake()).value.value.hotkey).toBe(BOB)
    // Alice's key written for Polkadot (prefix 0) is the same account.
    expect(
      toSapiCall(transferKeepAlive("15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5")).value.value
        .dest,
    ).toEqual(Enum("Id", ALICE))
    expect(BOB_ID).toMatch(/^0x[0-9a-f]{64}$/)
  })

  it("splits a U256 into four little-endian u64 limbs", () => {
    const value = (3n << 192n) + (2n << 128n) + (1n << 64n) + 7n
    expect(toSapiCall(openCall(value)).value.value.value).toEqual([7n, 1n, 2n, 3n])
  })

  const fails = (call: unknown, message: RegExp) => {
    let error: unknown
    try {
      toSapiCall(call as SubstrateCall)
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(SubstrateError)
    expect((error as Error).message).toMatch(message)
  }

  it("refuses any other call, so an SDK change fails loudly", () => {
    fails(
      { section: "balances", method: "transferAllowDeath", args: [MIRROR, 1n] },
      /unsupported call `balances.transferAllowDeath`/,
    )
    fails(
      { section: "Balances", method: "transfer_keep_alive", args: [MIRROR, 1n] },
      /unsupported call/,
    )
    fails({ section: "evm", method: "create", args: [] }, /unsupported call `evm.create`/)
    fails({ section: "utility", method: "batchAll", args: [[]] }, /unsupported call/)
    fails({ section: "constructor", method: "name", args: [] }, /unsupported call/)
    expect(() => toSapiCalls([])).toThrow(SubstrateError)
  })

  it("refuses a wrong number of arguments", () => {
    const call = openCall()
    fails({ ...call, args: call.args.slice(0, 9) }, /`evm.call` takes 10 arguments .*got 9/)
    fails({ ...call, args: [...call.args, null] }, /takes 10 arguments .*got 11/)
    fails({ ...transferStake(), args: transferStake().args.slice(0, 4) }, /takes 5 arguments/)
    fails({ section: "evm", method: "withdraw", args: undefined }, /takes 2 arguments/)
  })

  it("refuses values the chain types can't hold instead of wrapping them", () => {
    fails(transferStake(1n << 64n), /alpha_amount\) must be a u64/)
    fails(transferStake(-1n), /must be a u64/)
    fails(transferStake(1n, 65_536), /origin_netuid\) must be a u16/)
    fails(transferStake(1n, 1.5), /must be a u16/)
    // Bittensor's Balance is a u64: papi's compact codec would take more and the chain would not.
    fails(transferKeepAlive(MIRROR, 1n << 64n), /value\) must be a u64/)
    fails(transferKeepAlive(MIRROR, 1e30 as unknown as bigint), /must be a u64/)
    fails(transferKeepAlive(MIRROR, "1" as unknown as bigint), /must be a u64/)
    fails(openCall(1n << 256n), /value\) must be a u256/)
    fails(evmWithdraw(1n << 64n), /must be a u64/)
  })

  it("refuses malformed addresses and bytes", () => {
    fails(
      transferKeepAlive(`${ALICE.slice(0, -1)}Z`),
      /dest\) must be an SS58 address or a 0x 32-byte account id/,
    )
    fails(transferKeepAlive(MIRROR.slice(0, 64)), /must be an SS58 address/)
    fails(transferKeepAlive(SOURCE), /must be an SS58 address/)
    fails(evmCall(`${SETTLER}00`, "0x", 0n, 1n), /target\) must be a 0x 20-byte address/)
    fails(evmCall(SETTLER, "0x123" as `0x${string}`, 0n, 1n), /input\) must be 0x hex bytes/)
    fails(
      { section: "evm", method: "withdraw", args: [MIRROR, 1n] },
      /address\) must be a 0x 20-byte address/,
    )
  })

  it("refuses non-empty access or authorization lists", () => {
    const args = [...openCall().args]
    args[8] = [[SETTLER, []]]
    fails({ section: "evm", method: "call", args }, /access_list\) is not empty/)
    args[8] = []
    args[9] = [{}]
    fails({ section: "evm", method: "call", args }, /authorization_list\) is not empty/)
    args[9] = null
    fails({ section: "evm", method: "call", args }, /authorization_list\) must be an array/)
  })
})
