import { classNames } from "@taostats-wallet/util"
import { Edit01 } from "@untitledui/icons/Edit01"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { FC, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Button,
  Drawer,
  Radio,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useOpenClose,
} from "taostats-ui"

import { BittensorValidatorName } from "@ui/domains/Portfolio/AssetDetails/DashboardTokenBalances/BittensorValidatorName"
import { STAKING_MODAL_CONTENT_CONTAINER_ID } from "@ui/domains/Staking/shared/ModalContent"

import { Fiat } from "../../../../Asset/Fiat"
import { TokenLogo } from "../../../../Asset/TokenLogo"
import { TokensAndFiat } from "../../../../Asset/TokensAndFiat"
import { SapiSendButton } from "../../../../Transactions/SapiSendButton"
import { StakingAccountDisplay } from "../../../shared/StakingAccountDisplay"
import { StakingFeeEstimate } from "../../../shared/StakingFeeEstimate"
import { BittensorStakingModalHeader } from "../../components/BittensorModalHeader"
import { BittensorModalLayout } from "../../components/BittensorModalLayout"
import { ValidatorApy } from "../../components/ValidatorApy"
import { useBittensorStakeModal } from "../../hooks/useBittensorStakeModal"
import { useBittensorStakeWizard } from "../../hooks/useBittensorStakeWizard"
import { HIGH_PRICE_IMPACT, VERY_HIGH_PRICE_IMPACT } from "../../utils/constants"
import { BittensorSlippageDrawer } from "../Drawers/BittensorSlippageDrawer"

