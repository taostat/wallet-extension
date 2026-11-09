import { classNames } from "@taostats-wallet/util"
import { FC } from "react"

export const Spacer: FC<{
  large?: boolean
  small?: boolean
  className?: string
}> = ({ large, small, className }) => (
  <div className={classNames(large ? "h-8" : small ? "h-4" : "h-6", className)} />
)
