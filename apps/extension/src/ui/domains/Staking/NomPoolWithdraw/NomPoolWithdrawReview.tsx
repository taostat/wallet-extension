import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { useTranslation } from "react-i18next"

import { TokenLogo } from "../../Asset/TokenLogo"
import { TokensAndFiat } from "../../Asset/TokensAndFiat"
import { SapiSendButton } from "../../Transactions/SapiSendButton"
import { NominationPoolName } from "../NominationPools/NominationPoolName"
import { StakingAccountDisplay } from "../shared/StakingAccountDisplay"
import { StakingFeeEstimate } from "../shared/StakingFeeEstimate"
import { useNomPoolWithdrawWizard } from "./useNomPoolWithdrawWizard"

export const NomPoolWithdrawReview = () => {
  const { t } = useTranslation()
  const {
    token,
    amountToWithdraw,
    account,
    onSubmitted,
    payload,
    txMetadata,
    feeToken,
    feeEstimate,
    isLoadingFeeEstimate,
    errorFeeEstimate,
    errorMessage,
    poolId,
  } = useNomPoolWithdrawWizard()

  if (!account) return null

  return (
    <div className="flex size-full flex-col">
      <h2 className="mb-12 mt-4 text-center">{t("You are withdrawing")}</h2>
      <div className="bg-app-bg text-fg-secondary flex w-full flex-col rounded p-4">
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="whitespace-nowrap">{t("Amount")} </div>
          <div className="flex items-center gap-2 overflow-hidden">
            <TokenLogo tokenId={token?.id} className="shrink-0 text-lg" />
            <TokensAndFiat
              isBalance
              tokenId={token?.id}
              planck={amountToWithdraw?.planck}
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
            <StakingFeeEstimate
              plancks={feeEstimate}
              tokenId={feeToken?.id}
              isLoading={isLoadingFeeEstimate}
              error={errorFeeEstimate}
              noCountUp
            />
          </div>
        </div>
      </div>
      <div className="grow"></div>
      {!!errorMessage && (
        <div className="text-fg-orange bg-app-bg my-4 flex w-full items-center gap-2.5 rounded-sm px-2.5 py-3 text-xs">
          <AlertCircle className="shrink-0 text-lg" />
          <div>{errorMessage}</div>
        </div>
      )}
      <SapiSendButton
        containerId="StakingModalDialog"
        label={t("Withdraw")}
        loading={!payload}
        payload={payload ?? undefined}
        onSubmitted={onSubmitted}
        txMetadata={txMetadata}
      />
    </div>
  )
}
