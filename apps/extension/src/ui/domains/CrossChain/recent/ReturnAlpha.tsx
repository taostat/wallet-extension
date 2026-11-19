import {
  buildRecoverStakeRequest,
  CrossChainSellRecord,
  DEFAULT_CROSS_CHAIN_CONFIG,
  formatRawAmount,
  TAO_DECIMALS,
} from "@taostats-wallet/cross-chain"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { BittensorValidatorName } from "@ui/domains/Portfolio/AssetDetails/DashboardTokenBalances/BittensorValidatorName"
import { StakingAccountDisplay } from "@ui/domains/Staking/shared/StakingAccountDisplay"
import { useAccountByAddress, useNetworkById } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "../constants"
import { useCrossChainConfig } from "../crossChainSellGate"
import { markCrossChainAlphaReturned } from "../records/sellRecordsStore"
import {
  DetailRow,
  DetailsBox,
  ExtrinsicLink,
  Notice,
  SellLayout,
  useCrossChainErrorMessage,
} from "../sell/components"
import { getTaoIntents } from "../sell/intents"
import { useCrossChainSellModal } from "../useCrossChainSellModal"
import { useCrossChainSigner } from "../useCrossChainSigner"
import { amountText, recordSymbol } from "./recordDisplay"
import { RecoveryUnconfirmed } from "./RecoveryUnconfirmed"
import { useRecovery } from "./useRecovery"

/**
 * "Move back to this account": an alpha sell's batch went through but the swap didn't open, so
 * the alpha sits staked at the account's EVM mirror, on the same subnet and validator. One batch
 * signed by this account (`recoverStake`) moves all of it back. The review says what moves and
 * where; Confirm signs and sends it.
 */
export const ReturnAlpha: FC<{ record: CrossChainSellRecord; onBack: () => void }> = ({
  record,
  onBack,
}) => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const errorMessage = useCrossChainErrorMessage()
  const account = useAccountByAddress(record.address)
  const network = useNetworkById(BITTENSOR_MAINNET_ID, "polkadot")
  const signer = useCrossChainSigner(account, network?.genesisHash)
  const { data: configResult } = useCrossChainConfig()
  const config = configResult?.config ?? DEFAULT_CROSS_CHAIN_CONFIG
  const { state, run } = useRecovery("alpha")

  const symbol = recordSymbol(record)
  const stranded = record.strandedAlpha
  const request = stranded ? buildRecoverStakeRequest(stranded) : null
  const isRunning = state.status === "running"
  const canConfirm = signer !== null && request !== null && !isRunning

  const confirm = () => {
    if (!canConfirm || !signer || !request || !stranded) return
    void run({
      execute: (onProgress) =>
        getTaoIntents(config).recoverStake({ substrate: signer, ...request, onProgress }),
      onMoved: (result) =>
        markCrossChainAlphaReturned(record.address, stranded, {
          hash: result.extrinsicHash,
          amount: formatRawAmount(result.amount, TAO_DECIMALS),
        }),
      onNothingLeft: () => markCrossChainAlphaReturned(record.address, stranded, {}),
    })
  }

  if (state.status === "done" || state.status === "unconfirmed" || state.status === "nothingLeft")
    return (
      <SellLayout
        title={t("Move back to this account")}
        onBack={onBack}
        onClose={close}
        footer={
          <Button primary fullWidth onClick={onBack}>
            {t("Done")}
          </Button>
        }
      >
        {state.status === "done" ? (
          <Notice tone="success">
            <span>
              {t("{{amount}} moved back to this account.", {
                amount: amountText(formatRawAmount(state.amount, TAO_DECIMALS), symbol),
              })}
            </span>
            <ExtrinsicLink hash={state.hash} className="self-start" />
          </Notice>
        ) : state.status === "unconfirmed" ? (
          <RecoveryUnconfirmed txHash={state.txHash} />
        ) : (
          <Notice tone="info">
            {t("There's nothing left to return: it was already moved back.")}
          </Notice>
        )}
      </SellLayout>
    )

  return (
    <SellLayout
      title={t("Move back to this account")}
      onBack={isRunning ? undefined : onBack}
      onClose={close}
      footer={
        <Button primary fullWidth disabled={!canConfirm} processing={isRunning} onClick={confirm}>
          {t("Move back to this account")}
        </Button>
      }
    >
      <Notice tone="info" title={t("Your {{symbol}} is at your account's EVM address", { symbol })}>
        {t("It moves back to this account, staked with the same validator.")}
      </Notice>
      <DetailsBox>
        <DetailRow label={t("Token")}>{symbol}</DetailRow>
        {record.from.kind === "alpha" ? (
          <DetailRow label={t("Validator")}>
            <BittensorValidatorName hotkey={record.from.hotkey} />
          </DetailRow>
        ) : null}
        <DetailRow label={t("To")}>
          <StakingAccountDisplay
            address={record.address}
            chainId={BITTENSOR_MAINNET_ID}
            className="text-xs"
          />
        </DetailRow>
      </DetailsBox>
      {state.status === "idle" && state.error ? (
        <Notice tone="error">{errorMessage(state.error)}</Notice>
      ) : null}
    </SellLayout>
  )
}
