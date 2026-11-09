import { classNames } from "@taostats-wallet/util"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useCombinedBittensorValidatorsData } from "@ui/domains/Staking/hooks/bittensor/useCombinedBittensorValidatorsData"

import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"

export const ValidatorApy = () => {
  const { t } = useTranslation()
  const { hotkey, netuid } = useBittensorStakeWizard()
  const { combinedValidatorsData, isLoading, isError } = useCombinedBittensorValidatorsData(netuid)

  const apy = useMemo(() => {
    const validator = combinedValidatorsData.find((validator) => validator.hotkey === hotkey)
    return Number(validator?.validatorYield?.thirty_day_apy ?? 0)
  }, [combinedValidatorsData, hotkey])

  const display = useMemo(() => (apy ? `${(apy * 100).toFixed(2)}%` : "N/A"), [apy])

  if (isLoading) {
    return <div className="text-fg-disabled bg-tertiary rounded-xs animate-pulse">15.00%</div>
  }

  if (isError) {
    return <div className="text-fg-orange">{t("Unable to fetch APY data")}</div>
  }

  return (
    <span className={classNames(apy ? "text-fg-success" : "text-fg-secondary")}>{display}</span>
  )
}
