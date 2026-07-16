import { classNames } from "@taostats-wallet/util"
import { Lock01 } from "@untitledui/icons/Lock01"
import BigNumber from "bignumber.js"
import { ReactNode } from "react"

import { WithTooltip } from "@taostats/components/Tooltip"
import { BalancesStatus } from "@ui/hooks/useBalancesStatus"

import { Fiat } from "../Asset/Fiat"
import { Tokens } from "../Asset/Tokens"
import { StaleBalancesIcon } from "./StaleBalancesIcon"

type Props = {
  locked?: boolean
  tokens: BigNumber | number
  fiat: number | null
  symbol: string
  render?: boolean
  className?: string
  tooltip?: ReactNode
  balancesStatus?: BalancesStatus
  noCountUp?: boolean
}

export const AssetBalanceCellValue = ({
  locked,
  tokens,
  fiat,
  symbol,
  render = true,
  className,
  tooltip,
  balancesStatus,
  noCountUp,
}: Props) => {
  if (!render) return null
  return (
    <WithTooltip tooltip={tooltip}>
      <div
        className={classNames(
          "flex h-[66px] flex-col justify-center gap-1 whitespace-nowrap p-4 text-right",
          className,
        )}
      >
        <div
          className={classNames(
            "flex items-center justify-end gap-1",
            locked ? "text-fg-secondary" : "text-fg-primary",
          )}
        >
          <div>
            <Tokens amount={tokens} symbol={symbol} isBalance noCountUp={noCountUp} />
          </div>
          {locked ? (
            <div className="pb-0.5">
              <Lock01 className="lock" />
            </div>
          ) : null}
          {balancesStatus?.status === "stale" ? (
            <div className="pb-0.5">
              <StaleBalancesIcon staleChains={balancesStatus.staleChains} />
            </div>
          ) : null}
        </div>
        <div>{fiat === null ? "-" : <Fiat amount={fiat} isBalance noCountUp={noCountUp} />}</div>
      </div>
    </WithTooltip>
  )
}
