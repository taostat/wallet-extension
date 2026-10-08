import { render, screen } from "@testing-library/react"
import React from "react"

import { Acknowledgement } from "../Acknowledgement"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("Acknowledgement", () => {
  it("uses seed phrase wording throughout the warning", () => {
    render(<Acknowledgement onContinueClick={jest.fn()} />)

    expect(screen.getByRole("heading", { name: "Protect Your Seed Phrase" })).toBeTruthy()
    expect(screen.getByText("Never pass the seed phrase from your wallet to anyone")).toBeTruthy()
    expect(
      screen.getByText(
        "Your seed phrase is the key to your account — it grants full access, just like your password and login combined. Keep it secure.",
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        "Anyone with access to this seed phrase can control your funds. Taostats cannot recover your assets if it's lost or stolen.",
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        "Never share your seed phrase with anyone — including websites, apps, or individuals. Taostats will never ask for it.",
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/private key/i)).toBeNull()
    expect(screen.queryByText(/recovery phrase/i)).toBeNull()
  })
})
