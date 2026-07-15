import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { useTranslation } from "react-i18next"

import { WithTooltip } from "@taostats/components/Tooltip"

export const LimitToNetworkTooltip = () => {
  const { t } = useTranslation()

  return (
    <WithTooltip
      tooltip={
        <>
          <div>{t("Lock this address to one network.")}</div>
          <div>{t("Recommended for Exchange and Ledger addresses.")}</div>
          <div>{t("This prevents sending funds to this address on incompatible networks.")}</div>
        </>
      }
    >
      <InfoCircle />
    </WithTooltip>
  )
}
