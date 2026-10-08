import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { Mnemonic } from "../Mnemonic"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe("Mnemonic", () => {
  it("exposes the reveal control by name and updates its pressed state", () => {
    render(<Mnemonic mnemonic="one two three" />)

    const revealButton = screen.getByRole("button", { name: "Reveal seed phrase" })
    expect(revealButton.getAttribute("aria-pressed")).toBe("false")

    fireEvent.click(revealButton)

    expect(revealButton.getAttribute("aria-pressed")).toBe("true")
  })
})
