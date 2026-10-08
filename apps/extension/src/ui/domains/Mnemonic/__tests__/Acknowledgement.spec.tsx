import { render, screen } from "@testing-library/react"
import React from "react"

import { Acknowledgement } from "../Acknowledgement"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("Acknowledgement", () => {
  it("uses recovery phrase wording throughout the warning", () => {
    render(<Acknowledgement onContinueClick={jest.fn()} />)

    expect(screen.getByRole("heading", { name: "Protect Your Recovery Phrase" })).toBeTruthy()
    expect(
      screen.getByText("Never pass the recovery phrase from your wallet to anyone"),
    ).toBeTruthy()
    expect(screen.getByText(/Your recovery phrase is the key to your account/)).toBeTruthy()
    expect(screen.getByText(/Anyone with access to this recovery phrase/)).toBeTruthy()
    expect(screen.getByText(/Never share your recovery phrase with anyone/)).toBeTruthy()
    expect(screen.queryByText(/private key/i)).toBeNull()
  })
})
