import { CrossChainSellRecord, sellAttention } from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { FC, ReactNode, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"
import { DistanceToNow } from "@ui/domains/Transactions/TxHistory/DistanceToNow"
import { useAccountByAddress } from "@ui/state"

import { canAccountSellCrossChain } from "../crossChainSellGate"
import {
  removeCrossChainSell,
  useCrossChainSells,
  useMarkRecentSwapsOpen,
  useSellsInFlight,
} from "../records/sellRecordsStore"
import { etherscanAddressUrl, ExtrinsicLink, SellLayout } from "../sell/components"
import { useCrossChainSellModal } from "../useCrossChainSellModal"
import { MoveRefund } from "./MoveRefund"
import { amountText, recordSymbol } from "./recordDisplay"
import { ReturnAlpha } from "./ReturnAlpha"
import { useUnconfirmedCheck } from "./useUnconfirmedCheck"

/**
 * Recent cross-chain swaps: this browser's sells, newest first, each with where it stands, when, who
 * receives and its links, and what it needs from the user: "Check again" for a send not confirmed
 * yet, "Move refund" for a refund at the account's EVM address, "Move back to this account" for
 * alpha left there. The actions that sign are only for accounts this wallet can sign with. While
 * it is open, every unfinished order is followed (`useMarkRecentSwapsOpen`).
 */
export const RecentSwaps: FC<{ onBack?: () => void; onClose?: () => void }> = ({
  onBack,
  onClose,
}) => {
  useMarkRecentSwapsOpen()
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const records = useCrossChainSells()
  const [recovery, setRecovery] = useState<{ kind: "refund" | "alpha"; id: string } | null>(null)
  const recoveryRecord = recovery ? records.find((record) => record.id === recovery.id) : undefined

  if (recovery && recoveryRecord) {
    const back = () => setRecovery(null)
    return recovery.kind === "refund" ? (
      <MoveRefund record={recoveryRecord} onBack={back} />
    ) : (
      <ReturnAlpha record={recoveryRecord} onBack={back} />
    )
  }

  return (
    <SellLayout title={t("Recent cross-chain swaps")} onBack={onBack} onClose={onClose ?? close}>
      {records.length === 0 ? (
        <div className="text-fg-secondary py-10 text-center text-sm">
          {t("No cross-chain swaps yet.")}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {records.map((record) => (
            <RecentSwapRow
              key={record.id}
              record={record}
              onMoveRefund={() => setRecovery({ kind: "refund", id: record.id })}
              onReturnAlpha={() => setRecovery({ kind: "alpha", id: record.id })}
            />
          ))}
        </ul>
      )}
    </SellLayout>
  )
}

type PillTone = "neutral" | "success" | "warning" | "error"

const StatusPill: FC<{ tone: PillTone; children: ReactNode }> = ({ tone, children }) => (
  <span
    className={cn(
      "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold",
      tone === "neutral" && "bg-tertiary text-fg-secondary",
      tone === "success" && "bg-brand-secondary text-fg-success",
      tone === "warning" && "bg-orange-secondary/10 text-fg-orange",
      tone === "error" && "bg-error-secondary/10 text-fg-error",
    )}
  >
    {children}
  </span>
)

/** Where a sell stands, as a pill. */
const useStatus = (record: CrossChainSellRecord, isInFlight: boolean): [string, PillTone] => {
  const { t } = useTranslation()
  if (isInFlight) return [t("Swap in progress"), "neutral"]
  switch (record.status) {
    case "open":
      return [t("Delivering"), "neutral"]
    case "awaiting-refund":
      return [t("Refund pending"), "warning"]
    case "filled":
      return [t("Delivered"), "success"]
    case "refunded":
      return [t("Refunded"), record.refundMove ? "neutral" : "warning"]
    case "unconfirmed":
      return [t("Not confirmed yet"), "warning"]
    case "notOpened":
      return record.strandedAlpha && !record.strandedAlpha.returned
        ? [t("Action needed"), "warning"]
        : [t("Didn't open"), "error"]
    case "notIncluded":
      return [t("Not sent"), "neutral"]
  }
}

const RecentSwapRow: FC<{
  record: CrossChainSellRecord
  onMoveRefund: () => void
  onReturnAlpha: () => void
}> = ({ record, onMoveRefund, onReturnAlpha }) => {
  const { t } = useTranslation()
  const isInFlight = useSellsInFlight().has(record.id)
  const [label, tone] = useStatus(record, isInFlight)
  const symbol = recordSymbol(record)
  const pair = t("{{amountIn}} → {{amountOut}}", {
    amountIn: amountText(record.amountIn, symbol),
    amountOut: amountText(record.amountOut, record.to),
  })

  return (
    <li className="bg-secondary flex flex-col gap-2 rounded p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <span className="text-fg-primary min-w-0 break-words text-sm">{pair}</span>
        <StatusPill tone={tone}>{label}</StatusPill>
      </div>
      <div className="text-fg-secondary flex flex-wrap items-center gap-x-1">
        <DistanceToNow timestamp={record.createdAt} />
        <span aria-hidden>·</span>
        <span>
          {t("To")} <span className="font-mono">{shortenAddress(record.recipient, 6, 4)}</span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {record.extrinsicHash ? <ExtrinsicLink hash={record.extrinsicHash} /> : null}
        {record.status === "filled" ? (
          <a
            href={etherscanAddressUrl(record.recipient)}
            target="_blank"
            rel="noreferrer noopener"
            className="text-fg-brand hover:text-fg-primary inline-flex items-center gap-1"
          >
            {t("View recipient")}
            <LinkExternal01 className="shrink-0" />
          </a>
        ) : null}
      </div>
      {isInFlight ? null : (
        <RowDetails record={record} onMoveRefund={onMoveRefund} onReturnAlpha={onReturnAlpha} />
      )}
    </li>
  )
}

/** What the sell needs, or what became of it. */
const RowDetails: FC<{
  record: CrossChainSellRecord
  onMoveRefund: () => void
  onReturnAlpha: () => void
}> = ({ record, onMoveRefund, onReturnAlpha }) => {
  const { t } = useTranslation()
  const account = useAccountByAddress(record.address)
  const canSign = canAccountSellCrossChain(account)
  const attention = sellAttention(record)
  const where = t("your account's EVM address on {{network}}", { network: "Bittensor" })

  switch (attention) {
    case "unconfirmed":
      return <UnconfirmedDetails record={record} />
    case "moveRefund":
      return (
        <RowNote
          action={
            canSign ? (
              <Button small primary onClick={onMoveRefund}>
                {t("Move refund")}
              </Button>
            ) : null
          }
        >
          {t("Your swap wasn't filled in time and was refunded as USDC to {{where}}.", { where })}
        </RowNote>
      )
    case "returnAlpha":
      return (
        <RowNote
          action={
            canSign ? (
              <Button small primary onClick={onReturnAlpha}>
                {t("Move back to this account")}
              </Button>
            ) : null
          }
        >
          {t("Your {{symbol}} is at your account's EVM address", { symbol: recordSymbol(record) })}
        </RowNote>
      )
    case null:
      break
  }

  if (record.status === "awaiting-refund")
    return (
      <RowNote>
        {t(
          "No solver filled your swap in time, so it's being refunded as USDC to {{where}}. This happens on its own.",
          { where },
        )}
      </RowNote>
    )
  if (record.status === "refunded" && record.refundMove?.to)
    return (
      <RowNote>
        <span>
          <Trans
            t={t}
            defaults="Refund moved to <Address>{{address}}</Address> on Bittensor EVM."
            components={{ Address: <span className="font-mono" /> }}
            values={{ address: shortenAddress(record.refundMove.to, 6, 4) }}
          />
        </span>
        {record.refundMove.hash ? <ExtrinsicLink hash={record.refundMove.hash} /> : null}
      </RowNote>
    )
  if (record.status === "notOpened" && record.strandedAlpha?.returned)
    return (
      <RowNote>
        {record.strandedAlpha.returned.amount ? (
          <span>
            {t("{{amount}} moved back to this account.", {
              amount: amountText(record.strandedAlpha.returned.amount, recordSymbol(record)),
            })}
          </span>
        ) : null}
        {record.strandedAlpha.returned.hash ? (
          <ExtrinsicLink hash={record.strandedAlpha.returned.hash} />
        ) : null}
      </RowNote>
    )
  if (record.status === "notOpened" && record.from.kind === "tao")
    return (
      <RowNote>
        {t("Your TAO is at your account's EVM address on Bittensor, and your next swap uses it.")}
      </RowNote>
    )
  if (record.status === "notIncluded")
    return <RowNote>{t("Nothing moved: the transaction didn't go through.")}</RowNote>
  return null
}

const RowNote: FC<{ children: ReactNode; action?: ReactNode }> = ({ children, action }) => (
  <div className="border-primary flex flex-col gap-2 border-t pt-2">
    <div className="text-fg-secondary flex flex-col gap-1 leading-normal">{children}</div>
    {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
  </div>
)

/**
 * A send not seen in a block: looked up when shown and on "Check again" (a read, never a resend).
 * "Remove" only forgets it here: an order it opened is delivered or refunded on its own.
 */
const UnconfirmedDetails: FC<{ record: CrossChainSellRecord }> = ({ record }) => {
  const { t } = useTranslation()
  const { result, isChecking, hasFailed, check } = useUnconfirmedCheck(record, false)

  return (
    <RowNote
      action={
        <>
          <Button small onClick={check} processing={isChecking} disabled={isChecking}>
            {t("Check again")}
          </Button>
          <Button small onClick={() => void removeCrossChainSell(record.id)} disabled={isChecking}>
            {t("Remove")}
          </Button>
        </>
      }
    >
      {isChecking ? null : hasFailed || result === "unknown" ? (
        <span>{t("Couldn't check it just now. Try again, or look it up on Taostats.")}</span>
      ) : result === "pending" ? (
        <span>{t("Not in a block yet. It may still be included: check again in a moment.")}</span>
      ) : null}
      <span>
        {t(
          "Removing it only hides it here: a swap it opened is still delivered or refunded on its own.",
        )}
      </span>
    </RowNote>
  )
}
