import { classNames } from "@taostats-wallet/util"
import { Settings01 } from "@untitledui/icons/Settings01"
import { useCallback, useMemo } from "react"

import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"

type BittensorSelectButtonProps = {
  isLoading?: boolean
  isDisabled?: boolean
  label: string
  nextStep: "select-delegate" | "select-subnet"
}

export const BittensorSelectButton = ({
  isLoading,
  isDisabled,
  label,
  nextStep,
}: BittensorSelectButtonProps) => {
  const { setStep, step, stakeDirection } = useBittensorStakeWizard()

  const isBtnDisabled = useMemo(() => isDisabled || !step.includes("form"), [step, isDisabled])

  const handleClick = useCallback(() => {
    if (isBtnDisabled) return
    if (stakeDirection === "unstake") setStep("select-position")
    else setStep(nextStep)
  }, [isBtnDisabled, nextStep, setStep, stakeDirection])

  if (isLoading)
    return (
      <div
        className={
          "text-fg-disabled bg-tertiary rounded-xs my-[4.5px] h-[16px] w-20 animate-pulse"
        }
      />
    )

  return (
    <button
      onClick={handleClick}
      className={classNames(
        "bg-pill hover:bg-tertiary flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1 text-xs font-light",
        isBtnDisabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Settings01 className="text-fg-secondary" />
      <div>{label}</div>
    </button>
  )
}
