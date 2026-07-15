import { classNames } from "@taostats-wallet/util"
import { Users01 } from "@untitledui/icons/Users01"
import { ReactNode } from "react"

export const AllAccountsIcon = ({ className }: { className?: string }) => (
  <AccountsIconContainer className={className}>
    <Users01 className="text-fg-brand w-full" />
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
