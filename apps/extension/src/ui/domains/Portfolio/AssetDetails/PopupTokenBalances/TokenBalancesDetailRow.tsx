import { TokenId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { Lock01 } from "@untitledui/icons/Lock01"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { Fiat } from "@ui/domains/Asset/Fiat"
import { Tokens } from "@ui/domains/Asset/Tokens"
import { BalancesStatus } from "@ui/hooks/useBalancesStatus"

import { StaleBalancesIcon } from "../../StaleBalancesIcon"
import { PortfolioAccount } from "../PortfolioAccount"
import { BalanceDetailRow } from "../useTokenBalances"
import { LockedExtra } from "./LockedExtra"

type TokenBalancesDetailRowProps = {
  row: BalanceDetailRow
  isLastRow?: boolean
  status: BalancesStatus
  symbol: string
  tokenId: TokenId
}

export const TokenBalancesDetailRow = ({
  row,
  isLastRow,
  status,
  symbol,
  tokenId,
}: TokenBalancesDetailRowProps) => {
  return (
    <div
      className={classNames(
        "bg-secondary flex w-full items-center gap-4 px-3.5 py-3",
        isLastRow && "rounded-b-sm",
      )}
    >
      <div className="flex grow flex-col justify-center gap-1 overflow-hidden">
        <div className="flex h-5 w-full items-center gap-1 font-bold text-white">
          <div className="truncate capitalize">{row.title}</div>
          {!!row.locked && tokenId && row.meta && (
            <LockedExtra
              tokenId={tokenId}
              address={row.address}
              isLoading={status.status === "fetching" || !!row.isLoading}
              rowMeta={row.meta}
            />
          )}
        </div>
        {!!row.address && (
          <div className="text-xs">
            <PortfolioAccount address={row.address} />
          </div>
        )}
        {!row.address && row.isLoading && !row.description && row.locked && (
          <div className="bg-secondary rounded-xs h-[14px] max-w-24 animate-pulse" />
        )}
        {!row.address && row.description && (
          <div className="text-left text-xs">
            <Tooltip>
              <TooltipTrigger className="max-w-full truncate">{row.description}</TooltipTrigger>
              <TooltipContent className="rounded-xs text-fg-secondary border-primary z-20 border-[0.5px] bg-black p-1.5 text-[11px] shadow">
                {row.description}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <div
        className={classNames(
          "flex flex-col flex-nowrap items-end justify-center gap-1 whitespace-nowrap",
          status.status === "fetching" && "animate-pulse transition-opacity",
        )}
      >
        <div
          className={classNames(
            "flex h-5 items-center gap-1 font-bold",
            row.locked ? "text-fg-secondary" : "text-white",
          )}
        >
          <Tokens amount={row.tokens} symbol={symbol} isBalance />
          {row.locked ? <Lock01 className="lock shrink-0" /> : null}
          {status.status === "stale" ? (
            <StaleBalancesIcon className="shrink-0" staleChains={status.staleChains} />
          ) : null}
        </div>
        <div className="text-xs">
          {row.fiat === null ? "-" : <Fiat amount={row.fiat} isBalance />}
        </div>
      </div>
    </div>
  )
}
