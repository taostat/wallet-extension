import { Account } from "extension-core"
import { describe, expect, it } from "vitest"

import { pickTaoSellOpenOptions, TaoHolding } from "../taoSellOpenOptions"

const TAO_TOKEN_ID = "bittensor:substrate-native"
const RAO = 1_000_000_000n

// Well-known dev addresses (Alice, Bob, Charlie, Dave) and an Ethereum one.
const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
const CHARLIE = "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y"
const DAVE = "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
const ETHEREUM = "0x1234567890123456789012345678901234567890"

const keypair = (address: string): Account => ({
  type: "keypair",
  address,
  name: address.slice(0, 6),
  createdAt: 0,
  curve: address.startsWith("0x") ? "ethereum" : "sr25519",
})

const ledger = (address: string): Account => ({
  type: "ledger-polkadot",
  address,
  name: address.slice(0, 6),
  createdAt: 0,
  curve: "ed25519",
  app: "polkadot",
  accountIndex: 0,
  addressOffset: 0,
})

const holding = (address: string, tao: bigint): TaoHolding => ({
  address,
  tokenId: TAO_TOKEN_ID,
  transferable: tao * RAO,
})

const taoSell = (address: string) => ({
  address,
  tokenId: TAO_TOKEN_ID,
  asset: { kind: "tao" },
})

describe("pickTaoSellOpenOptions", () => {
  it("sells from the selected account, even when another holds more", () => {
    expect(
      pickTaoSellOpenOptions({
        holdings: [holding(ALICE, 1n), holding(BOB, 50n)],
        accounts: [keypair(ALICE), keypair(BOB)],
        selectedAddress: ALICE,
      }),
    ).toEqual(taoSell(ALICE))
  })

  it("offers nothing when the selected account can't sell, rather than another account", () => {
    expect(
      pickTaoSellOpenOptions({
        holdings: [holding(ALICE, 10n), holding(BOB, 50n)],
        accounts: [ledger(ALICE), keypair(BOB)],
        selectedAddress: ALICE,
      }),
    ).toBeNull()
    expect(
      pickTaoSellOpenOptions({
        holdings: [holding(ALICE, 0n), holding(BOB, 50n)],
        accounts: [keypair(ALICE), keypair(BOB)],
        selectedAddress: ALICE,
      }),
    ).toBeNull()
  })

  it("with all accounts shown, sells from the keypair account holding the most TAO", () => {
    expect(
      pickTaoSellOpenOptions({
        holdings: [holding(ALICE, 5n), holding(BOB, 20n), holding(CHARLIE, 10n)],
        accounts: [keypair(ALICE), keypair(BOB), keypair(CHARLIE)],
      }),
    ).toEqual(taoSell(BOB))
  })

  it("skips accounts that can't sign without a prompt, aren't owned, or hold no TAO", () => {
    expect(
      pickTaoSellOpenOptions({
        holdings: [
          holding(ALICE, 2n), // keypair: the only one that qualifies
          holding(BOB, 100n), // ledger
          holding(CHARLIE, 0n), // keypair, no TAO
          holding(DAVE, 50n), // not an owned account
        ],
        accounts: [keypair(ALICE), ledger(BOB), keypair(CHARLIE)],
        selectedAddress: null,
      }),
    ).toEqual(taoSell(ALICE))
  })

  it("skips keypair accounts without an SS58 address", () => {
    expect(
      pickTaoSellOpenOptions({
        holdings: [holding(ETHEREUM, 100n)],
        accounts: [keypair(ETHEREUM)],
      }),
    ).toBeNull()
  })

  it("returns null when no account qualifies", () => {
    expect(pickTaoSellOpenOptions({ holdings: [], accounts: [keypair(ALICE)] })).toBeNull()
    expect(
      pickTaoSellOpenOptions({
        holdings: [holding(ALICE, 0n), holding(BOB, 30n)],
        accounts: [keypair(ALICE), ledger(BOB)],
      }),
    ).toBeNull()
  })
})
