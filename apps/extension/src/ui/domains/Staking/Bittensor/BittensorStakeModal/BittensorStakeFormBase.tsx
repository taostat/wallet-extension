import { Token } from "@taostats-wallet/chaindata-provider"
import { SwapIcon } from "@taostats-wallet/icons"
import { classNames, planckToTokens, tokensToPlanck } from "@taostats-wallet/util"
import { Account } from "extension-core"
import {
  ChangeEventHandler,
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import { Button, PillButton } from "taostats-ui"

import { useInputAutoWidth } from "@ui/hooks/useInputAutoWidth"
import { useBalance, useSelectedCurrency } from "@ui/state"

const limitDecimals = (value: string, dp = 6) => {
  const [whole, fraction] = value.split(".")
  if (fraction === undefined) return value
  return `${whole}.${fraction.slice(0, dp)}`
}

import { currencyConfig } from "../../../Asset/currencyConfig"
import { Fiat } from "../../../Asset/Fiat"
import { TokenLogo } from "../../../Asset/TokenLogo"
import { Tokens } from "../../../Asset/Tokens"
import { TokensAndFiat } from "../../../Asset/TokensAndFiat"
import { STAKING_MODAL_CONTENT_CONTAINER_ID } from "../../shared/ModalContent"
import { StakeAccountPicker } from "../../Stake/StakeAccountPicker"
import { BittensorAssetAccountSummary } from "../components/BittensorAssetAccountSummary"
import { BittensorStakingModalHeader } from "../components/BittensorModalHeader"
import { BittensorModalLayout } from "../components/BittensorModalLayout"
import { useBittensorStakeModal } from "../hooks/useBittensorStakeModal"
import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"
import { ROOT_NETUID } from "../utils/constants"
import { StakingFeeEstimate } from "./../../shared/StakingFeeEstimate"
import { BittensorAvailableToUnstake } from "./BittensorAvailableToUnstake"
import { BittensorDelegatorNameButton } from "./BittensorDelegatorNameButton"
import { BittensorSelectStakeDrawer } from "./Drawers/BittensorSelectStakeDrawer"

const AvailableBalance: FC<{ token: Token; account: Account }> = ({ token, account }) => {
  const balance = useBalance(account.address, token.id)
  const selectedCurrency = useSelectedCurrency()

  if (!balance) return null

  return (
    <TokensAndFiat
      isBalance
      tokenId={token?.id}
      planck={balance.transferable.planck}
      className={classNames(balance.status !== "live" && "animate-pulse")}
      tokensClassName="text-body"
      fiatClassName="text-body-secondary"
      noFiat={selectedCurrency === "tao"}
    />
  )
}

const DisplayContainer: FC<PropsWithChildren> = ({ children }) => {
  return <div className="text-body-secondary max-w-[264px] truncate text-sm">{children}</div>
}

const FiatDisplay = () => {
  const { tokenRates, amountTao } = useBittensorStakeWizard()

  if (!tokenRates) return null

  return (
    <DisplayContainer>
      <Fiat amount={amountTao?.fiat("usd") ?? 0} forceCurrency="usd" noCountUp />
    </DisplayContainer>
  )
}

const TokenDisplay = () => {
  const { nativeToken, stakeDirection, netuid, amountIn } = useBittensorStakeWizard()

  const tokenPlancks = useMemo(
    () => planckToTokens(String(amountIn || 0n), nativeToken?.decimals),
    [amountIn, nativeToken?.decimals],
  )

  const symbol = useMemo(() => {
    if (stakeDirection === "unstake" && netuid !== ROOT_NETUID) {
      return `SN${netuid}`
    }
    return nativeToken?.symbol
  }, [netuid, stakeDirection, nativeToken?.symbol])

  if (!nativeToken) return null

  return (
    <DisplayContainer>
      <Tokens amount={tokenPlancks} decimals={nativeToken.decimals} symbol={symbol} noCountUp />
    </DisplayContainer>
  )
}

const TokenInput = ({ onEdit }: { onEdit: () => void }) => {
  const { nativeToken, dtaoToken, amountTao, amountAlpha, isSubnetUnstake, setPlancks, netuid } =
    useBittensorStakeWizard()

  const symbol = useMemo(() => {
    if (isSubnetUnstake) {
      return `SN${netuid}`
    }
    return nativeToken?.symbol
  }, [isSubnetUnstake, netuid, nativeToken?.symbol])

  const formattedValue = useMemo(() => {
    const raw = isSubnetUnstake ? (amountAlpha?.tokens ?? "") : (amountTao?.tokens ?? "")
    return limitDecimals(raw)
  }, [amountTao?.tokens, amountAlpha?.tokens, isSubnetUnstake])

  const [value, setValue] = useState(formattedValue)
  const refSkipSync = useRef(false)

  useEffect(() => {
    if (refSkipSync.current) {
      refSkipSync.current = false
      return
    }
    setValue(formattedValue)
  }, [formattedValue])

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      refSkipSync.current = true
      onEdit()
      const nextValue = e.target.value
      setValue(nextValue)

      if (!nativeToken || !nextValue.trim()) return setPlancks(null)

      try {
        const plancks = tokensToPlanck(nextValue, nativeToken.decimals)
        setPlancks(BigInt(plancks))
      } catch (err) {
        // invalid input, ignore
        setPlancks(null)
      }
    },
    [setPlancks, nativeToken, onEdit],
  )

  const refTokensInput = useRef<HTMLInputElement>(null)

  // auto focus if empty
  const refInitialized = useRef(false)
  useEffect(() => {
    if (refInitialized.current) return
    refInitialized.current = true
    if (!amountTao) refTokensInput.current?.focus()
  }, [amountTao, refTokensInput])

  // resize input to keep content centered
  useInputAutoWidth(refTokensInput)

  return (
    <div className="flex w-full flex-nowrap items-center justify-between gap-4">
      <div className="text-body flex shrink-0 items-center gap-2 text-base font-normal">
        <TokenLogo className="text-lg" tokenId={isSubnetUnstake ? dtaoToken?.id : nativeToken?.id} />
        <div>{symbol}</div>
      </div>
      <input
        key="tokenInput"
        ref={refTokensInput}
        type="text"
        inputMode="decimal"
        placeholder="0"
        step="any"
        value={value}
        className={"text-body peer inline-block w-fit min-w-0 text-ellipsis bg-transparent text-lg"}
        onChange={handleChange}
      />
    </div>
  )
}

