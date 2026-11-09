import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { TokenLogo } from "../../Asset/TokenLogo"
import { TokensAndFiat } from "../../Asset/TokensAndFiat"
import { SapiSendButton } from "../../Transactions/SapiSendButton"
import { NominationPoolName } from "../NominationPools/NominationPoolName"
import { StakingAccountDisplay } from "../shared/StakingAccountDisplay"
import { StakingFeeEstimate } from "../shared/StakingFeeEstimate"
import { useStakeWizard } from "./hooks/useStakeWizard"

export const StakeReview = () => {
  const { t } = useTranslation()
  const { token, formatter, account, onSubmitted, payload, txMetadata, poolId } = useStakeWizard()

  const [isDisabled, setIsDisabled] = useState(true)

  useEffect(() => {
    // enable confirm button 0.5 second after the screen is open, to ensure the user doesnt accidentally click it (ex: double click from prev screen)
    setTimeout(() => {
      setIsDisabled(false)
    }, 500)
  }, [])

  if (!account) return null

  return (
    <div className="flex size-full flex-col">
      <h2 className="mb-12 mt-4 text-center">{t("You are staking")}</h2>
      <div className="bg-app-bg text-fg-secondary flex w-full flex-col rounded p-4">
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="whitespace-nowrap">{t("Amount")} </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <TokenLogo tokenId={token?.id} className="shrink-0 text-lg" />
            <TokensAndFiat
              isBalance
              tokenId={token?.id}
              planck={formatter?.planck}
              noCountUp
              tokensClassName="text-fg-primary"
              fiatClassName="text-fg-secondary"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="whitespace-nowrap">{t("Account")} </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <StakingAccountDisplay address={account.address} chainId={token?.networkId} />
          </div>
        </div>
        <div className="py-4">
          <hr className="text-fg-disabled" />
        </div>
        <div className="flex items-center justify-between gap-4 pb-1 text-xs">
          <div className="whitespace-nowrap">{t("Pool")} </div>
          <div className="text-fg-primary truncate">
            <NominationPoolName poolId={poolId} chainId={token?.networkId} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 text-xs">
          <div className="whitespace-nowrap">{t("Estimated Fee")} </div>
          <div>
            <FeeEstimate />
          </div>
        </div>
      </div>
      <div className="grow"></div>
      <SapiSendButton
        containerId="StakingModalDialog"
        label={t("Stake")}
        loading={!payload}
        payload={payload ?? undefined}
        onSubmitted={onSubmitted}
        txMetadata={txMetadata}
        disabled={isDisabled}
      />
    </div>
  )
}

const FeeEstimate = () => {
  const { feeEstimate, feeToken, isLoadingFeeEstimate, errorFeeEstimate } = useStakeWizard()

  return (
    <StakingFeeEstimate
      plancks={feeEstimate}
      tokenId={feeToken?.id}
      isLoading={isLoadingFeeEstimate}
      error={errorFeeEstimate}
      noCountUp
    />
  )
}
