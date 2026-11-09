import { TokenId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"

import { AssetBalanceCellValue } from "@ui/domains/Portfolio/AssetBalanceCellValue"
import { BalancesStatus } from "@ui/hooks/useBalancesStatus"
import { isRootTaoHolding } from "@ui/domains/Portfolio/isRootTaoHolding"
import { useToken } from "@ui/state"

import { BalanceDetailRow } from "../useTokenBalances"
import { AssetState } from "./AssetState"
import { LockedExtra } from "./LockedExtra"

export const TokenBalancesDetailRow = ({
  row,
  isLastRow,
  status,
  symbol,
  tokenId,
}: {
  row: BalanceDetailRow
  isLastRow?: boolean
  status: BalancesStatus
  symbol: string
  tokenId: TokenId
}) => {
  const token = useToken(tokenId)
  const isRootTao = isRootTaoHolding(token)

  return (
    <div
      key={row.key}
      className={classNames("bg-secondary grid grid-cols-[40%_30%_30%]", isLastRow && "rounded-b")}
    >
      <div>
        <AssetState
          title={row.title}
          description={row.description}
          render
          address={row.address}
          isLoading={row.isLoading}
          locked={row.locked}
        />
      </div>
      {!row.locked && <div></div>}
      <div>
        <AssetBalanceCellValue
          render
          tokens={row.tokens}
          fiat={row.fiat}
          symbol={symbol}
          isRootTao={isRootTao}
          locked={row.locked}
          balancesStatus={status}
          className={classNames(
            (status.status === "fetching" || row.isLoading) && "animate-pulse transition-opacity",
          )}
        />
      </div>
      {!!row.locked && row.meta && tokenId && (
        <LockedExtra
          tokenId={tokenId}
          address={row.address}
          isLoading={status.status === "fetching"}
          rowMeta={row.meta}
        />
      )}
    </div>
  )
}
