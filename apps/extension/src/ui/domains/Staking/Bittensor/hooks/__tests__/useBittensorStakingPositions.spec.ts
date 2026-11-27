import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAccounts, useBalances, useSelectedCurrency } from "@ui/state"
import { useBittensorValidatorsMap } from "@ui/state/bittensor"

import { useBittensorStakingPositions } from "../useBittensorStakingPositions"

vi.mock("@taostats-wallet/crypto", () => ({
  isAddressEqual: (left: string, right: string) => left.toLowerCase() === right.toLowerCase(),
}))

vi.mock("@ui/state", () => ({
  useAccounts: vi.fn(),
  useBalances: vi.fn(),
  useSelectedCurrency: vi.fn(),
}))

vi.mock("@ui/state/bittensor", () => ({
  useBittensorValidatorsMap: vi.fn(),
}))

const networkId = "bittensor"

const balance = (address: string, netuid: number, hotkey: string, fiat: number) => ({
  id: `${address}-${netuid}-${hotkey}`,
  address,
  free: { planck: 1n, fiat: () => fiat },
  token: { type: "substrate-dtao", networkId, netuid, hotkey },
})

describe("useBittensorStakingPositions", () => {
  beforeEach(() => {
    vi.mocked(useSelectedCurrency).mockReturnValue("usd")
    vi.mocked(useBittensorValidatorsMap).mockReturnValue({ data: {} } as ReturnType<
      typeof useBittensorValidatorsMap
    >)
    vi.mocked(useAccounts).mockReturnValue([
      { address: "alice", name: "Alice" },
      { address: "bob", name: "Bob" },
    ] as ReturnType<typeof useAccounts>)
    vi.mocked(useBalances).mockReturnValue({
      each: [
        balance("alice", 1, "v1", 40),
        balance("alice", 2, "v2", 30),
        balance("alice", 1, "v3", 20),
        balance("bob", 1, "v1", 10),
      ],
    } as unknown as ReturnType<typeof useBalances>)
  })

  const ids = (filter?: Parameters<typeof useBittensorStakingPositions>[1]) =>
    renderHook(() => useBittensorStakingPositions(networkId, filter)).result.current.map(
      (p) => p.id,
    )

  it("lists every owned account's positions without a filter", () => {
    expect(ids()).toEqual(["alice-1-v1", "alice-2-v2", "alice-1-v3", "bob-1-v1"])
  })

  it("lists only the given account's positions, on any subnet", () => {
    expect(ids({ address: "ALICE" })).toEqual(["alice-1-v1", "alice-2-v2", "alice-1-v3"])
  })

  it("lists only the given account's positions on the given subnet", () => {
    expect(ids({ address: "alice", netuid: 1 })).toEqual(["alice-1-v1", "alice-1-v3"])
  })

  it("treats root (netuid 0) as a subnet filter", () => {
    expect(ids({ address: "alice", netuid: 0 })).toEqual([])
  })

  it("ignores null filter values", () => {
    expect(ids({ address: null, netuid: null })).toHaveLength(4)
  })
})
