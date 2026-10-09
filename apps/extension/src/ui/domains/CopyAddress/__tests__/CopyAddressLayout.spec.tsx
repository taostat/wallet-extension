import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { CopyAddressLayout } from "../CopyAddressLayout"
import { useCopyAddressModal } from "../useCopyAddressModal"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock("../useCopyAddressModal", () => ({
  useCopyAddressModal: jest.fn(),
}))

describe("CopyAddressLayout", () => {
  it("exposes the close control by name and closes the modal", () => {
    const close = jest.fn()
    jest.mocked(useCopyAddressModal).mockReturnValue({
      isOpen: false,
      open: jest.fn(),
      close,
      inputs: {},
    } as ReturnType<typeof useCopyAddressModal>)

    render(<CopyAddressLayout title="Copy address" />)

    const closeButton = screen.getByRole("button", { name: "Close" })
    fireEvent.click(closeButton)

    expect(close).toHaveBeenCalled()
  })
})
