import { Balances } from "@taostats-wallet/balances"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { useBittensorStakeModal } from "@ui/domains/Staking/Bittensor/hooks/useBittensorStakeModal"
import { useAccounts } from "@ui/state"
import { useBittensorNetworkIds } from "@ui/state/bittensor"

import { BittensorUnstakeButton } from "../BittensorUnstakeButton"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock("@taostats-wallet/crypto", () => ({
  isAddressEqual: (left: string, right: string) => left === right,
}))

jest.mock("@ui/domains/Staking/Bittensor/hooks/useBittensorStakeModal", () => ({
  useBittensorStakeModal: jest.fn(),
}))

jest.mock("@ui/state", () => ({
  useAccounts: jest.fn(),
}))

jest.mock("@ui/state/bittensor", () => ({
  useBittensorNetworkIds: jest.fn(),
}))

describe("BittensorUnstakeButton", () => {
  it("exposes the unstake control by name and opens the wizard", () => {
    const open = jest.fn()
    const address = "test-address"
    const networkId = "bittensor"
    const netuid = 1
    const hotkey = "test-hotkey"

    jest.mocked(useBittensorStakeModal).mockReturnValue({
      isOpen: false,
      open,
      close: jest.fn(),
    } as ReturnType<typeof useBittensorStakeModal>)
    jest.mocked(useAccounts).mockReturnValue([{ address }] as ReturnType<typeof useAccounts>)
    jest.mocked(useBittensorNetworkIds).mockReturnValue([networkId])

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
