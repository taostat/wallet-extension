import { getBlockExplorerUrls, Network } from "@taostats-wallet/chaindata-provider"
import { CrossChainErrorCode, crossChainErrorMessageKey } from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { Check } from "@untitledui/icons/Check"
import { CheckCircle } from "@untitledui/icons/CheckCircle"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { Copy01 } from "@untitledui/icons/Copy01"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { X } from "@untitledui/icons/X"
import { FC, PropsWithChildren, ReactNode, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { IconButton } from "taostats-ui"

import { useNetworkById } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "../constants"

/** The modal's frame: a header, a scrolling body and a fixed footer. */
export const SellLayout: FC<{
  title: ReactNode
  onBack?: () => void
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}> = ({ title, onBack, onClose, footer, children }) => (
  <div className="flex size-full flex-col overflow-hidden">
    <div className="text-fg-secondary flex h-16 w-full shrink-0 items-center px-5">
      <IconButton onClick={onBack} className={cn(!onBack && "invisible")}>
        <ChevronLeft />
      </IconButton>
      <div className="grow truncate text-center font-bold text-white">{title}</div>
      <IconButton onClick={onClose}>
        <X />
      </IconButton>
    </div>
    <div className="scrollable scrollable-800 flex min-h-0 grow flex-col gap-3 overflow-y-auto px-6 pb-4">
      {children}
    </div>
    {footer ? <div className="flex shrink-0 flex-col gap-3 px-6 pb-6 pt-2">{footer}</div> : null}
  </div>
)

type NoticeTone = "info" | "warning" | "error" | "success"

const NOTICE_ICONS = {
  info: InfoCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
} as const

/** A boxed message: what happened, and what to do about it. */
export const Notice: FC<PropsWithChildren<{ tone: NoticeTone; title?: ReactNode }>> = ({
  tone,
  title,
  children,
}) => {
  const Icon = NOTICE_ICONS[tone]
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex w-full gap-2 rounded-sm p-3 text-xs leading-normal",
        tone === "info" && "bg-secondary text-fg-secondary",
        tone === "warning" && "bg-orange-secondary/10 text-fg-orange",
        tone === "error" && "bg-error-secondary/10 text-fg-error",
        tone === "success" && "bg-brand-secondary text-fg-success",
      )}
    >
      <Icon className="mt-0.5 shrink-0 text-sm" />
      <div className="flex min-w-0 grow flex-col gap-1">
        {title ? <div className="font-bold">{title}</div> : null}
        {children}
      </div>
    </div>
  )
}

/** A label and its value, on one line. */
export const DetailRow: FC<PropsWithChildren<{ label: ReactNode; className?: string }>> = ({
  label,
  className,
  children,
}) => (
  <div className={cn("flex items-center justify-between gap-4 text-xs", className)}>
    <div className="text-fg-secondary shrink-0 whitespace-nowrap">{label}</div>
    <div className="text-fg-primary min-w-0 truncate text-right">{children}</div>
  </div>
)

/** A box of detail rows. */
export const DetailsBox: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => (
  <div className={cn("bg-secondary flex flex-col gap-2 rounded p-4", className)}>{children}</div>
)

const COPIED_RESET_MS = 2_000

/** Copies `text`; the icon turns into a check for a moment. */
export const CopyButton: FC<{ text: string; kind?: "address" | "hash"; className?: string }> = ({
  text,
  kind = "address",
  className,
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  // A timer outside React: the check goes back to the copy icon.
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard refused: the text is on screen to select.
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? t("Copied") : kind === "address" ? t("Copy address") : t("Copy")}
      className={cn(
        "text-fg-secondary hover:text-fg-primary inline-flex size-5 shrink-0 items-center justify-center",
        className,
      )}
    >
      {copied ? <Check className="text-fg-brand" /> : <Copy01 />}
    </button>
  )
}

/** An extrinsic on the Taostats explorer (`/extrinsic/<hash>`), as the website links it. */
const taostatsExtrinsicUrl = (network: Network | null | undefined, hash: string): string | null => {
  if (!network) return null
  const base = network.blockExplorerUrls?.find((url) => url.includes("taostats.io"))
  if (base) {
    const url = new URL(base)
    url.pathname = `/extrinsic/${encodeURIComponent(hash)}`
    return url.toString()
  }
  return getBlockExplorerUrls(network, { type: "transaction", id: hash })[0] ?? null
}

/** "View the transaction": a sell's (or a recovery's) extrinsic on the Taostats explorer. */
export const ExtrinsicLink: FC<{ hash: string; className?: string }> = ({ hash, className }) => {
  const { t } = useTranslation()
  const network = useNetworkById(BITTENSOR_MAINNET_ID, "polkadot")
  const href = taostatsExtrinsicUrl(network, hash)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "text-fg-brand hover:text-fg-primary inline-flex items-center gap-1",
        className,
      )}
    >
      {t("View the transaction")}
      <LinkExternal01 className="shrink-0" />
    </a>
  )
}

/** An Ethereum address on Etherscan. */
export const etherscanAddressUrl = (address: string) =>
  `https://etherscan.io/address/${encodeURIComponent(address)}`

/** The message of an error code, translated (its key is the website's English). */
export const useCrossChainErrorMessage = () => {
  const { t } = useTranslation()
  return useCallback((code: CrossChainErrorCode) => t(crossChainErrorMessageKey(code)), [t])
}
