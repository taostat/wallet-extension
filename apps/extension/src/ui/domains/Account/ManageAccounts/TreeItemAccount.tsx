import { classNames } from "@taostats-wallet/util"
import { Account, getAccountGenesisHash } from "extension-core"
import { FC, useMemo } from "react"

import { CopyAddressIconButton } from "@taostats/components/CopyAddressIconButton"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { Address } from "@ui/domains/Account/Address"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { useFormattedAddressForAccount } from "@ui/hooks/useFormattedAddress"

import { AccountContextMenu } from "../AccountContextMenu"

export const TreeItemAccount: FC<{
  accounts: Account[]
  address: string
  balanceTotalPerAccount: Record<string, number>
  isInFolder?: boolean
  noTooltip?: boolean
}> = ({ accounts, address, balanceTotalPerAccount, isInFolder, noTooltip }) => {
  const account = useMemo(
    () => accounts.find((account) => account.address === address),
    [accounts, address],
  )
  const balanceTotal = balanceTotalPerAccount[account?.address ?? ""] ?? 0
  const formattedAddress = useFormattedAddressForAccount(account)

  if (!account) return null

  return (
    <div className={classNames("@container relative flex items-center")}>
      <div
        className={classNames(
          "border-primary bg-secondary-solid gap-md px-lg flex min-h-[72px] w-full flex-grow items-center overflow-hidden rounded-lg border py-4",
          isInFolder && "pr-2",
        )}
      >
        <AccountIcon
          className="text-xl"
          address={address}
          genesisHash={getAccountGenesisHash(account)}
        />
        <div className="flex grow flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1">
            <div className="text-fg-primary overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
              {account.name}
            </div>
            <AccountTypeIcon
              className="text-fg-brand"
              type={account.type}
              signetUrl={account.type === "signet" ? account.url : undefined}
            />
          </div>
          <div className="text-fg-secondary flex items-center gap-1 text-xs">
            <Address address={formattedAddress} noTooltip={noTooltip} />
            <CopyAddressIconButton address={formattedAddress} iconClassName="size-3.5" />
          </div>
        </div>
        <div className="@2xl:flex text-fg-brand hidden flex-col gap-1">
          <Fiat amount={balanceTotal} isBalance noCountUp />
        </div>

        <div data-no-dnd="true">
          <AccountContextMenu
            analyticsFrom="settings - accounts"
            address={address}
            hideManageAccounts
          />
        </div>
      </div>
    </div>
  )
}
