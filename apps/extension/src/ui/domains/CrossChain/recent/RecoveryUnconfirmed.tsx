import { FC } from "react"
import { useTranslation } from "react-i18next"

import { CopyButton, ExtrinsicLink, Notice } from "../sell/components"

/** A recovery sent but not seen in a block: it may still be included. Never called a failure. */
export const RecoveryUnconfirmed: FC<{ txHash: `0x${string}` }> = ({ txHash }) => {
  const { t } = useTranslation()
  return (
    <Notice tone="warning" title={t("Sent, not confirmed yet")}>
      <span>
        {t(
          "Your transaction was sent, but it wasn't seen in a block in time. It may still be included: check History, or look it up on Taostats before you try again.",
        )}
      </span>
      <span className="flex items-start gap-1">
        <span className="text-fg-primary min-w-0 break-all font-mono">{txHash}</span>
        <CopyButton text={txHash} kind="hash" />
      </span>
      <ExtrinsicLink hash={txHash} className="self-start" />
    </Notice>
  )
}
