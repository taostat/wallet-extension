import { useTranslation } from "react-i18next"

import { useBittensorStakeWizard } from "../../hooks/useBittensorStakeWizard"
import { BittensorSelectButton } from "../BittensorSelectButton"
import { BittensorStakeFormBase } from "../BittensorStakeFormBase"

export const BittensorSubnetStakeForm = () => {
  const { t } = useTranslation()

  const { dtaoToken } = useBittensorStakeWizard()

  const SubnetStakeDetails = () => {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="whitespace-nowrap">{t("Select Subnet")}</div>
        <div className="text-fg-primary truncate">
          <BittensorSelectButton
            label={
              dtaoToken?.netuid
                ? (dtaoToken.subnetName ?? t(`Subnet {{netuid}}`, dtaoToken))
                : t("Subnet")
            }
            nextStep="select-subnet"
          />
        </div>
      </div>
    )
  }
  return <BittensorStakeFormBase StakeTypeDetails={SubnetStakeDetails} />
}