/**
 * Secondary input showing the alpha (or TAO) equivalent of the primary amount.
 * Staking:  primary=TAO  → secondary=Alpha. Typing alpha runs alphaToTao reverse sim → setPlancks(TAO).
 * Unstaking subnet: primary=Alpha → secondary=TAO.  Typing TAO  runs taoToAlpha reverse sim → setPlancks(Alpha).
 * Hidden for root stake/unstake (netuid === 0).
 */
const AlphaInput = ({
  lastEditedInput,
}: {
  lastEditedInput: { current: "primary" | "alpha" }
}) => {
  const { nativeToken, dtaoToken, amountOut, setPlancks, netuid, isSubnetUnstake, alphaPrice } =
    useBittensorStakeWizard()

  // secondary token: alpha when staking, TAO when unstaking subnet
  const secondaryToken = isSubnetUnstake ? nativeToken : dtaoToken
  const secondarySymbol = isSubnetUnstake ? nativeToken?.symbol : `SN${netuid}`
  const secondaryTokenId = isSubnetUnstake ? nativeToken?.id : dtaoToken?.id

  const isFocused = useRef(false)

  const formattedAmountOut = useMemo(() => {
    const raw = amountOut ? (planckToTokens(String(amountOut), secondaryToken?.decimals) ?? "") : ""
    return limitDecimals(raw)
  }, [amountOut, secondaryToken?.decimals])

  const [value, setValue] = useState(formattedAmountOut)

  // Sync display value from forward simulation only when the primary (TAO) field was last edited
  useEffect(() => {
    if (isFocused.current) return
    if (lastEditedInput.current === "alpha") return
    setValue(formattedAmountOut)
  }, [formattedAmountOut, lastEditedInput])

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      lastEditedInput.current = "alpha"
      const nextValue = e.target.value
      setValue(nextValue)

      if (!secondaryToken || !nextValue.trim() || typeof alphaPrice !== "bigint") {
        setPlancks(null)
        return
      }

      try {
        const secondaryPlanks = BigInt(tokensToPlanck(nextValue, secondaryToken.decimals))
        // Use the pool spot price (alphaPrice) for a symmetric conversion:
        //   alphaPrice = tao_planks * scale / alpha_planks  (TAO per alpha, scaled by 10^9)
        // Staking:   user types alpha → tao = alpha * alphaPrice / scale
        // Unstaking: user types TAO   → alpha = TAO * scale / alphaPrice
        const scale = 10n ** BigInt(secondaryToken.decimals)
        const primaryPlanks = isSubnetUnstake
          ? (secondaryPlanks * scale) / alphaPrice
          : (secondaryPlanks * alphaPrice) / scale
        setPlancks(primaryPlanks)
      } catch {
        setPlancks(null)
      }
    },
    [secondaryToken, setPlancks, alphaPrice, isSubnetUnstake, lastEditedInput],
  )

  const refInput = useRef<HTMLInputElement>(null)
  useInputAutoWidth(refInput)

  if (!secondaryToken || typeof netuid !== "number" || netuid === 0) return null

  return (
    <div className="flex w-full flex-nowrap items-center justify-between gap-4">
      <div className="text-body flex shrink-0 items-center gap-2 text-base font-normal">
        <TokenLogo className="text-lg" tokenId={secondaryTokenId} />
        <div>{secondarySymbol}</div>
      </div>
      <input
        ref={refInput}
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={value}
        className="text-body peer inline-block w-fit min-w-0 text-ellipsis bg-transparent text-lg"
        onChange={handleChange}
        onFocus={() => {
          isFocused.current = true
        }}
        onBlur={() => {
          isFocused.current = false
        }}
      />
    </div>
  )
}

