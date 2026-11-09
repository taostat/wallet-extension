import {
  bpsToPercent,
  etaDisplay,
  FILL_WINDOW_SECONDS,
  formatRawAmount,
  parseAmountToRaw,
  quoteInputRao,
  quoteRate,
  rawToNumber,
  refundEstimate,
  ReviewCta,
  ReviewFeedback,
  sellOutputDecimals,
  sellQuoteSummary,
} from "@taostats-wallet/cross-chain"
import { cn, formatDecimals } from "@taostats-wallet/util"
import { FC, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { Fiat } from "@ui/domains/Asset/Fiat"
import { Tokens } from "@ui/domains/Asset/Tokens"
import { BittensorValidatorName } from "@ui/domains/Portfolio/AssetDetails/DashboardTokenBalances/BittensorValidatorName"
import { StakingAccountDisplay } from "@ui/domains/Staking/shared/StakingAccountDisplay"

import { BITTENSOR_MAINNET_ID } from "../constants"
import { useCrossChainSellModal } from "../useCrossChainSellModal"
import {
  CopyButton,
  DetailRow,
  DetailsBox,
  Notice,
  SellLayout,
  useCrossChainErrorMessage,
} from "./components"
import { SellHero, useSellAsset } from "./SellHero"
import { useCrossChainSell } from "./useCrossChainSell"

const FILL_WINDOW_MINUTES = Math.round(FILL_WINDOW_SECONDS / 60)

/**
 * The review: the firm price (refreshed every 30 s), what is paid, the least that arrives, the
 * fees, the fill window and the recipient in full. Confirm signs and sends the swap.
 */
export const SellReview = () => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const {
    review,
    closeReview,
    reviewQuote,
    reviewCta,
    awaitingMovedPrice,
    feedback,
    confirm,
    acceptPrice,
    output,
  } = useCrossChainSell()
  const errorMessage = useCrossChainErrorMessage()
  const asset = useSellAsset()

  // Confirm is enabled half a second after the review opens, so a double click on "Review swap"
  // can't confirm it (as the staking review does).
  const [isArmed, setIsArmed] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setIsArmed(true), 500)
    return () => clearTimeout(timer)
  }, [])

  if (!review) return null
  const shown = reviewQuote.quote ?? review.accepted
  const summary = sellQuoteSummary(shown, 0)
  const payRaw = parseAmountToRaw(review.request.params.amount ?? "", 9) ?? quoteInputRao(shown)

  return (
    <SellLayout
      title={t("Review swap")}
      onBack={closeReview}
      onClose={close}
      footer={
        <>
          <RefreshCountdown />
          <div className="flex gap-3">
            <Button className="flex-1" onClick={closeReview}>
              {t("Cancel")}
            </Button>
            <ReviewCtaButton
              cta={reviewCta}
              disabled={!isArmed}
              onConfirm={confirm}
              onAccept={acceptPrice}
            />
          </div>
        </>
      }
    >
      <SellHero
        payRaw={payRaw}
        receiveRaw={shown.outputAmount}
        payUsd={summary.inputUsd}
        receiveUsd={summary.outputUsd}
        isRefreshing={reviewQuote.isFetching}
      />
      {reviewQuote.errorCode ? (
        <Notice tone={reviewQuote.errorCode === "paused" ? "warning" : "error"}>
          <span>{errorMessage(reviewQuote.errorCode)}</span>
          <button
            type="button"
            className="text-fg-primary self-start underline"
            onClick={reviewQuote.refetch}
            disabled={reviewQuote.isFetching}
          >
            {t("Retry")}
          </button>
        </Notice>
      ) : null}
      {awaitingMovedPrice ? (
        <Notice tone="warning" title={t("The price moved")}>
          {t(
            "The price moved before your swap was sent, so nothing was sent. Getting the new price…",
          )}
        </Notice>
      ) : null}
      {reviewCta.kind === "acceptPrice" && reviewQuote.quote ? (
        <Notice tone="warning" title={t("The price moved")}>
          <span>
            {t(
              "You'd now get {{amount}}, less than your max slippage allows. Accept the new price to continue.",
              {
                amount: `${formatDecimals(rawToNumber(reviewQuote.quote.outputAmount, sellOutputDecimals(output)))} ${output}`,
              },
            )}
          </span>
        </Notice>
      ) : null}
      {feedback ? <FeedbackNotice feedback={feedback} symbol={asset.symbol} /> : null}
      <ReviewDetails />
    </SellLayout>
  )
}

