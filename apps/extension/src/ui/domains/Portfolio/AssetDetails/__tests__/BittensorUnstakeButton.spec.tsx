import { Balances } from "@taostats-wallet/balances"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { useBittensorStakeModal } from "@ui/domains/Staking/Bittensor/hooks/useBittensorStakeModal"
import { useAccounts } from "@ui/state"
import { useBittensorNetworkIds } from "@ui/state/bittensor"

import { BittensorUnstakeButton } from "../BittensorUnstakeButton"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@taostats-wallet/crypto", () => ({
  isAddressEqual: (left: string, right: string) => left === right,
}))

vi.mock("@ui/domains/Staking/Bittensor/hooks/useBittensorStakeModal", () => ({
  useBittensorStakeModal: vi.fn(),
}))

vi.mock("@ui/state", () => ({
  useAccounts: vi.fn(),
}))

vi.mock("@ui/state/bittensor", () => ({
  useBittensorNetworkIds: vi.fn(),
}))

describe("BittensorUnstakeButton", () => {
  it("exposes the unstake control by name and opens the wizard", () => {
    const open = vi.fn()
    const address = "test-address"
    const networkId = "bittensor"
    const netuid = 1
    const hotkey = "test-hotkey"

    vi.mocked(useBittensorStakeModal).mockReturnValue({
      isOpen: false,
      open,
      close: vi.fn(),
    } as ReturnType<typeof useBittensorStakeModal>)
    vi.mocked(useAccounts).mockReturnValue([{ address }] as ReturnType<typeof useAccounts>)
    vi.mocked(useBittensorNetworkIds).mockReturnValue([networkId])

    const balances = {
      each: [
        {
          address,
          free: { planck: 1n },
          token: { type: "substrate-dtao", networkId, netuid, hotkey },
        },
      ],
    } as unknown as Balances

    render(<BittensorUnstakeButton balances={balances} />)

    const unstakeButton = screen.getByRole("button", { name: "Unstake" })
    fireEvent.click(unstakeButton)

    expect(open).toHaveBeenCalledWith({
      networkId,
      address,
      netuid,
      hotkey,
      stakeDirection: "unstake",
    })
  })
})
