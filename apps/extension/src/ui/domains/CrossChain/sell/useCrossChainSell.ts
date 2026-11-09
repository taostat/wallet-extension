import { subNativeTokenId } from "@taostats-wallet/chaindata-provider"
import {
  DEFAULT_CROSS_CHAIN_CONFIG,
  DEFAULT_SLIPPAGE_BPS,
  evmRecipientProblem,
  isAwaitingMovedPrice,
  maxSellRaw,
  parseAmountToRaw,
  parseUsd,
  Quote,
  resolveReviewCta,
  resolveSellCta,
  reviewOpenedEvent,
  reviewPrice,
  SellInput,
  SellOutput,
  SellQuoteParamsResult,
  sellShortfall,
  usdBucket,
} from "@taostats-wallet/cross-chain"
import { useCallback, useMemo, useState } from "react"

import { provideContext } from "@taostats/util/provideContext"
import { useAccountByAddress, useBalance, useNetworkById, useToken } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "../constants"
import { captureCrossChainEvent } from "../crossChainAnalytics"
import { useCrossChainConfig } from "../crossChainSellGate"
import { getCrossChainSellOpenOptions } from "../useCrossChainSellModal"
import { useCrossChainSigner } from "../useCrossChainSigner"
import { useSellExecution } from "./useSellExecution"
import { useSellNetworkFee } from "./useSellNetworkFee"
import { useSellQuote, useSellReviewQuote } from "./useSellQuotes"

const TAO_TOKEN_ID = subNativeTokenId(BITTENSOR_MAINNET_ID)

/** What the review opened with: the form's request, made firm, and the quote it was accepted on. */
type ReviewSession = {
  request: Extract<SellQuoteParamsResult, { ok: true }>
  /** The output the user accepted: the form's quote, or a new price accepted in the review. */
  accepted: Quote
}

/** Only digits and one point (a comma is read as the point): the amount is always a dot-decimal. */
const sanitizeAmount = (text: string): string | null => {
  const value = text.replace(",", ".")
  return /^\d*\.?\d*$/.test(value) ? value : null
}

/**
 * One sell, from the form to the open order: what is sold (fixed by the entry point), the form,
 * its live quote, the review with its own firm quote and price rules, and the run.
 */
