import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { SignerPayloadJSON } from "extension-core"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

import { SapiSendButton } from "../../../Transactions/SapiSendButton"
import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"

type BuiltPayload = {
  payload: SignerPayloadJSON
  txMetadata?: Uint8Array | `0x${string}`
}

export const BittensorConfirmSignButton: FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { t } = useTranslation()
  const {
    account,
    stakeDirection,
    networkId,
    mevShieldOption,
    isMevShieldDisabled,
    prepareSignerPayload,
    onSubmitted,
    startSubmittingStakeTx,
    endSubmittingStakeTx,
    feeEstimate,
    isLoadingFeeEstimate,
    errorFeeEstimate,
    confirmFeeError,
  } = useBittensorStakeWizard()
  const { data: sapi } = useScaleApi(networkId)

  const [built, setBuilt] = useState<BuiltPayload | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [prepareError, setPrepareError] = useState<string | null>(null)

  const signMethod = useMemo(() => {
    switch (account?.type) {
      case "polkadot-vault":
        return "qr"
      case "ledger-polkadot":
        return "hardware"
      case "keypair":
        return "local"
      default:
        return "unsupported"
    }
  }, [account?.type])

  const mode = useMemo(() => {
    if (isMevShieldDisabled || mevShieldOption === "off") return "default" as const
    if (mevShieldOption === "on-chain") return "bittensor-mev-shield" as const
    return "bittensor-taostats-shield" as const
  }, [isMevShieldDisabled, mevShieldOption])

  useEffect(() => {
    setBuilt(null)
  }, [mevShieldOption])

  const feeReady = typeof feeEstimate === "bigint" && !isLoadingFeeEstimate && !errorFeeEstimate
  const blocked = !!disabled || !feeReady || !!confirmFeeError

  const handleClick = useCallback(async () => {
    setPrepareError(null)
    setPreparing(true)
    try {
      const next = await prepareSignerPayload()
      if (signMethod === "local") {
        if (!sapi) throw new Error("Chain is not ready")
        startSubmittingStakeTx()
        try {
          const { hash } = await sapi.submit(next.payload, undefined, undefined, mode)
          onSubmitted(hash)
        } finally {
          endSubmittingStakeTx()
        }
        return
      }
      setBuilt(next)
    } catch (err) {
      setPrepareError(err instanceof Error ? err.message : t("Could not prepare this transaction."))
    } finally {
      setPreparing(false)
    }
  }, [
    endSubmittingStakeTx,
    mode,
    onSubmitted,
    prepareSignerPayload,
    sapi,
    signMethod,
    startSubmittingStakeTx,
    t,
  ])

  const label = stakeDirection === "stake" ? t("Stake") : t("Unstake")
  const feeErrorMessage =
    errorFeeEstimate instanceof Error
      ? errorFeeEstimate.message
      : errorFeeEstimate
        ? String(errorFeeEstimate)
        : null

  return (
    <div className="flex w-full flex-col gap-3">
      {confirmFeeError ? (
        <div className="text-brand-orange text-center text-xs">{confirmFeeError}</div>
      ) : null}
      {feeErrorMessage ? <PrepareError message={feeErrorMessage} /> : null}
      {prepareError ? <PrepareError message={prepareError} /> : null}
      {built && signMethod !== "local" ? (
        <SapiSendButton
          containerId="StakingModalDialog"
          label={label}
          payload={built.payload}
          txMetadata={built.txMetadata}
          onSubmitted={onSubmitted}
          onSubmitStart={startSubmittingStakeTx}
          onSubmitEnd={endSubmittingStakeTx}
          disabled={!!disabled || !!confirmFeeError}
          mode={mode}
        />
      ) : signMethod === "unsupported" ? (
        <Button className="w-full" primary disabled>
          {t("Unsupported account type: {{type}}", { type: account?.type })}
        </Button>
      ) : (
        <Button
          className="w-full"
          primary
          disabled={blocked}
          processing={preparing}
          onClick={handleClick}
        >
          {label}
        </Button>
      )}
    </div>
  )
}

const PrepareError: FC<{ message: string }> = ({ message }) => (
  <div className="text-fg-orange bg-app-bg flex w-full items-center gap-2.5 rounded-sm px-2.5 py-3 text-xs">
    <AlertCircle className={classNames("shrink-0 text-lg")} />
    <div className="scrollable scrollable-800 max-h-20 overflow-y-auto">{message}</div>
  </div>
)
