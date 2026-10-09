import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"

import { useStakeButton } from "../hooks/useStakeButton"
import { StakeButton } from "../StakeButton"

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock("../hooks/useStakeButton", () => ({
  useStakeButton: jest.fn(),
}))

describe("StakeButton", () => {
  it("exposes the stake control by name and calls its handler", () => {
    const onClick = jest.fn()
    jest.mocked(useStakeButton).mockReturnValue({
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
