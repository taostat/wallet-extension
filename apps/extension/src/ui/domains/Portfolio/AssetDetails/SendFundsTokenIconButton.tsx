import { TokenId } from "@taostats-wallet/chaindata-provider"
import { ArrowUpRight } from "@untitledui/icons/ArrowUpRight"
import { Send01 } from "@untitledui/icons/Send01"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useSendFundsPopup } from "@ui/hooks/useSendFundsPopup"
import { useToken } from "@ui/state"

import { usePortfolioNavigation } from "../usePortfolioNavigation"

export const SendFundsTokenButton = ({
  tokenId,
  shouldClose,
}: {
  tokenId: TokenId
  shouldClose?: boolean
}) => {
  const { t } = useTranslation()
  const { selectedAccount } = usePortfolioNavigation()
  const token = useToken(tokenId)

  const { canSendFunds, cannotSendFundsReason, openSendFundsPopup } = useSendFundsPopup(
    selectedAccount,
    token?.id,
  )

  const handleClick = useCallback(() => {
    if (!canSendFunds) return
    openSendFundsPopup()
    if (shouldClose) window.close()
  }, [canSendFunds, openSendFundsPopup, shouldClose])

  if (!token) return null

  if (!canSendFunds)
    return (
      <Tooltip>
        <TooltipTrigger className="text-fg-secondary focus:text-fg-primary hover:bg-tertiary rounded-xs inline-flex h-[18px] w-[18px] cursor-default items-center justify-center text-xs opacity-50">
          <Send01 />
        </TooltipTrigger>
        <TooltipContent>{cannotSendFundsReason}</TooltipContent>
      </Tooltip>
    )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="text-fg-secondary hover:text-fg-primary focus:text-fg-primary focus:bg-tertiary hover:bg-tertiary rounded-xs inline-flex h-[18px] w-[18px] items-center justify-center text-xs"
        >
          <ArrowUpRight />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("Send")}</TooltipContent>
    </Tooltip>
  )
}
