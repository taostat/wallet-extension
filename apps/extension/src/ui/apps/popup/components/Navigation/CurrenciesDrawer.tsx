import { TokenRateCurrency } from "@taostats-wallet/token-rates"
import { classNames } from "@taostats-wallet/util"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { Star01 } from "@untitledui/icons/Star01"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Drawer, IconButton } from "taostats-ui"

import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { useGlobalOpenClose } from "@taostats/hooks/useGlobalOpenClose"
import { currencyConfig, currencyOrder, sortCurrencies } from "@ui/domains/Asset/currencyConfig"
import { useFavoriteCurrencies } from "@ui/hooks/useFavoriteCurrencies"
import { useSetting } from "@ui/state"

export const useCurrenciesDrawerOpenClose = () => useGlobalOpenClose("currencies-drawer")

const CurrencyButton: FC<{
  currency: TokenRateCurrency
  selected: boolean
  onClick: () => void
}> = ({ currency, selected, onClick }) => {
  return (
    <button
      type="button"
      className={classNames(
        "text-fg-secondary flex h-14 w-full items-center gap-2 rounded-sm px-3",
        "border-primary border",
        selected && "bg-app-bg",
        "hover:border-primary hover:bg-secondary stroke-fg-brand",
      )}
      onClick={onClick}
    >
      <img className="w-8 max-w-full" alt={currency} src={currencyConfig[currency]?.icon} />
      <div className="flex grow flex-col items-start gap-0.5">
        <div className="text-fg-primary text-base uppercase">{currency}</div>
        <div className="text-xs">
          {currencyConfig[currency]?.symbol ?? ""} {currencyConfig[currency]?.name ?? currency}
        </div>
      </div>
      {selected ? (
        <Star01 className="stroke-fg-brand fill-fg-brand size-4" />
      ) : (
        <Star01 className="size-4" />
      )}
    </button>
  )
}

const CurrenciesList = () => {
  const [favorites, setFavorites] = useFavoriteCurrencies()
  const [, setSelected] = useSetting("selectedCurrency")

  const handleCurrencyClick = useCallback(
    (currency: TokenRateCurrency) => () => {
      setFavorites((selectable) => {
        const newSelectable = selectable.includes(currency)
          ? selectable.filter((x) => x !== currency)
          : selectable.concat(currency).sort(sortCurrencies)

        if (!newSelectable.length) return selectable

        // NOTE: This makes sure that the `selectedCurrency` is always in the list of `selectableCurrencies`
        setSelected((selected) =>
          newSelectable.length === 0 || newSelectable.includes(selected)
            ? selected
            : newSelectable[0],
        )

        return newSelectable
      })
    },

    [setFavorites, setSelected],
  )

  return (
    <div className="flex flex-col gap-2">
      {currencyOrder.map((currency) => (
        <CurrencyButton
          key={currency}
          currency={currency}
          selected={favorites.includes(currency)}
          onClick={handleCurrencyClick(currency)}
        />
      ))}
    </div>
  )
}

const CurrenciesDrawerContent = () => {
  const { t } = useTranslation()
  const { close } = useCurrenciesDrawerOpenClose()

  return (
    <div className="text-fg-secondary flex h-[600px] w-[400px] flex-col gap-5 bg-black pt-5">
      <div className="flex items-center gap-1.5 px-4 text-base font-bold text-white">
        <IconButton onClick={close}>
          <ChevronLeft />
        </IconButton>
        <div>{t("Currency")}</div>
      </div>
      <div className="px-4">
        <p className="text-xs">
          {t(
            "Choose your favorite currencies. You can toggle between your favorite currencies directly from your portfolio.",
          )}
        </p>
      </div>
      <ScrollContainer className="grow" innerClassName="px-4 pb-4">
        <CurrenciesList />
      </ScrollContainer>
    </div>
  )
}

export const CurrenciesDrawer = () => {
  const { isOpen } = useCurrenciesDrawerOpenClose()

  return (
    <Drawer anchor="right" isOpen={isOpen} containerId="main">
      <CurrenciesDrawerContent />
    </Drawer>
  )
}