const useCrossChainSellProvider = () => {
  // Read once: every opening of the modal mounts a fresh sell.
  const [options] = useState(getCrossChainSellOpenOptions)
  const address = options?.address ?? null

  const account = useAccountByAddress(address)
  const network = useNetworkById(BITTENSOR_MAINNET_ID, "polkadot")
  const signer = useCrossChainSigner(account, network?.genesisHash)
  const { data: configResult } = useCrossChainConfig()
  const config = configResult?.config ?? DEFAULT_CROSS_CHAIN_CONFIG

  const input = useMemo<SellInput | null>(() => {
    if (!options) return null
    return options.asset.kind === "tao"
      ? { kind: "tao" }
      : { kind: "alpha", netuid: options.asset.netuid, hotkey: options.asset.hotkey }
  }, [options])

  // Balances, live: what is sold, and the free TAO that pays the batch.
  const assetToken = useToken(options?.tokenId)
  const assetBalance = useBalance(address, options?.tokenId)
  const taoBalance = useBalance(address, TAO_TOKEN_ID)
  const freeTaoRaw = taoBalance?.transferable.planck
  const balanceRaw = input?.kind === "tao" ? freeTaoRaw : assetBalance?.free.planck
  const maxRaw = input && balanceRaw !== undefined ? maxSellRaw(input.kind, balanceRaw) : undefined

  // The form.
  const [output, setOutput] = useState<SellOutput>("USDC")
  const [amount, setAmountText] = useState("")
  const [recipient, setRecipient] = useState("")
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS)
  const [review, setReview] = useState<ReviewSession | null>(null)

  const setAmount = useCallback((text: string) => {
    const value = sanitizeAmount(text)
    if (value !== null) setAmountText(value)
  }, [])

  const amountRaw = parseAmountToRaw(amount, 9)
  const hasAmount = amountRaw !== null && amountRaw > 0n
  const recipientProblem = evmRecipientProblem(recipient)
  const recipientStatus =
    recipient.trim() === "" ? "missing" : recipientProblem === null ? "valid" : "invalid"
  const shortfall =
    input && hasAmount
      ? sellShortfall({ kind: input.kind, amountRaw, balanceRaw, freeTaoRaw })
      : null

  const execution = useSellExecution(config)
  const isReviewing = review !== null

  const formQuote = useSellQuote(
    {
      input: input ?? { kind: "tao" },
      output,
      amount: input ? amount : "",
      coldkey: address,
      recipient,
    },
    { paused: isReviewing, config },
  )

  const cta = resolveSellCta({
    hasAmount,
    recipientStatus,
    shortfall,
    quote: {
      hasQuote: formQuote.quote !== undefined,
      isStale: formQuote.isStale,
      isFetching: formQuote.isFetching,
      errorCode: formQuote.errorCode,
    },
  })

  /** "Review swap": only with a firm request and the quote for it on screen. */
  const openReview = useCallback(() => {
    const { request, quote, isStale, isIndicative } = formQuote
    if (
      cta.kind !== "review" ||
      !request ||
      request.isIndicative ||
      !quote ||
      isStale ||
      isIndicative
    )
      return
    execution.clearFeedback()
    setReview({ request, accepted: quote })
    if (input)
      captureCrossChainEvent(
        reviewOpenedEvent({
          from: input.kind,
          to: output,
          usdBucket: usdBucket(parseUsd(quote.inputUsd)),
        }),
      )
  }, [cta.kind, execution, formQuote, input, output])

  const closeReview = useCallback(() => {
    if (execution.state.status !== "idle") return
    execution.clearFeedback()
    setReview(null)
  }, [execution])

  // The review: its own firm quote, refreshed until signing starts.
  const isIdle = execution.state.status === "idle"
  const reviewQuote = useSellReviewQuote(review?.request ?? null, {
    paused: !isReviewing || !isIdle,
    config,
  })
  const latest = reviewQuote.quote
  const price = review
    ? reviewPrice({
        acceptedOutput: review.accepted.outputAmount,
        latestOutput: latest?.outputAmount,
        slippageBps,
      })
    : undefined
  const feedback = execution.state.status === "idle" ? execution.state.feedback : undefined
  const awaitingMovedPrice = isAwaitingMovedPrice(
    feedback?.priceMovedAt,
    reviewQuote.quoteUpdatedAt,
  )
  const reviewCta = resolveReviewCta({
    signerReady: signer !== null,
    hasQuote: latest !== undefined,
    // A failed refresh keeps the last firm quote confirmable: `execute` takes its own fresh quote
    // and refuses anything below the accepted floor. It blocks only with no quote at all, or when
    // the Intents contract is paused.
    quoteFailed:
      reviewQuote.errorCode !== undefined &&
      (latest === undefined || reviewQuote.errorCode === "paused"),
    awaitingMovedPrice,
    hasMoved: price?.hasMoved ?? false,
  })

  const networkFee = useSellNetworkFee({
    config,
    genesisHash: network?.genesisHash,
    address,
    quote: latest,
    requestKey: review?.request.queryKey,
    slippageBps,
    enabled: isReviewing,
  })

  const symbol = assetToken?.symbol

  /** Confirm: only from the button, and only while it says so. */
  const confirm = useCallback(() => {
    if (reviewCta.kind !== "confirm" || !review || !latest || !price || !signer || !input) return
    void execution.start({
      params: review.request.params,
      minOutputAmount: price.minOutput,
      slippageBps,
      signer,
      onPriceMoved: reviewQuote.refetch,
      record: {
        address: signer.address,
        input,
        output,
        ...(symbol && { symbol }),
        expectedOutputRaw: latest.outputAmount,
        usdBucket: usdBucket(parseUsd(latest.inputUsd)),
      },
    })
  }, [
    execution,
    input,
    latest,
    output,
    price,
    review,
    reviewCta.kind,
    reviewQuote.refetch,
    signer,
    slippageBps,
    symbol,
  ])

  /** "Accept new price": the latest quote becomes the accepted one. */
  const acceptPrice = useCallback(() => {
    if (!latest) return
    setReview((current) => (current ? { ...current, accepted: latest } : current))
    execution.clearFeedback()
  }, [execution, latest])

  return {
    options,
    input,
    account,
    network,
    signer,
    config,
    assetToken,
    balanceRaw,
    freeTaoRaw,
    maxRaw,
    // form
    output,
    setOutput,
    amount,
    setAmount,
    amountRaw,
    recipient,
    setRecipient,
    recipientProblem,
    slippageBps,
    setSlippageBps,
    formQuote,
    cta,
    openReview,
    // review
    review,
    closeReview,
    reviewQuote,
    price,
    feedback,
    awaitingMovedPrice,
    reviewCta,
    networkFee: networkFee.data ?? undefined,
    confirm,
    acceptPrice,
    // run
    execution,
  }
}

export const [CrossChainSellProvider, useCrossChainSell] = provideContext(useCrossChainSellProvider)
