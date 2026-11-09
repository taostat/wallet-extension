import {
  ExecutionProgress,
  OrderState,
  parseAmountToRaw,
  Quote,
  quoteInputRao,
  rawToNumber,
  sellOutputDecimals,
  sellQuoteSummary,
  trackingSteps,
} from "@taostats-wallet/cross-chain"
import { formatDecimals } from "@taostats-wallet/util"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"

import { useCrossChainSellModal } from "../useCrossChainSellModal"
import {
  CopyButton,
  etherscanAddressUrl,
  ExtrinsicLink,
  Notice,
  SellLayout,
  useCrossChainErrorMessage,
} from "./components"
import { SellHero, useSellAsset } from "./SellHero"
import { SellStepper } from "./SellStepper"
import { useCrossChainSell } from "./useCrossChainSell"
import { useOrderState } from "./useOrderState"

/**
 * The sell once Confirm was clicked: the stepper while it is signed and sent, then the open
 * order's delivery or refund while this screen is open; or where a run that didn't open an order
 * left things (the swap didn't open, or the batch was sent but isn't confirmed yet).
 */
export const SellProgress = () => {
  const { execution } = useCrossChainSell()
  const { state } = execution
  switch (state.status) {
    case "running":
      return <Running progress={state.progress} />
    case "submitted":
      return <Submitted progress={state.progress} quote={state.quote} />
    case "unconfirmed":
      return <Unconfirmed progress={state.progress} txHash={state.txHash} />
    case "failed":
      return <Failed />
    case "idle":
      return null
  }
}

/** The hero from the review's quote, or from the quote the order was opened with. */
const Hero: FC<{ quote?: Quote }> = ({ quote }) => {
  const { review, reviewQuote } = useCrossChainSell()
  if (!review) return null
  const shown = quote ?? reviewQuote.quote ?? review.accepted
  const summary = sellQuoteSummary(shown, 0)
  // In rao: for native TAO the SDK's amounts are in 18-decimal EVM units.
  const payRaw = quote
    ? quoteInputRao(quote)
    : (parseAmountToRaw(review.request.params.amount ?? "", 9) ?? quoteInputRao(shown))
  return (
    <SellHero
      payRaw={payRaw}
      receiveRaw={shown.outputAmount}
      payUsd={summary.inputUsd}
      receiveUsd={summary.outputUsd}
    />
  )
}

const Running: FC<{ progress: ExecutionProgress }> = ({ progress }) => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const { execution } = useCrossChainSell()
  const isSent = progress.submittedHash !== undefined

  return (
    <SellLayout
      title={t("Swap in progress")}
      // Closing before signing cancels the run (the modal's content unmounts); after, it carries on.
      onClose={close}
      footer={
        execution.canCancel ? (
          <Button fullWidth onClick={() => execution.cancel()}>
            {t("Cancel")}
          </Button>
        ) : isSent ? (
          <Button fullWidth onClick={close}>
            {t("Close")}
          </Button>
        ) : null
      }
    >
      <Hero />
      <SellStepper steps={progress.steps} />
      {isSent ? <ClosingNote /> : null}
    </SellLayout>
  )
}

/** Wherever closing the modal stops the live status. True: the swap needs nothing more from here. */
const ClosingNote = () => {
  const { t } = useTranslation()
  return (
    <Notice tone="info">
      {t(
        "Closing this window stops the live status here. Your swap still completes on its own: it's delivered, or refunded if it isn't filled in time.",
      )}
    </Notice>
  )
}

const Submitted: FC<{ progress: ExecutionProgress; quote: Quote }> = ({ progress, quote }) => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const { execution, config } = useCrossChainSell()
  const order = execution.state.status === "submitted" ? execution.state.order : undefined
  const orderState = useOrderState(order, config)

  return (
    <SellLayout
      title={t("Swap status")}
      onClose={close}
      footer={
        <Button primary fullWidth onClick={close}>
          {t("Done")}
        </Button>
      }
    >
      <Hero quote={quote} />
      <SellStepper steps={[...progress.steps, ...trackingSteps(orderState)]} />
      <OrderResult state={orderState} quote={quote} />
    </SellLayout>
  )
}

