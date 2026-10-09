import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { ChainFormatButton } from "../CopyAddressChainForm"
import { ChainFormat } from "../CopyAddressFormatPickerDrawer"
import { useCopyAddressWizard } from "../useCopyAddressWizard"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ defaults }: { defaults: string }) => defaults,
}))

jest.mock("@taostats-wallet/crypto", () => ({
  encodeAnyAddress: jest.fn(),
  isEthereumAddress: jest.fn(),
  normalizeAddress: jest.fn(),
}))

jest.mock("@taostats-wallet/icons", () => ({
  PolkadotIcon: () => null,
  QrIcon: () => null,
}))

jest.mock("extension-core", () => ({
  getAccountGenesisHash: jest.fn(),
  isAccountLedgerPolkadotGeneric: jest.fn(),
}))

jest.mock("@ui/hooks/useBalancesFiatTotalPerNetwork", () => ({
  useBalancesFiatTotalPerNetwork: jest.fn(),
}))

jest.mock("@ui/state", () => ({
  useAccountByAddress: jest.fn(),
  useBalancesByAddress: jest.fn(),
  useFeatureFlag: jest.fn(),
  useNetworkById: jest.fn(),
  useNetworks: jest.fn(),
  useRemoteConfig: jest.fn(),
}))

jest.mock("../../Networks/NetworkLogo", () => ({
  NetworkLogo: function MockNetworkLogo() {
    return null
  },
}))

jest.mock("../useCopyAddressWizard", () => ({
  useCopyAddressWizard: jest.fn(),
}))

jest.mock("../CopyAddressLayout", () => ({
  CopyAddressLayout: ({ children }: { children: React.ReactNode }) => children,
}))

describe("ChainFormatButton", () => {
  const mockSetChainId = jest.fn()
  const mockCopySpecific = jest.fn()

  beforeEach(() => {
    jest.mocked(useCopyAddressWizard).mockReturnValue({
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
