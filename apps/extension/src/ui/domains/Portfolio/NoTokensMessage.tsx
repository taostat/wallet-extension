import { Copy01 } from "@untitledui/icons/Copy01"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { PillButton } from "taostats-ui"

import { useAnalytics } from "@ui/hooks/useAnalytics"

import { useCopyAddressModal } from "../CopyAddress"
import { usePortfolioNavigation } from "./usePortfolioNavigation"

type NoTokensMessageProps = {
  symbol: string
}

export const NoTokensMessage = ({ symbol }: NoTokensMessageProps) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()
  const { selectedAccount, selectedFolder } = usePortfolioNavigation()
  const { open } = useCopyAddressModal()

  const handleCopy = useCallback(() => {
    open({ address: selectedAccount?.address, qr: true })
    genericEvent("open receive", { from: "NoTokensMessage" })
  }, [selectedAccount?.address, genericEvent, open])

  return (
    <div className="bg-secondary text-fg-secondary flex flex-col items-center justify-center rounded py-[72px]">
      <div>
        {selectedAccount
          ? t("You don't have any {{symbol}} in this account", { symbol })
          : selectedFolder
            ? t("You don't have any {{symbol}} in this folder", { symbol })
            : t("You don't have any {{symbol}} in Taostats", { symbol })}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <PillButton size="sm" icon={Copy01} onClick={handleCopy}>
          {t("Copy Address")}
        </PillButton>
      </div>
    </div>
  )
}
