import { LoaderIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { useTranslation } from "react-i18next"

import { TokensAndFiat } from "../../Asset/TokensAndFiat"
import { NetworkLogo } from "../../Networks/NetworkLogo"
import { SendFundsFeeTooltip } from "../SendFundsFeeTooltip"
import { useSendFunds } from "../useSendFunds"
import { Container } from "./Container"

const NetworkRow = () => {
  const [t] = useTranslation()

  const { network } = useSendFunds()

  return (
    <div className="flex w-full items-center justify-between">
      <div>{t("Network")}</div>
      <div className="flex items-center gap-2">
        <NetworkLogo networkId={network?.id} className="inline-block text-base" />
        <div>{network?.name}</div>
      </div>
    </div>
  )
}

export const FeesSummary = () => {
  const { t } = useTranslation()
  const { feeToken, estimatedFee, isLoading } = useSendFunds()

  return (
    <Container
      className={classNames("space-y-4 px-8 py-4", isLoading && !estimatedFee && "animate-pulse")}
    >
      <NetworkRow />
      <div className="flex w-full items-center justify-between gap-4">
        <div className="whitespace-nowrap">
          {t("Estimated Fee")} <SendFundsFeeTooltip />
        </div>
        <div
          className={classNames(
            "flex grow items-center justify-end gap-2 truncate",
            isLoading && estimatedFee && "animate-pulse",
          )}
        >
          {isLoading && !estimatedFee && (
            <div className="text-body-disabled flex items-center gap-2">
              <span>{t("Validating Transaction")}</span>
              <LoaderIcon className="animate-spin-slow" />
            </div>
          )}
          {estimatedFee && feeToken && (
            <TokensAndFiat planck={estimatedFee.planck} tokenId={feeToken.id} />
          )}
        </div>
      </div>
    </Container>
  )
}