const FiatInput = () => {
  const { nativeToken, tokenRates, amountTao, setPlancks, isSubnetUnstake, swapPrice } =
    useBittensorStakeWizard()
  const currency = useSelectedCurrency()

  const formattedValue = useMemo(() => {
    const val = amountTao?.fiat(currency) ?? ""
    return val ? String(Number(val.toFixed(2))) : val
  }, [currency, amountTao])

  const [value, setValue] = useState(formattedValue)
  const refSkipSync = useRef(false)

  useEffect(() => {
    if (refSkipSync.current) {
      refSkipSync.current = false
      return
    }
    setValue(formattedValue)
  }, [formattedValue])

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      refSkipSync.current = true
      const nextValue = e.target.value
      setValue(nextValue)

      if (
        nativeToken &&
        tokenRates?.[currency]?.price &&
        nextValue &&
        typeof swapPrice === "bigint"
      ) {
        try {
          const fiat = parseFloat(nextValue)
          let tokens: string = (fiat / tokenRates[currency].price).toFixed(
            Math.ceil(nativeToken.decimals / 3),
          )

          if (isSubnetUnstake) {
            tokens = String(
              (
                Number(tokens) * Number(planckToTokens(swapPrice.toString(), nativeToken.decimals))
              ).toFixed(Math.ceil(nativeToken.decimals / 3)),
            )
          }
          const plancks = tokensToPlanck(tokens, nativeToken.decimals)
          return setPlancks(BigInt(plancks))
        } catch (err) {
          // invalid input, ignore
        }
      }

      return setPlancks(null)
    },

    [nativeToken, tokenRates, currency, swapPrice, setPlancks, isSubnetUnstake],
  )

  const refFiatInput = useRef<HTMLInputElement>(null)

  // auto focus if empty
  const refInitialized = useRef(false)
  useEffect(() => {
    if (refInitialized.current) return
    refInitialized.current = true
    if (!amountTao) refFiatInput.current?.focus()
  }, [amountTao, refFiatInput])

  // resize input to keep content centered
  useInputAutoWidth(refFiatInput)

  if (!tokenRates) return null

  return (
    <div
      // display flex in reverse order to leverage peer css
      className="end flex w-full max-w-[400px] flex-row-reverse flex-nowrap items-center justify-center"
    >
      <input
        key="fiatInput"
        ref={refFiatInput}
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={"0.00"}
        className="text-body peer inline-block min-w-0 bg-transparent text-lg"
        onChange={handleChange}
      />
      {/* {isEstimatingMaxAmount && <div className="bg-grey-800 h-16 w-48 rounded"></div>} */}
      <div className="block shrink-0">{currencyConfig[currency]?.symbol}</div>
    </div>
  )
}

export const AmountEdit = () => {
  const { t } = useTranslation()
  const {
    nativeToken,
    tokenRates,
    displayMode,
    inputErrorMessage,
    maxPlancks,
    setPlancks,
    stakeType,
    isSubnetUnstake,
  } = useBittensorStakeWizard()

  const isSubnetOperation = isSubnetUnstake || stakeType === "subnet"

  const lastEditedInput = useRef<"primary" | "alpha">("primary")
  const onPrimaryEdit = useCallback(() => {
    lastEditedInput.current = "primary"
  }, [])

  const onSetMaxClick = useCallback(() => {
    if (!maxPlancks) return
    setPlancks(maxPlancks)
  }, [maxPlancks, setPlancks])

  return (
    <div className="flex w-full grow flex-col justify-center gap-4">
      {!!nativeToken && (
        <>
          <div className="h-16">{/* mirrors the height of error message reserved space */}</div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex w-full flex-col text-lg">
              {displayMode === "token" ? <TokenInput onEdit={onPrimaryEdit} /> : <FiatInput />}
            </div>
            {displayMode === "token" && isSubnetOperation && (
              <div className="border-grey-800 w-full border-t pt-2">
                <AlphaInput lastEditedInput={lastEditedInput} />
              </div>
            )}
          </div>
          <div className={classNames("flex max-w-full items-center justify-center gap-4")}>
            {tokenRates && <FiatDisplay />}
            <PillButton
              onClick={onSetMaxClick}
              disabled={!maxPlancks}
              size="xs"
              className={classNames("h-[2.2rem] rounded-sm !px-4 !py-0")}
            >
              {t("Max")}
            </PillButton>
          </div>
          <div className="h-16">
            <div className="text-brand-orange line-clamp-2 text-center text-xs">
              {inputErrorMessage}
            </div>
          </div>
        </>
      )}
    </div>
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
    />
  )
}

