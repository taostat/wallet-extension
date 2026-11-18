// The SDK-free entrypoint: this notice is on the portfolio pages' first load.
import {
  CrossChainSellRecord,
  sellAttention,
  SellAttention,
  sellsNeedingAttention,
} from "@taostats-wallet/cross-chain/config"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { cn } from "@taostats-wallet/util"
import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { useAccounts } from "@ui/state"

import { IS_CROSS_CHAIN_SELL_BUILD, useIsCrossChainSellEnabled } from "./crossChainSellGate"
import { useCrossChainSells, useSellsInFlight } from "./records/sellRecordsStore"
import { useCrossChainSellModal } from "./useCrossChainSellModal"

/** The most pressing first: money waiting to be moved, then a send to check. */
const ATTENTION_ORDER: readonly SellAttention[] = ["moveRefund", "returnAlpha", "unconfirmed"]

/**
 * "Swap needs attention": a compact notice on the portfolio while a cross-chain sell of one of the
 * wallet's accounts needs the user (a refund to move, alpha to move back, a send to check). Opens
 * Recent cross-chain swaps. Nothing when there is none, or with sells off.
 */
export const CrossChainAttentionNotice: FC<{ className?: string }> = ({ className }) =>
  IS_CROSS_CHAIN_SELL_BUILD ? <NoticeHost className={className} /> : null

/** Asks whether sells are on (our API) only once a record needs the user. */
const NoticeHost: FC<{ className?: string }> = ({ className }) => {
  const records = useCrossChainSells()
  if (!records.some((record) => sellAttention(record) !== null)) return null
  return <AttentionNotice records={records} className={className} />
}

const AttentionNotice: FC<{ records: CrossChainSellRecord[]; className?: string }> = ({
  records,
  className,
}) => {
  const { t } = useTranslation()
  const isEnabled = useIsCrossChainSellEnabled()
  const accounts = useAccounts()
  const { openRecent } = useCrossChainSellModal()
  const inFlight = useSellsInFlight()

  const needing = sellsNeedingAttention(records, (address) =>
    accounts.some((account) => isAddressEqual(account.address, address)),
  ).filter((record) => !inFlight.has(record.id))
  const kind = ATTENTION_ORDER.find((attention) =>
    needing.some((record) => sellAttention(record) === attention),
  )
  if (!isEnabled || !kind) return null

  const description =
    kind === "moveRefund"
      ? t("A swap was refunded as USDC to your account's EVM address.")
      : kind === "returnAlpha"
        ? t("A swap didn't open and left your alpha at your account's EVM address.")
        : t("A swap was sent but isn't confirmed yet.")

  return (
    <button
      type="button"
      onClick={openRecent}
      className={cn(
        "bg-orange-secondary/10 hover:bg-orange-secondary/20 flex w-full items-center gap-3 rounded-sm p-3 text-left text-xs transition-colors",
        className,
      )}
    >
      <AlertTriangle className="text-fg-orange shrink-0 text-base" />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="text-fg-orange font-bold">{t("Swap needs attention")}</span>
        <span className="text-fg-secondary">{description}</span>
      </span>
      <ChevronRight className="text-fg-secondary shrink-0 text-base" />
    </button>
  )
}
