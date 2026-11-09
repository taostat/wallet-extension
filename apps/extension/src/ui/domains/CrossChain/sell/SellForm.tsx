import {
  bpsToPercent,
  etaDisplay,
  EvmRecipientProblem,
  formatRawAmount,
  quoteErrorCtaLabel,
  rawToNumber,
  SELL_OUTPUTS,
  SellCtaState,
  sellOutputDecimals,
  sellQuoteSummary,
} from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { Edit01 } from "@untitledui/icons/Edit01"
import { FC, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, FormFieldInputText, PillButton, useOpenClose } from "taostats-ui"

import { Fiat } from "@ui/domains/Asset/Fiat"
import { TokenLogo } from "@ui/domains/Asset/TokenLogo"
import { Tokens } from "@ui/domains/Asset/Tokens"
import { BittensorValidatorName } from "@ui/domains/Portfolio/AssetDetails/DashboardTokenBalances/BittensorValidatorName"
import { StakingAccountDisplay } from "@ui/domains/Staking/shared/StakingAccountDisplay"

import { BITTENSOR_MAINNET_ID } from "../constants"
import { useCrossChainSellModal } from "../useCrossChainSellModal"
import { DetailRow, DetailsBox, Notice, SellLayout, useCrossChainErrorMessage } from "./components"
import { OutputLogo, useSellAsset } from "./SellHero"
import { SellSlippageDrawer } from "./SellSlippageDrawer"
import { useCrossChainSell } from "./useCrossChainSell"

/**
 * The sell form: from the account's TAO or alpha position (fixed by the entry point), to USDC or
 * ETH at an Ethereum address, with a live quote. "Review swap" opens the review.
 */
export const SellForm = () => {
  const { t } = useTranslation()
  const { close } = useCrossChainSellModal()
  const { cta, openReview, formQuote } = useCrossChainSell()
  const errorMessage = useCrossChainErrorMessage()
  const slippageDrawer = useOpenClose()
  const ctaLabel = useCtaLabel(cta)

  return (
    <SellLayout
      title={t("Sell for USDC or ETH")}
      onClose={close}
      footer={
        <Button
          primary
          fullWidth
          disabled={cta.kind !== "review"}
          processing={cta.kind === "quoting"}
          onClick={openReview}
        >
          {ctaLabel}
        </Button>
      }
    >
      <PaySection />
      <ReceiveSection />
      <RecipientSection />
      {formQuote.errorCode && cta.kind === "quoteError" ? (
        <Notice tone={formQuote.errorCode === "paused" ? "warning" : "error"}>
          <span>{errorMessage(formQuote.errorCode)}</span>
          <button
            type="button"
            className="text-fg-primary self-start underline"
            onClick={formQuote.refetch}
          >
            {t("Retry")}
          </button>
        </Notice>
      ) : null}
      <QuoteDetails onEditSlippage={slippageDrawer.open} />
      <SellSlippageDrawer isOpen={slippageDrawer.isOpen} onDismiss={slippageDrawer.close} />
    </SellLayout>
  )
}

const useCtaLabel = (cta: SellCtaState): string => {
  const { t } = useTranslation()
  switch (cta.kind) {
    case "enterAmount":
      return t("Enter an amount")
    case "recipientMissing":
      return t("Add a recipient address")
    case "recipientInvalid":
      return t("Invalid recipient address")
    case "insufficientBalance":
      return t("Insufficient balance")
    case "insufficientFeeBalance":
      return t("Not enough {{symbol}} for network fees", { symbol: "TAO" })
    case "quoting":
      return t("Finding the best price")
    case "review":
      return t("Review swap")
    case "quoteError":
      switch (quoteErrorCtaLabel(cta.code)) {
        case "tryAnotherAmount":
          return t("Try a different amount")
        case "rateLimited":
          return t("Too many price requests")
        case "paused":
          return t("Swaps paused for maintenance")
        case "noQuote":
          return t("Couldn't get a price")
      }
  }
}