/** Where the order stands: delivering, delivered, or refunded to the account's EVM address. */
const OrderResult: FC<{ state: OrderState; quote: Quote }> = ({ state, quote }) => {
  const { t } = useTranslation()
  const { output, review } = useCrossChainSell()
  const recipient = review?.request.params.recipient ?? ""
  const where = t("your account's EVM address on {{network}}", { network: "Bittensor" })

  switch (state) {
    case "open":
      return <ClosingNote />
    case "filled":
      return (
        <Notice tone="success" title={t("Delivered")}>
          <span>
            {t("{{amount}} arrived at {{recipient}} on {{network}}.", {
              amount: `${formatDecimals(rawToNumber(quote.outputAmount, sellOutputDecimals(output)))} ${output}`,
              recipient: shortenAddress(recipient),
              network: "Ethereum",
            })}
          </span>
          {recipient ? (
            <a
              href={etherscanAddressUrl(recipient)}
              target="_blank"
              rel="noreferrer noopener"
              className="text-fg-primary inline-flex items-center gap-1 self-start underline"
            >
              {t("View recipient")}
              <LinkExternal01 className="shrink-0" />
            </a>
          ) : null}
        </Notice>
      )
    case "awaiting-refund":
      return (
        <Notice tone="warning" title={t("Not filled in time")}>
          {t(
            "No solver filled your swap in time, so it's being refunded as USDC to {{where}}. This happens on its own.",
            { where },
          )}
        </Notice>
      )
    case "refunded":
      return (
        <Notice tone="info" title={t("Refunded")}>
          {t("Your swap wasn't filled in time and was refunded as USDC to {{where}}.", { where })}
        </Notice>
      )
  }
}

/** Sent, not seen in a block: it may still be included. Never called a failure. */
const Unconfirmed: FC<{ progress: ExecutionProgress; txHash: `0x${string}` }> = ({
  progress,
  txHash,
}) => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const navigate = useNavigate()
  const openHistory = useCallback(() => {
    close()
    navigate("/tx-history")
  }, [close, navigate])

  return (
    <SellLayout
      title={t("Swap status")}
      onClose={close}
      footer={
        <div className="flex gap-3">
          <Button className="flex-1" onClick={close}>
            {t("Close")}
          </Button>
          <Button primary className="flex-1" onClick={openHistory}>
            {t("Open History")}
          </Button>
        </div>
      }
    >
      <Hero />
      <SellStepper steps={progress.steps} />
      <Notice tone="warning" title={t("Sent, not confirmed yet")}>
        <span>
          {t(
            "Your transaction was sent, but it wasn't seen in a block in time. It may still be included: check History, or look it up on Taostats before you try again.",
          )}
        </span>
        <span className="flex items-start gap-1">
          <span className="text-fg-primary min-w-0 break-all font-mono">{txHash}</span>
          <CopyButton text={txHash} kind="hash" />
        </span>
        <ExtrinsicLink hash={txHash} className="self-start" />
      </Notice>
    </SellLayout>
  )
}

/** The batch is in a block but the swap didn't open. For alpha, where the stake is now. */
const Failed = () => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const { execution, input } = useCrossChainSell()
  const errorMessage = useCrossChainErrorMessage()
  const asset = useSellAsset()
  if (execution.state.status !== "failed") return null
  const { failure, progress } = execution.state

  return (
    <SellLayout
      title={t("Swap didn't open")}
      onClose={close}
      footer={
        <Button fullWidth onClick={close}>
          {t("Close")}
        </Button>
      }
    >
      <Hero />
      <SellStepper steps={progress.steps} />
      <Notice tone="error" title={t("The swap didn't open")}>
        <span>{errorMessage(failure.code)}</span>
        {failure.strandedAlpha ? (
          <span>
            {t(
              "Your {{symbol}} left this account but wasn't swapped: it's staked at your account's EVM address. It can be moved back to this account, though not from the wallet yet.",
              { symbol: asset.symbol },
            )}
          </span>
        ) : input?.kind === "tao" ? (
          <span>
            {t(
              "Your TAO is at your account's EVM address on Bittensor, and your next swap uses it.",
            )}
          </span>
        ) : null}
        {failure.txHash ? <ExtrinsicLink hash={failure.txHash} className="self-start" /> : null}
      </Notice>
    </SellLayout>
  )
}