export const BittensorSubnetStakeReview = () => {
  const [isDisabled, setIsDisabled] = useState(true)
  const ocMevShieldInfo = useOpenClose()

  const {
    nativeToken,
    dtaoToken,
    account,
    payload,
    amountIn,
    amountTao,
    txMetadata,
    hotkey,
    netuid,
    slippageDrawer,
    slippage,
    isSubnetUnstake,
    swapPrice,
    amountOut,
    stakeDirection,
    priceImpact,
    isMevShieldDisabled,
    isHardwareWallet,
    mevShieldOption,
    setMevShieldOption,
    onSubmitted,
    startSubmittingStakeTx,
    endSubmittingStakeTx,
    setStep,
  } = useBittensorStakeWizard()
  const { t } = useTranslation()
  const { close } = useBittensorStakeModal()

  const { open } = slippageDrawer

  useEffect(() => {
    // enable confirm button 0.5 second after the screen is open, to ensure the user doesnt accidentally click it (ex: double click from prev screen)
    setTimeout(() => {
      setIsDisabled(false)
    }, 500)
  }, [])

  if (!account) return null

  return (
    <BittensorModalLayout
      header={
        <BittensorStakingModalHeader
          onCloseModal={close}
          title={stakeDirection === "stake" ? t("Confirm Staking") : t("Confirm Unstaking")}
          onBackClick={() => setStep("form")}
          withClose
        />
      }
      contentClassName="flex min-h-0 w-full flex-col p-12 pt-0"
    >
      <div className="scrollable scrollable-800 min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-[0.75rem]">
          <div className="bg-app-bg text-fg-secondary flex w-full flex-col rounded p-8">
            <div className="flex items-center justify-between gap-8 pb-2 text-sm">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>{t("Tao")}</span>
                <TokenLogo tokenId={nativeToken?.id} className="size-8" />
              </div>
              <div className="overflow-hidden">
                <TokensAndFiat
                  tokenId={nativeToken?.id}
                  planck={isSubnetUnstake ? amountOut : amountIn!}
                  noCountUp
                  noFiat
                  tokensClassName="text-fg-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-8 py-2 text-sm">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>{`SN${netuid}`}</span>
                <TokenLogo tokenId={dtaoToken?.id} className="size-8" />
              </div>
              <div className="overflow-hidden">
                <TokensAndFiat
                  tokenId={dtaoToken?.id}
                  planck={isSubnetUnstake ? amountIn! : amountOut}
                  noCountUp
                  noFiat
                  tokensClassName="text-fg-primary"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-8 py-2 text-sm">
              <div className="whitespace-nowrap">{t("USD")} </div>
              <div className="text-fg-primary overflow-hidden">
                <Fiat amount={amountTao} forceCurrency="usd" noCountUp />
              </div>
            </div>
            <div className="flex items-center justify-between gap-8 pt-2 text-sm">
              <div className="whitespace-nowrap">{t("Account")} </div>
              <div className="overflow-hidden">
                <StakingAccountDisplay address={account.address} chainId={nativeToken?.networkId} />
              </div>
            </div>
            <div className="py-8">
              <hr className="text-fg-disabled" />
            </div>
            <div className="flex items-center justify-between gap-8 pb-2 text-xs">
              <div className="whitespace-nowrap">{t("Subnet")} </div>
              <div className="text-fg-primary truncate">{dtaoToken?.name}</div>
            </div>
            <div className="flex items-center justify-between gap-8 py-2 text-xs">
              <div className="whitespace-nowrap">{t("Validator")} </div>
              <div className="text-fg-primary truncate">
                <BittensorValidatorName hotkey={hotkey} />
              </div>
            </div>
            {stakeDirection === "stake" && (
              <div className="flex items-center justify-between gap-8 py-2 text-xs">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        {t("APY")}
                        <InfoCircle />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{t("Estimated Annual Percentage Yield (APY)")}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-fg-primary overflow-hidden">
                  <ValidatorApy />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-8 pt-2 text-xs">
              <div className="whitespace-nowrap">{t("Estimated amount")}</div>
              <div className="overflow-hidden">
                <TokensAndFiat
                  planck={amountOut}
                  tokenId={isSubnetUnstake ? nativeToken?.id : dtaoToken?.id}
                  noCountUp
                  tokensClassName="text-fg-primary"
                />
              </div>
            </div>
          </div>
          <div className="bg-app-bg text-fg-secondary flex w-full flex-col gap-2 rounded p-8 py-6">
            <div className="flex items-center justify-between gap-8 text-xs">
              <div className="whitespace-nowrap">{t("Alpha Price")} </div>
              <div className="text-fg-secondary flex items-center gap-2">
                <TokensAndFiat
                  planck={swapPrice!}
                  tokenId={nativeToken?.id}
                  tokensClassName="text-fg-primary"
                  noCountUp
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <div className="whitespace-nowrap">{t("Price Impact")}</div>
              <div
                className={classNames(
                  "text-fg-primary",
                  !!priceImpact && priceImpact >= HIGH_PRICE_IMPACT && "text-orange-500",
                  !!priceImpact && priceImpact >= VERY_HIGH_PRICE_IMPACT && "text-red-500",
                )}
              >
                {priceImpact?.toFixed(2)}%
              </div>
            </div>
            <div className="flex items-center justify-between gap-8 text-xs">
              <div className="whitespace-nowrap">{t("Slippage Tolerance")} </div>
              <div className="text-fg-primary flex items-center gap-2">
                <button
                  type="button"
                  onClick={open}
                  className={
                    "flex cursor-pointer items-center gap-2 rounded-xl pl-2 text-xs font-light"
                  }
                >
                  <Edit01 />
                  <div>{slippage.toFixed(2)}%</div>
                </button>
              </div>
            </div>
            {!isMevShieldDisabled && (
              <div className="flex flex-col gap-3 pt-2 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="hover:text-fg-primary whitespace-nowrap"
                    onClick={ocMevShieldInfo.open}
                  >
                    <span>
                      {t("MEV Shield")} <InfoCircle className="inline" />
                    </span>
                  </button>
                </div>
                <div
                  className="text-fg-primary flex flex-col gap-2"
                  role="radiogroup"
                  aria-label={t("MEV Shield")}
                >
                  <Radio
                    name="mev-shield-option"
                    value="off"
                    label={t("Off")}
                    checked={mevShieldOption === "off"}
                    onChange={() => setMevShieldOption("off")}
                  />
                  {!isHardwareWallet ? (
                    <Radio
                      name="mev-shield-option"
                      value="on-chain"
                      label={t("On-chain Shield")}
                      checked={mevShieldOption === "on-chain"}
                      onChange={() => setMevShieldOption("on-chain")}
                    />
                  ) : null}
                  <Radio
                    name="mev-shield-option"
                    value="taostats"
                    label={t("Taostats Shield (recommended)")}
                    checked={mevShieldOption === "taostats"}
                    onChange={() => setMevShieldOption("taostats")}
                  />
                </div>
                {isHardwareWallet ? (
                  <p className="text-fg-secondary text-xs">
                    {t(
                      "On-chain Shield is not available for Ledger wallets. Use Taostats Shield or turn protection off.",
                    )}
                  </p>
                ) : null}
              </div>
            )}
          </div>
          <div className="bg-app-bg text-fg-secondary flex w-full flex-col rounded p-8 py-6">
            <div className="flex items-center justify-between gap-8 pt-2 text-xs">
              <div className="whitespace-nowrap">{t("Estimated Fee")} </div>
              <FeeEstimate />
            </div>
          </div>
        </div>
      </div>
      {payload && (
        <div className="shrink-0 pt-8">
          <SapiSendButton
            containerId="StakingModalDialog"
            label={stakeDirection === "stake" ? t("Stake") : t("Unstake")}
            payload={payload}
            onSubmitted={onSubmitted}
            onSubmitStart={startSubmittingStakeTx}
            onSubmitEnd={endSubmittingStakeTx}
            txMetadata={txMetadata}
            disabled={isDisabled}
            mode={
              mevShieldOption === "taostats"
                ? "bittensor-taostats-shield"
                : mevShieldOption === "on-chain"
                  ? "bittensor-mev-shield"
                  : "default"
            }
          />
        </div>
      )}
      <BittensorSlippageDrawer />
      <MevShieldInfoDrawer isOpen={ocMevShieldInfo.isOpen} onDismiss={ocMevShieldInfo.close} />
    </BittensorModalLayout>
  )
}

const FeeEstimate = () => {
  const { feeEstimate, feeToken, isLoadingFeeEstimate, errorFeeEstimate } =
    useBittensorStakeWizard()

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

const MevShieldInfoDrawer: FC<{ isOpen: boolean; onDismiss: () => void }> = ({
  isOpen,
  onDismiss,
}) => {
  const { t } = useTranslation()
  return (
    <Drawer
      anchor="bottom"
      isOpen={isOpen}
      onDismiss={onDismiss}
      containerId={STAKING_MODAL_CONTENT_CONTAINER_ID}
    >
      <div className="bg-tertiary flex w-full flex-col gap-8 overflow-hidden rounded-t p-8 pt-12">
        <div className="text-md text-center font-bold">{t("MEV Shield")}</div>
        <p className="text-sm">
          {t(
            'MEV Shield protects your subnet staking transaction from frontrunning by wrapping it in an encrypted "shield" transaction.',
          )}
        </p>
        <ul className="text-fg-secondary list-outside list-disc space-y-2 pl-8 text-sm">
          <li>
            {t(
              "You submit one encrypted wrapper transaction. If it succeeds, your staking transaction is automatically included in the next block.",
            )}
          </li>
          <li>
            {t(
              "You still pay network fees for both the encrypted wrapper and the staking transaction.",
            )}
          </li>
          <li>
            {t(
              "Even if the wrapper executes successfully, the staking transaction is not guaranteed to succeed (it can still fail on-chain).",
            )}
          </li>
          <li>
            {t(
              "On-chain Shield requires submitting the outer encrypted transaction in the same block as the key fetch, which is too time-sensitive for hardware wallets. Ledger accounts can use Taostats Shield or turn protection off.",
            )}
          </li>
          <li>
            {t(
              "Root staking is not subject to MEV attacks in the same way, so MEV Shield is disabled for Root staking.",
            )}
          </li>
        </ul>

        <Button fullWidth onClick={onDismiss}>
          {t("Close")}
        </Button>
      </div>
    </Drawer>
  )
}
