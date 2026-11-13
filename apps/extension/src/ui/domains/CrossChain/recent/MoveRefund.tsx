import { useQuery } from "@tanstack/react-query"
import {
  buildRecoverRefundRequest,
  CrossChainSellRecord,
  DEFAULT_CROSS_CHAIN_CONFIG,
  formatRawAmount,
  rawToNumber,
  readRefundAtMirror,
  refundMirrorAddress,
  USDC_DECIMALS,
} from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { log } from "extension-shared"
import { FC, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button, FormFieldInputText } from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"
import { Tokens } from "@ui/domains/Asset/Tokens"
import { useAccountByAddress, useNetworkById } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "../constants"
import { useCrossChainConfig } from "../crossChainSellGate"
import { markCrossChainRefundsMoved } from "../records/sellRecordsStore"
import {
  DetailRow,
  DetailsBox,
  ExtrinsicLink,
  Notice,
  SellLayout,
  useCrossChainErrorMessage,
} from "../sell/components"
import { getBittensorEvmClient, getTaoIntents } from "../sell/intents"
import { useRecipientProblemText } from "../sell/SellForm"
import { useCrossChainSellModal } from "../useCrossChainSellModal"
import { useCrossChainSigner } from "../useCrossChainSigner"
import { RecoveryUnconfirmed } from "./RecoveryUnconfirmed"
import { useRecovery } from "./useRecovery"

/** The EVM address the account acts as on Bittensor; `null` if its address can't be read. */
const mirrorOf = (address: string) => {
  try {
    return refundMirrorAddress(address)
  } catch {
    return null
  }
}

/**
 * "Move refund": an unfilled sell was refunded as USDC to the account's EVM address on Bittensor,
 * which only this account can move out (`recoverRefund`, one batch). The review shows the USDC
 * there, read from the chain, and the address it moves to (the sell's recipient, editable); it
 * arrives as USDC on Bittensor EVM at that address. Confirm signs and sends it.
 */
