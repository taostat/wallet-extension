import { Balances } from "@taostats-wallet/balances"
import { parseTokenId } from "@taostats-wallet/chaindata-provider"
import { Link2Icon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useBondButton } from "./hooks/useBondButton"

export const BondPillButton: FC<{
  balances: Balances
  isPortfolio?: boolean
  className?: string
}> = ({ balances, className, isPortfolio }) => {
  const { t } = useTranslation()

  // in portfolio, we should ignore existing staking settings if one of the balance is a native token
  // this is to prevent a current TAO staking position from being the default selection (which makes it impossible to do select root staking or non-root staking from portfolio)
  const ignoreExistingSettings = useMemo(
    () =>
      isPortfolio &&
      balances.each.some((balance) => parseTokenId(balance.tokenId).type === "substrate-native"),
    [balances, isPortfolio],
  )

  const { onClick } = useBondButton({ balances, ignoreExistingSettings })

  if (!onClick) return null

  return (
    <button
      className={classNames(
        "text-primary rounded-sm bg-[#293c37] p-4 text-xs font-light hover:bg-[#214940]",
        className,
      )}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Link2Icon className="shrink-0 -rotate-45 text-base" />
        <div>{t("Stake")}</div>
      </div>
    </button>
  )
}
