import type { SubstrateCall } from "@tao.com/intents-sdk"
import { DEFAULT_CHAINS, parseSubstrateAddress, substrateEvmAddress } from "@tao.com/intents-sdk"
import { encodeFunctionData, parseAbi } from "viem"

/**
 * Calls shaped exactly as `@tao.com/intents-sdk` 1.5.1 builds them (`dist/index.js`:
 * `transferStakeCall`, `evmCall`, the `balances.transferKeepAlive` / `evm.withdraw` pushes in
 * `buildEvmCallBatch`): account ids as `0x` 32-byte hex, EVM addresses checksummed, amounts as
 * bigint, netuids as numbers, `null` for the two `Option`s and `[]` for the two lists.
 *
 * Well-known public dev accounts only (Alice, Bob).
 */
export const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
export const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"

export const ALICE_ID = parseSubstrateAddress(ALICE)!.accountId
export const BOB_ID = parseSubstrateAddress(BOB)!.accountId
/** The EVM address Alice acts as in `evm.call` (first 20 bytes of her key). */
export const SOURCE = substrateEvmAddress(ALICE)
/** Stand-in for the mirror account `addressMapping(SOURCE)` returns (a 0x bytes32). */
export const MIRROR = `0x${"c0ffee".repeat(10)}ee00` as const
export const SETTLER = DEFAULT_CHAINS[964].intents
export const STAKING_PRECOMPILE = "0x0000000000000000000000000000000000000805"
export const GAS_PRICE = 10_000_000_000n

export const transferStake = (amount = 1_500_000_002n, netuid = 64): SubstrateCall => ({
  section: "subtensorModule",
  method: "transferStake",
  args: [MIRROR, BOB_ID, netuid, netuid, amount],
})

export const transferKeepAlive = (
  dest: string = MIRROR,
  value = 1_320_000_500n,
): SubstrateCall => ({
  section: "balances",
  method: "transferKeepAlive",
  args: [dest, value],
})

export const evmCall = (
  target: string,
  input: `0x${string}`,
  valueWei: bigint,
  gasLimit: bigint,
  maxFeePerGas = GAS_PRICE,
): SubstrateCall => ({
  section: "evm",
  method: "call",
  args: [SOURCE, target, input, valueWei, gasLimit, maxFeePerGas, null, null, [], []],
})

export const evmWithdraw = (value = 1_234_567n): SubstrateCall => ({
  section: "evm",
  method: "withdraw",
  args: [SOURCE, value],
})

const stakingAbi = parseAbi(["function approve(address spender, uint256 netuid, uint256 amount)"])

export const approveCall = () =>
  evmCall(
    STAKING_PRECOMPILE,
    encodeFunctionData({
      abi: stakingAbi,
      functionName: "approve",
      args: [SETTLER, 64n, 1_500_000_000n],
    }),
    0n,
    80_000n,
  )

/** An `open` call: arbitrary calldata of a realistic length, 1.5 TAO of value (wei). */
export const openCall = (valueWei = 1_500_000_000_000_000_000n) =>
  evmCall(SETTLER, `0x${"ab".repeat(4)}${"0123456789abcdef".repeat(40)}`, valueWei, 660_000n)

/** The largest batch the SDK builds: an alpha sell that needs the staking approval. */
export const alphaSellBatch = (): SubstrateCall[] => [
  transferStake(),
  transferKeepAlive(),
  approveCall(),
  openCall(0n),
  evmWithdraw(),
]

/** A native TAO sell. */
export const taoSellBatch = (): SubstrateCall[] => [transferKeepAlive(), openCall(), evmWithdraw()]
