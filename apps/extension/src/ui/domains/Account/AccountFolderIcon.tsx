import { classNames } from "@taostats-wallet/util"
import { Folder } from "@untitledui/icons/Folder"

import { AccountsIconContainer } from "./AllAccountsIcon"

export const AccountFolderIcon = ({ className, color }: { className?: string; color?: string }) => (
  <AccountsIconContainer className={classNames("rounded-xs", className)}>
    <Folder className="text-primary w-full" style={{ color }} />
  </AccountsIconContainer>
)