const ReviewDetails = () => {
  const { t } = useTranslation()
  const { review, reviewQuote, price, output, slippageBps, input, account, options, networkFee } =
    useCrossChainSell()
  const asset = useSellAsset()
  if (!review || !price) return null

  const shown = reviewQuote.quote ?? review.accepted
  const summary = sellQuoteSummary(shown, slippageBps)
  const decimals = sellOutputDecimals(output)
  const rate = quoteRate(shown, decimals)
  const eta = summary.etaSeconds !== undefined ? etaDisplay(summary.etaSeconds) : undefined
  const refund = refundEstimate(shown)
  const recipient = review.request.params.recipient ?? ""
  const breakdown = summary.costs.breakdown

  return (
    <>
      <DetailsBox className={cn(reviewQuote.isFetching && "opacity-70 transition-opacity")}>
        {rate !== undefined ? (
          <DetailRow label={t("Rate")}>
            {`1 ${asset.symbol} = ${formatDecimals(rate)} ${output}`}
          </DetailRow>
        ) : null}
        <DetailRow label={t("Minimum received")}>
          <Tokens amount={rawToNumber(price.minOutput, decimals)} symbol={output} noCountUp />
        </DetailRow>
        <DetailRow label={t("Max Slippage")}>{`${bpsToPercent(slippageBps)}%`}</DetailRow>
        {summary.costs.totalUsd !== undefined ? (
          <DetailRow label={t("Total cost")}>
            <Fiat amount={summary.costs.totalUsd} forceCurrency="usd" noCountUp />
          </DetailRow>
        ) : null}
        {breakdown ? (
          <div className="border-primary flex flex-col gap-1 border-l pl-3">
            {breakdown.serviceUsd !== undefined ? (
              <DetailRow label={t("Service fee")}>
                <Fiat amount={breakdown.serviceUsd} forceCurrency="usd" noCountUp />
              </DetailRow>
            ) : null}
            {breakdown.solverUsd !== undefined ? (
              <DetailRow label={t("Solver fee")}>
                <Fiat amount={breakdown.solverUsd} forceCurrency="usd" noCountUp />
              </DetailRow>
            ) : null}
            {breakdown.networkGasUsd !== undefined ? (
              <DetailRow label={t("Network gas")}>
                <Fiat amount={breakdown.networkGasUsd} forceCurrency="usd" noCountUp />
              </DetailRow>
            ) : null}
          </div>
        ) : null}
        {networkFee !== undefined ? (
          <DetailRow label={t("Network fee")}>
            <span className="inline-flex items-center gap-1">
              ≈ <Tokens amount={formatRawAmount(networkFee, 9)} symbol="TAO" noCountUp />
            </span>
          </DetailRow>
        ) : null}
        {eta ? (
          <DetailRow label={t("Estimated time")}>
            {eta.unit === "minutes"
              ? t("~{{minutes}} min", { minutes: eta.count })
              : t("~{{seconds}} s", { seconds: eta.count })}
          </DetailRow>
        ) : null}
      </DetailsBox>
      <DetailsBox>
        <DetailRow label={t("From")}>
          <StakingAccountDisplay
            address={account?.address ?? options?.address}
            chainId={BITTENSOR_MAINNET_ID}
            className="text-xs"
          />
        </DetailRow>
        {input?.kind === "alpha" ? (
          <DetailRow label={t("From validator")}>
            <BittensorValidatorName hotkey={input.hotkey} />
          </DetailRow>
        ) : null}
        <div className="flex flex-col gap-1 text-xs">
          <div className="text-fg-secondary">{t("Recipient")}</div>
          <div className="flex items-start gap-1">
            <span className="text-fg-primary min-w-0 break-all font-mono">{recipient}</span>
            <CopyButton text={recipient} />
          </div>
        </div>
      </DetailsBox>
      <p className="text-fg-secondary px-1 text-xs">
        {refund.kind === "approx"
          ? t(
              "Not delivered within {{minutes}} minutes? You get about {{amount}} USDC back on {{network}}.",
              {
                minutes: FILL_WINDOW_MINUTES,
                amount: formatDecimals(refund.usdc),
                network: "Bittensor",
              },
            )
          : t(
              "Not delivered within {{minutes}} minutes? You get your money back as USDC on {{network}}.",
              { minutes: FILL_WINDOW_MINUTES, network: "Bittensor" },
            )}{" "}
        {t("It lands at your account's EVM address on Bittensor.")}
      </p>
    </>
  )
}