type BittensorStakeFormBaseProps = {
  StakeTypeDetails: React.ComponentType
}

export const BittensorStakeFormBase = ({ StakeTypeDetails }: BittensorStakeFormBaseProps) => {
  const { t } = useTranslation()
  const {
    account,
    accountPicker,
    nativeToken,
    dtaoToken,
    payload,
    hotkey,
    stakeType,
    stakeDirection,
    netuid,
    amountOut,
    setStep,
    setAddress,
  } = useBittensorStakeWizard()
  const { close } = useBittensorStakeModal()

  const isSubnetUnstake = useMemo(
    () => stakeDirection === "unstake" && netuid !== ROOT_NETUID,
    [netuid, stakeDirection],
  )

  const handleSelectAccount = useCallback(
    (address: string) => {
      setAddress(address)
      accountPicker.close()
    },
    [accountPicker, setAddress],
  )

  return (
    <BittensorModalLayout
      header={
        <BittensorStakingModalHeader
          title={stakeDirection === "stake" ? t("Staking") : t("Unstake")}
          withClose
          onCloseModal={close}
        />
      }
      contentClassName="text-body-secondary flex size-full flex-col gap-4 p-12 pt-0"
    >
      <BittensorAssetAccountSummary
        token={nativeToken}
        accountAddress={account?.address}
        onAccountClick={() => {
          stakeDirection === "stake" ? accountPicker.open() : setStep("select-position")
        }}
        assetLabel={t("Asset")}
        accountLabel={t("Account")}
      />
      <AmountEdit />
      <div className="bg-grey-900 leading-paragraph flex flex-col gap-4 rounded p-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="whitespace-nowrap">
            {stakeDirection === "stake" ? t("Available Balance") : t("Available to unstake")}
          </div>
          {stakeDirection === "stake" ? (
            <div>
              {!!nativeToken && !!account && (
                <AvailableBalance token={nativeToken} account={account} />
              )}
            </div>
          ) : (
            <BittensorAvailableToUnstake />
          )}
        </div>
      </div>

      <div className="bg-grey-900 leading-paragraph flex flex-col gap-2 rounded p-4 text-xs">
        <StakeTypeDetails />
        <div
          className={classNames(
            "flex gap-8",
            stakeType === "subnet" ? "flex-col-reverse" : "flex-col",
          )}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="whitespace-nowrap">{t("Select Validator")}</div>
            <div className="text-body truncate">
              <BittensorDelegatorNameButton
                hotkey={hotkey}
                isDisabled={stakeType === "subnet" && !netuid}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-8 pb-2 text-xs">
          <div className="whitespace-nowrap">{t("Estimated Amount")} </div>
          <div className="text-body-secondary flex items-center gap-2 truncate">
            {!!amountOut && (
              <TokensAndFiat
                planck={amountOut}
                tokenId={isSubnetUnstake ? nativeToken?.id : dtaoToken?.id}
                noCountUp
                tokensClassName="text-body"
              />
            )}
          </div>
        </div>
        {!isSubnetUnstake && (
          <>
            <div className="flex items-center justify-between gap-8">
              <div className="whitespace-nowrap">{t("Estimated Fee")}</div>
              <div className="overflow-hidden">
                <FeeEstimate />
              </div>
            </div>
          </>
        )}
      </div>

      <Button
        primary
        fullWidth
        className="mt-6"
        disabled={!payload}
        onClick={() => setStep("review")}
      >
        {t("Review")}
      </Button>

      <StakeAccountPicker
        containerId={STAKING_MODAL_CONTENT_CONTAINER_ID}
        isOpen={accountPicker.isOpen}
        account={account}
        token={nativeToken}
        onBackClick={accountPicker.close}
        onCloseClick={close}
        onAddressSelected={handleSelectAccount}
      />
      <BittensorSelectStakeDrawer containerId={STAKING_MODAL_CONTENT_CONTAINER_ID} />
    </BittensorModalLayout>
  )
}
