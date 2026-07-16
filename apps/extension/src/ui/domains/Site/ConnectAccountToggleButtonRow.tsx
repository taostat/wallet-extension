import { classNames } from "@taostats-wallet/util"
import { Account, getAccountGenesisHash, getAccountSignetUrl } from "extension-core"
import { FC } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { AccountIcon } from "../Account/AccountIcon"
import { AccountTypeIcon } from "../Account/AccountTypeIcon"
import { Address } from "../Account/Address"

export const ConnectAccountToggleButtonRow: FC<{
  account: Account
  showAddress?: boolean
  checked?: boolean
  onClick?: () => void
}> = ({ account, checked: isConnected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      "hover:bg-secondary flex h-12 w-full shrink-0 items-center gap-3 px-3",
      !isConnected && "text-fg-secondary",
    )}
  >
    <AccountIcon
      className="shrink-0 text-lg"
      address={account.address}
      genesisHash={getAccountGenesisHash(account)}
    />
    <div className="truncate text-left text-sm">
      <Tooltip placement="bottom-start">
        <TooltipTrigger asChild>
          <span>
            {account?.name ?? (
              <Address address={account.address} startCharCount={8} endCharCount={8} noTooltip />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <Address
            address={account.address}
            startCharCount={8}
            endCharCount={8}
            noTooltip
            noShorten
          />
        </TooltipContent>
      </Tooltip>
    </div>
    <AccountTypeIcon
      type={account.type}
      className="text-fg-brand"
      signetUrl={getAccountSignetUrl(account)}
    />
    <div className="grow"></div>
    <div
      className={classNames(
        "mx-1 h-2 w-2 shrink-0 rounded-full",
        isConnected ? "bg-fg-brand" : "bg-tertiary",
      )}
    ></div>
  </button>
)
