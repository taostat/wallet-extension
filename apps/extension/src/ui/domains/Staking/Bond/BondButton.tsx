import { Balances } from "@taostats-wallet/balances"
import { DatabaseIcon, Link2Icon } from "@taostats-wallet/icons"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useBondButton } from "./hooks/useBondButton"

export const BondButton: FC<{
  balances: Balances
}> = ({ balances }) => {
  const { t } = useTranslation()
  const { onClick, isBonding } = useBondButton({ balances })

  if (!onClick) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="text-primary bg-primary/10 hover:bg-primary/20 flex shrink-0 items-center justify-center rounded-full p-3"
        >
          {isBonding ? <Link2Icon className="-rotate-45" /> : <DatabaseIcon />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("Stake")}</TooltipContent>
    </Tooltip>
  )
}