export const MoveRefund: FC<{ record: CrossChainSellRecord; onBack: () => void }> = ({
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
  const { state, run } = useRecovery("refund")

  const [to, setTo] = useState(record.recipient)
  // "Too short" waits for the field to be left: every address is too short while it is typed.
  const [isTyping, setIsTyping] = useState(false)
  const request = buildRecoverRefundRequest(to)
  const problem = request.ok ? null : request.problem
  const showProblem = problem !== null && !(isTyping && problem === "tooShort")
  const problemText = useRecipientProblemText(
    problem === null || problem === "missing" ? "invalid" : problem,
  )

  const refund = useQuery({
    queryKey: ["crossChainRefundAtMirror", record.address, config.evmRpcUrls.bittensor],
    queryFn: async () => {
      const readAt = Date.now()
      const amount = await readRefundAtMirror(getBittensorEvmClient(config), record.address)
      // Nothing there: the refunds seen landing before this read were moved already.
      if (amount === 0n) await markCrossChainRefundsMoved(record.address, {}, readAt)
      return amount
    },
    enabled: state.status === "idle",
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const isRunning = state.status === "running"
  const canConfirm =
    signer !== null && request.ok && refund.data !== undefined && refund.data > 0n && !isRunning

  const confirm = () => {
    if (!canConfirm || !signer || !request.ok) return
    const { to: target } = request.request
    // `recoverRefund` reads the balance after this: a refund seen landing later may not be in it.
    const startedAt = Date.now()
    void run({
      execute: (onProgress) =>
        getTaoIntents(config).recoverRefund({ substrate: signer, ...request.request, onProgress }),
      onMoved: async (result) => {
        await markCrossChainRefundsMoved(
          record.address,
          {
            to: target,
            hash: result.extrinsicHash,
            amount: formatRawAmount(result.amount, USDC_DECIMALS),
          },
          startedAt,
        )
        // What the move may not have covered: if the address is empty now, it covered it all;
        // otherwise those refunds keep needing the user. A read that fails changes nothing.
        try {
          const readAt = Date.now()
          const left = await readRefundAtMirror(getBittensorEvmClient(config), record.address)
          if (left === 0n)
            await markCrossChainRefundsMoved(
              record.address,
              { to: target, hash: result.extrinsicHash },
              readAt,
            )
        } catch (error) {
          log.debug("[cross-chain] Couldn't read what is left after the move", { error })
        }
      },
      onNothingLeft: () => markCrossChainRefundsMoved(record.address, {}, startedAt),
    })
  }

  if (state.status === "done" || state.status === "unconfirmed" || state.status === "nothingLeft")
    return (
      <SellLayout
        title={t("Move refund")}
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
              <Trans
                t={t}
                defaults="Refund moved to <Address>{{address}}</Address> on Bittensor EVM."
                components={{ Address: <span className="font-mono" /> }}
                values={{ address: shortenAddress(to.trim(), 6, 4) }}
              />
            </span>
            <ExtrinsicLink hash={state.hash} className="self-start" />
          </Notice>
        ) : state.status === "unconfirmed" ? (
          <RecoveryUnconfirmed txHash={state.txHash} />
        ) : (
          <Notice tone="info">
            {t("There's nothing left to move: this refund was already moved.")}
          </Notice>
        )}
      </SellLayout>
    )

  const isNothingLeft = refund.data === 0n
  const mirror = mirrorOf(record.address)

  return (
    <SellLayout
      title={t("Move refund")}
      onBack={isRunning ? undefined : onBack}
      onClose={close}
      footer={
        isNothingLeft ? (
          <Button primary fullWidth onClick={onBack}>
            {t("Done")}
          </Button>
        ) : (
          <Button primary fullWidth disabled={!canConfirm} processing={isRunning} onClick={confirm}>
            {t("Move refund")}
          </Button>
        )
      }
    >
      <DetailsBox>
        <DetailRow label={t("Amount")}>
          {refund.data !== undefined ? (
            <Tokens amount={rawToNumber(refund.data, USDC_DECIMALS)} symbol="USDC" noCountUp />
          ) : refund.isError ? (
            t("Couldn't read the amount")
          ) : (
            "…"
          )}
        </DetailRow>
        <DetailRow label={t("From")}>
          {t("Your account's EVM address")}
          {mirror ? <span className="font-mono"> ({shortenAddress(mirror, 6, 4)})</span> : null}
        </DetailRow>
        <DetailRow label={t("Network")}>{"Bittensor EVM"}</DetailRow>
      </DetailsBox>
      {isNothingLeft ? (
        <Notice tone="info">
          {t("There's nothing left to move: this refund was already moved.")}
        </Notice>
      ) : (
        <section className="flex flex-col gap-2">
          <label htmlFor="cross-chain-refund-recipient" className="text-fg-secondary text-xs">
            {t("Move to")}
          </label>
          <FormFieldInputText
            id="cross-chain-refund-recipient"
            small
            value={to}
            disabled={isRunning}
            placeholder={t("EVM address (0x…)")}
            onChange={(e) => {
              setIsTyping(true)
              setTo(e.target.value)
            }}
            onBlur={() => setIsTyping(false)}
            containerProps={{
              className: cn("font-mono text-sm", showProblem && "border-alert-error"),
            }}
            aria-invalid={showProblem}
          />
          {showProblem ? (
            <div role="alert" className="text-fg-error text-xs">
              {problemText}
            </div>
          ) : (
            <div className="text-fg-secondary text-xs">
              {t(
                "The USDC moves to that address on Bittensor EVM, where the wallet that holds it can use it.",
              )}
            </div>
          )}
        </section>
      )}
      {state.status === "idle" && state.error ? (
        <Notice tone="error">{errorMessage(state.error)}</Notice>
      ) : null}
    </SellLayout>
  )
}
