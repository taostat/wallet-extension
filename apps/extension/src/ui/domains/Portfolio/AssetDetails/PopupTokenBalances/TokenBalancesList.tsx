import { Balances } from "@taostats-wallet/balances"
import { TokenId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { ReactNode, Suspense } from "react"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { TokenLogo } from "@ui/domains/Asset/TokenLogo"
import { StakeButton } from "@ui/domains/Staking/Stake/StakeButton"
import { useToken } from "@ui/state"
import { getTokenName } from "@ui/util/getTokenName"

import { BittensorUnstakeButton } from "../BittensorUnstakeButton"
import { CopyAddressButton } from "../CopyAddressIconButton"
import { BittensorValidatorName } from "../DashboardTokenBalances/BittensorValidatorName"
import { SendFundsTokenButton } from "../SendFundsTokenIconButton"
import { TokenContextMenu } from "../TokenContextMenu"

type TokenBalancesListProps = {
  tokenId: TokenId
  balances: Balances
  detailRowsLength: number
  chainOrNetworkId: string
  children: ReactNode
}

export const TokenBalancesList = ({
  tokenId,
  balances,
  detailRowsLength,
  chainOrNetworkId,
  children,
}: TokenBalancesListProps) => {
  const token = useToken(tokenId)

  if (!token) return null

  return (
    <div className={classNames("text-fg-secondary text-sm")}>
      <div
        className={classNames(
          "bg-secondary flex w-full items-center gap-2 overflow-hidden border-transparent px-3.5 py-3",
          detailRowsLength ? "rounded-t-sm" : "rounded",
        )}
      >
        <div className="text-xl">
          <TokenLogo tokenId={tokenId} />
        </div>
        <div className="flex grow flex-col justify-center gap-1 overflow-hidden pr-4">
          <div className="flex grow items-center gap-1.5">
            <div className="text-fg-primary truncate font-bold">{getTokenName(token.name)}</div>
            <div className="flex items-center">
              <CopyAddressButton networkId={chainOrNetworkId} />
              <BittensorUnstakeButton balances={balances} />
              <Suspense fallback={<SuspenseTracker name="ChainTokenBalances.Buttons" />}>
                <SendFundsTokenButton tokenId={tokenId} />
              </Suspense>
            </div>
          </div>
          <div className="flex w-full items-center gap-1 overflow-hidden">
            <span className="truncate">
              {token.type === "substrate-dtao" && (
                <BittensorValidatorName
                  hotkey={token.hotkey}
                  className="text-fg-secondary text-sm"
                />
              )}
            </span>
          </div>
        </div>
        <div className="size-[38px] shrink-0 empty:hidden">
          <Suspense fallback={<SuspenseTracker name="StakeButton" />}>
            <StakeButton balances={balances} />
          </Suspense>
        </div>
        {tokenId && (
          <div className="size-[38px] shrink-0">
            <TokenContextMenu
              tokenId={tokenId}
              className="hover:bg-tertiary focus-visible:bg-tertiary rounded-full"
            />
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
