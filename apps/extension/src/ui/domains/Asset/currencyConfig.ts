import { SUPPORTED_CURRENCIES, TokenRateCurrency } from "@taostats-wallet/token-rates"

import taoIcon from "./currencyIcons/tao.svg?url"
import usdIcon from "./currencyIcons/usd.svg?url"

const currencyIcons: Record<TokenRateCurrency, string | undefined> = {
  tao: taoIcon,
  usd: usdIcon,
}

export const currencyOrder = Object.keys(SUPPORTED_CURRENCIES) as Array<
  keyof typeof SUPPORTED_CURRENCIES
>
export const sortCurrencies = (
  a: keyof typeof SUPPORTED_CURRENCIES,
  b: keyof typeof SUPPORTED_CURRENCIES,
) => currencyOrder.indexOf(a) - currencyOrder.indexOf(b)
export const currencyConfig = Object.fromEntries(
  currencyOrder.map((id) => [
    id,
    {
      symbol: SUPPORTED_CURRENCIES[id as TokenRateCurrency].symbol,
      name: SUPPORTED_CURRENCIES[id as TokenRateCurrency].name,
      icon: currencyIcons[id as TokenRateCurrency],
    },
  ]),
)
