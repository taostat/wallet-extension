import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import { useStakeButton } from "../hooks/useStakeButton"
import { StakeButton } from "../StakeButton"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("../hooks/useStakeButton", () => ({
  useStakeButton: vi.fn(),
}))

describe("StakeButton", () => {
  it("exposes the stake control by name and calls its handler", () => {
    const onClick = vi.fn()
    vi.mocked(useStakeButton).mockReturnValue({
      canStake: true,
      onClick,
      isStaking: false,
    } as ReturnType<typeof useStakeButton>)

    render(<StakeButton balances={{ each: [] } as never} />)

    const stakeButton = screen.getByRole("button", { name: "Stake" })
    fireEvent.click(stakeButton)

    expect(onClick).toHaveBeenCalled()
  })
})
