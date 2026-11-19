import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { CopyAddressLayout } from "../CopyAddressLayout"
import { useCopyAddressModal } from "../useCopyAddressModal"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("../useCopyAddressModal", () => ({
  useCopyAddressModal: vi.fn(),
}))

describe("CopyAddressLayout", () => {
  it("exposes the close control by name and closes the modal", () => {
    const close = vi.fn()
    vi.mocked(useCopyAddressModal).mockReturnValue({
      isOpen: false,
      open: vi.fn(),
      close,
      inputs: {},
    } as ReturnType<typeof useCopyAddressModal>)

    render(<CopyAddressLayout title="Copy address" />)

    const closeButton = screen.getByRole("button", { name: "Close" })
    fireEvent.click(closeButton)

    expect(close).toHaveBeenCalled()
  })
})
