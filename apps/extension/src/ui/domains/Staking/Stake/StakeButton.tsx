import { Balances } from "@taostats-wallet/balances"
import { Database01 } from "@untitledui/icons/Database01"
import { Link02 } from "@untitledui/icons/Link02"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useStakeButton } from "./hooks/useStakeButton"

export const StakeButton: FC<{
  balances: Balances
}> = ({ balances }) => {
  const { t } = useTranslation()
  const { onClick, isStaking } = useStakeButton({ balances })

  if (!onClick) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="text-fg-brand bg-fg-brand/10 hover:bg-fg-brand/20 flex shrink-0 items-center justify-center rounded-full p-3"
        >
          {isStaking ? <Link02 className="-rotate-45" /> : <Database01 />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("Stake")}</TooltipContent>
    </Tooltip>
  )
}
