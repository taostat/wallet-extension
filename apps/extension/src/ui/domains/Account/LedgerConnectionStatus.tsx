import { classNames } from "@taostats-wallet/util"
import { CheckCircle } from "@untitledui/icons/CheckCircle"
import { Loading01 } from "@untitledui/icons/Loading01"
import { XCircle } from "@untitledui/icons/XCircle"
import { useTranslation } from "react-i18next"

import { LedgerStatus } from "@ui/hooks/ledger/common"

export type LedgerConnectionStatusProps = {
  status: LedgerStatus
  message: string
  className?: string
  onRetryClick?: () => void
}

const wrapStrong = (text: string) => {
  if (!text) return text

  const splitter = new RegExp("(<strong>[^<]*?</strong>)", "g")
  const extractor = new RegExp("^<strong>([^<]*?)</strong>$", "g")

  return text.split(splitter).map((str, i) => {
    const match = extractor.exec(str)
    return match ? (
      <strong key={i} className="text-fg-tertiary p-0 capitalize">
        {match[1]}
      </strong>
    ) : (
      <span key={i}>{str}</span>
    )
  })
}

export const LedgerConnectionStatus = ({
  status,
  message,
  className,
  onRetryClick,
}: LedgerConnectionStatusProps) => {
  const { t } = useTranslation()

  if (!status || status === "unknown") return null

  return (
    <div
      className={classNames(
        "text-fg-secondary bg-secondary flex h-28 w-full items-center gap-4 rounded-sm p-8",
        className,
      )}
    >
      {status === "ready" && (
        <CheckCircle className="text-fg-success min-w-[1em] shrink-0 text-[2rem]" />
      )}
      {status === "warning" && (
        <XCircle className="text-fg-orange min-w-[1em] shrink-0 text-[2rem]" />
      )}
      {status === "error" && <XCircle className="text-fg-error min-w-[1em] shrink-0 text-[2rem]" />}
      {status === "connecting" && (
        <Loading01 className="animate-spin-slow min-w-[1em] shrink-0 text-[2rem] text-white" />
      )}
      <div className="grow text-left leading-[2rem]">{wrapStrong(message)}</div>
      {!!onRetryClick && (
        <button
          type="button"
          onClick={onRetryClick}
          className="bg-secondary hover:bg-tertiary text-fg-primary border-primary hover:border-primary h-20 rounded border px-8"
        >
          {t("Retry")}
        </button>
      )}
    </div>
  )
}
