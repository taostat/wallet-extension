import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChainFormatButton } from "../CopyAddressChainForm"
import { ChainFormat } from "../CopyAddressFormatPickerDrawer"
import { useCopyAddressWizard } from "../useCopyAddressWizard"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ defaults }: { defaults: string }) => defaults,
}))

vi.mock("@taostats-wallet/crypto", () => ({
  encodeAnyAddress: vi.fn(),
  isEthereumAddress: vi.fn(),
  normalizeAddress: vi.fn(),
}))

vi.mock("@taostats-wallet/icons", () => ({
  PolkadotIcon: () => null,
  QrIcon: () => null,
}))

vi.mock("extension-core", () => ({
  getAccountGenesisHash: vi.fn(),
  isAccountLedgerPolkadotGeneric: vi.fn(),
}))

vi.mock("@ui/hooks/useBalancesFiatTotalPerNetwork", () => ({
  useBalancesFiatTotalPerNetwork: vi.fn(),
}))

vi.mock("@ui/state", () => ({
  useAccountByAddress: vi.fn(),
  useBalancesByAddress: vi.fn(),
  useFeatureFlag: vi.fn(),
  useNetworkById: vi.fn(),
  useNetworks: vi.fn(),
  useRemoteConfig: vi.fn(),
}))

vi.mock("../../Networks/NetworkLogo", () => ({
  NetworkLogo: function MockNetworkLogo() {
    return null
  },
}))

vi.mock("../useCopyAddressWizard", () => ({
  useCopyAddressWizard: vi.fn(),
}))

vi.mock("../CopyAddressLayout", () => ({
  CopyAddressLayout: ({ children }: { children: React.ReactNode }) => children,
}))

describe("ChainFormatButton", () => {
  const mockSetChainId = vi.fn()
  const mockCopySpecific = vi.fn()

  beforeEach(() => {
    vi.mocked(useCopyAddressWizard).mockReturnValue({
      setChainId: mockSetChainId,
      copySpecific: mockCopySpecific,
    } as unknown as ReturnType<typeof useCopyAddressWizard>)
  })

  it("names the QR and copy controls and selects the chain for the QR", () => {
    const format: ChainFormat = {
      key: "polkadot",
      chainId: "polkadot",
      prefix: 0,
      name: "Polkadot",
      address: "1zug1W3mJj6VF6i4fTEjXUL6H3RzQ4zK5aeuAEZfyjrw1",
    }

    render(<ChainFormatButton format={format} />)

    const qrButton = screen.getByRole("button", { name: "Show QR code" })
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeTruthy()

    fireEvent.click(qrButton)

    expect(mockSetChainId).toHaveBeenCalledWith("polkadot")
  })
})
