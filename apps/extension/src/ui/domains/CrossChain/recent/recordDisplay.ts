import { CrossChainSellRecord } from "@taostats-wallet/cross-chain"
import { formatDecimals } from "@taostats-wallet/util"

/** The sold token's symbol: TAO, or the subnet's alpha. */
export const recordSymbol = (record: CrossChainSellRecord) =>
  record.from.kind === "tao" ? "TAO" : (record.symbol ?? `SN${record.from.netuid}`)

/** A dot-decimal amount and its symbol, as the screens write it (`1.5 TAO`). */
export const amountText = (amount: string | undefined, symbol: string) =>
  amount === undefined ? symbol : `${formatDecimals(Number(amount))} ${symbol}`