const PaySection = () => {
  const { t } = useTranslation()
  const { account, input, amount, setAmount, maxRaw, balanceRaw, formQuote, options } =
    useCrossChainSell()
  const asset = useSellAsset()
  const payUsd =
    formQuote.quote && !formQuote.isStale
      ? sellQuoteSummary(formQuote.quote, 0).inputUsd
      : undefined

  return (
    <section className="bg-secondary flex flex-col gap-3 rounded p-4">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-fg-secondary">{t("You pay")}</span>
        <StakingAccountDisplay
          address={account?.address ?? options?.address}
          chainId={BITTENSOR_MAINNET_ID}
          className="text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <TokenLogo tokenId={asset.tokenId} className="shrink-0 text-xl" />
        <div className="flex min-w-0 shrink-0 flex-col">
          <span className="text-fg-primary max-w-[140px] truncate text-base">{asset.name}</span>
          {input?.kind === "alpha" ? (
            <BittensorValidatorName
              hotkey={input.hotkey}
              className="text-fg-secondary max-w-[140px] truncate text-xs"
            />
          ) : null}
        </div>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-label={t("Amount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-fg-primary placeholder:text-fg-tertiary min-w-0 grow bg-transparent text-right text-lg focus-visible:outline-none"
        />
      </div>
      <div className="text-fg-secondary flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-1">
          <span>{t("Available")}:</span>
          {balanceRaw !== undefined ? (
            <Tokens amount={formatRawAmount(balanceRaw, 9)} symbol={asset.symbol} noCountUp />
          ) : (
            <span>-</span>
          )}
          {maxRaw !== undefined && maxRaw > 0n ? (
            <PillButton
              size="xs"
              className="ml-1 h-5 px-2"
              onClick={() => setAmount(formatRawAmount(maxRaw, 9))}
            >
              {t("Max")}
            </PillButton>
          ) : null}
        </div>
        {payUsd !== undefined ? <Fiat amount={payUsd} forceCurrency="usd" noCountUp /> : null}
      </div>
    </section>
  )
}

const ReceiveSection = () => {
  const { t } = useTranslation()
  const { output, setOutput, formQuote } = useCrossChainSell()
  const { quote, isStale, isFetching } = formQuote
  const receive = quote ? rawToNumber(quote.outputAmount, sellOutputDecimals(output)) : undefined
  const receiveUsd = quote ? sellQuoteSummary(quote, 0).outputUsd : undefined

  return (
    <section className="bg-secondary flex flex-col gap-3 rounded p-4">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-fg-secondary">{t("You receive")}</span>
        <span className="text-fg-secondary">{t("on {{network}}", { network: "Ethereum" })}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={t("You receive")}>
          {SELL_OUTPUTS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={output === option}
              onClick={() => setOutput(option)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-sm border px-2 text-sm",
                output === option
                  ? "border-brand bg-brand-secondary text-fg-brand"
                  : "border-primary text-fg-secondary hover:text-fg-primary",
              )}
            >
              <OutputLogo output={option} className="size-5 text-[6px]" />
              {option}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "text-fg-primary min-w-0 truncate text-right text-lg transition-opacity",
            (isStale || isFetching) && "opacity-50",
          )}
        >
          {receive !== undefined ? <Tokens amount={receive} symbol={output} noCountUp /> : "0"}
        </div>
      </div>
      {receiveUsd !== undefined ? (
        <div className="text-fg-secondary text-right text-xs">
          <Fiat amount={receiveUsd} forceCurrency="usd" noCountUp />
        </div>
      ) : null}
    </section>
  )
}

const useRecipientProblemText = (problem: EvmRecipientProblem): string => {
  const { t } = useTranslation()
  switch (problem) {
    case "tooShort":
      return t("This address is too short.")
    case "tooLong":
      return t("This address is too long.")
    case "badChecksum":
      return t("This address has a typo. Check every character.")
    case "zeroAddress":
    case "invalid":
      return t("This isn't a valid {{network}} address.", { network: "Ethereum" })
  }
}

const RecipientSection = () => {
  const { t } = useTranslation()
  const { recipient, setRecipient, recipientProblem } = useCrossChainSell()
  // "Too short" waits for the field to be left: every address is too short while it is typed.
  const [isTyping, setIsTyping] = useState(false)
  const showProblem = recipientProblem !== null && !(isTyping && recipientProblem === "tooShort")
  const problemText = useRecipientProblemText(recipientProblem ?? "invalid")

  return (
    <section className="flex flex-col gap-2">
      <label htmlFor="cross-chain-sell-recipient" className="text-fg-secondary text-xs">
        {t("Receive at")}
      </label>
      <FormFieldInputText
        id="cross-chain-sell-recipient"
        small
        value={recipient}
        placeholder={t("Ethereum address (0x…)")}
        onChange={(e) => {
          setIsTyping(true)
          setRecipient(e.target.value)
        }}
        onBlur={() => setIsTyping(false)}
        containerProps={{ className: cn("font-mono text-sm", showProblem && "border-alert-error") }}
        aria-invalid={showProblem}
      />
      {showProblem ? (
        <div role="alert" className="text-fg-error text-xs">
          {problemText}
        </div>
      ) : (
        <div className="text-fg-secondary text-xs">
          {t(
            "Use an Ethereum address you control, such as your own wallet. What is sent to a wrong address can't be recovered.",
          )}
        </div>
      )}
    </section>
  )
}

const QuoteDetails: FC<{ onEditSlippage: () => void }> = ({ onEditSlippage }) => {
  const { t } = useTranslation()
  const { formQuote, slippageBps, output } = useCrossChainSell()
  const summary = formQuote.quote ? sellQuoteSummary(formQuote.quote, slippageBps) : undefined
  const eta = summary?.etaSeconds !== undefined ? etaDisplay(summary.etaSeconds) : undefined

  return (
    <DetailsBox className={cn(formQuote.isStale && "opacity-70")}>
      {summary ? (
        <DetailRow label={t("Minimum received")}>
          <Tokens
            amount={rawToNumber(summary.minReceiveRaw, sellOutputDecimals(output))}
            symbol={output}
            noCountUp
          />
        </DetailRow>
      ) : null}
      <DetailRow label={t("Max Slippage")}>
        <button
          type="button"
          onClick={onEditSlippage}
          className="text-fg-primary hover:text-fg-brand inline-flex items-center gap-1"
        >
          <Edit01 />
          <span>{bpsToPercent(slippageBps)}%</span>
        </button>
      </DetailRow>
      {summary?.costs.totalUsd !== undefined ? (
        <DetailRow label={t("Total cost")}>
          <Fiat amount={summary.costs.totalUsd} forceCurrency="usd" noCountUp />
        </DetailRow>
      ) : null}
      {eta ? (
        <DetailRow label={t("Estimated time")}>
          {eta.unit === "minutes"
            ? t("~{{minutes}} min", { minutes: eta.count })
            : t("~{{seconds}} s", { seconds: eta.count })}
        </DetailRow>
      ) : null}
      {formQuote.isIndicative && formQuote.quote ? (
        <div className="text-fg-secondary text-xs">{t("Estimate")}</div>
      ) : null}
    </DetailsBox>
  )
}
