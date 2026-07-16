import { classNames } from "@taostats-wallet/util"
import { Wallet01 } from "@untitledui/icons/Wallet01"
import { ReactNode } from "react"

export const AllAccountsIcon = ({ className }: { className?: string }) => (
  <AccountsIconContainer className={classNames("bg-fg-brand/15 rounded-md", className)}>
    <Wallet01 className="text-fg-brand w-full" />
  </AccountsIconContainer>
)

export const AccountsIconContainer = ({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) => (
  <div
    className={classNames(
      "bg-tertiary flex h-[1em] w-[1em] items-center justify-center rounded-full p-[0.25em]",
      className,
    )}
  >
    {children}
  </div>
)
