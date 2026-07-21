import { classNames } from "@taostats-wallet/util"
import { FC } from "react"

export const BalanceSeparator: FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden className={classNames("text-fg-brand text-[0.9em]", className)}>
    //
  </span>
)