const FeedbackNotice: FC<{ feedback: ReviewFeedback; symbol: string }> = ({ feedback, symbol }) => {
  const { t } = useTranslation()
  const errorMessage = useCrossChainErrorMessage()
  const { input } = useCrossChainSell()
  const { error } = feedback
  if (!error) return null
  const shortfall = error.shortfall
  const format = (raw: bigint) => formatDecimals(rawToNumber(raw, 9))

  return (
    <Notice tone="error">
      <span>{errorMessage(error.code)}</span>
      {shortfall ? (
        <span>
          {input?.kind === "alpha"
            ? // An alpha sale can fall short of the alpha or of the TAO its batch pays: both in rao.
              t("Needed: {{required}}. Available: {{available}}.", {
                required: format(shortfall.required),
                available: format(shortfall.available),
              })
            : t("You need {{required}} and have {{available}}.", {
                required: `${format(shortfall.required)} ${symbol}`,
                available: `${format(shortfall.available)} ${symbol}`,
              })}
        </span>
      ) : null}
    </Notice>
  )
}

/** "Price updates in 23 s", or "Updating the price". */
const RefreshCountdown = () => {
  const { t } = useTranslation()
  const { reviewQuote, execution } = useCrossChainSell()
  const seconds = useSecondsUntil(reviewQuote.refreshAt)
  if (execution.state.status !== "idle") return null
  const text = reviewQuote.isFetching
    ? t("Updating the price")
    : seconds === undefined
      ? null
      : t("Price updates in {{seconds}} s", { seconds })
  return text ? <div className="text-fg-secondary text-center text-xs">{text}</div> : null
}

/** Whole seconds until `at` (ms), ticking once a second; `undefined` without a time. */
const useSecondsUntil = (at: number | undefined): number | undefined => {
  const [now, setNow] = useState(() => Date.now())
  // A clock outside React.
  useEffect(() => {
    if (at === undefined) return
    const timer = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(timer)
  }, [at])
  return at === undefined ? undefined : Math.max(0, Math.ceil((at - now) / 1_000))
}

const ReviewCtaButton: FC<{
  cta: ReviewCta
  disabled: boolean
  onConfirm: () => void
  onAccept: () => void
}> = ({ cta, disabled, onConfirm, onAccept }) => {
  const { t } = useTranslation()
  const isEnabled = cta.kind === "confirm" || cta.kind === "acceptPrice"
  const label = (() => {
    switch (cta.kind) {
      case "confirm":
        return t("Confirm swap")
      case "acceptPrice":
        return t("Accept new price")
      case "gettingPrice":
        return t("Getting the final price")
      case "quoteError":
        return t("Couldn't get a price")
      case "walletNotReady":
        return t("Connecting to Bittensor")
    }
  })()
  return (
    <Button
      primary
      className="flex-1"
      disabled={disabled || !isEnabled}
      processing={cta.kind === "gettingPrice" || cta.kind === "walletNotReady"}
      onClick={cta.kind === "acceptPrice" ? onAccept : onConfirm}
    >
      {label}
    </Button>
  )
}
