// guess group separator and decimal separator from this number
const testNumber = 1000.1
const parts = new Intl.NumberFormat(undefined).formatToParts(testNumber)

export const fiatDecimalSeparator = parts.find((p) => p.type === "decimal")?.value ?? "."

export const fiatGroupSeparator = parts.find((p) => p.type === "group")?.value ?? ","

export const formatFiat = (
  amount = 0,
  currency: Intl.NumberFormatOptions["currency"] | undefined,
  currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"],
  minimumDecimalPlaces?: number,
) => {
  const fractionDigits =
    minimumDecimalPlaces !== undefined
      ? // NOTE: If minimumFractionDigits is set to an integer greater than `20` then it throws the error:
        //       `RangeError: minimumFractionDigits value is out of range`
        minimumDecimalPlaces <= 20
        ? minimumDecimalPlaces
        : 20
      : undefined

  // TAO is not a real ISO currency; Intl renders "TAO". Use τ to match the currency toggle.
  if (currency?.toLowerCase() === "tao") {
    const numberOnly = new Intl.NumberFormat(undefined, {
      ...(fractionDigits !== undefined && {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    }).format(amount)

    if (currencyDisplay === "code") return `${numberOnly} τ`
    return `τ${numberOnly}`
  }

  const formatOptions: Intl.NumberFormatOptions = {
    ...(currency !== undefined && {
      style: "currency",
      currency,
      currencyDisplay: currencyDisplay ?? (currency === "usd" ? "narrowSymbol" : "symbol"),
    }),

    ...(fractionDigits !== undefined && {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }),
  }

  const formatted = new Intl.NumberFormat(undefined, formatOptions).format(amount)

  // Hack to get trailing ISO code instead of leading
  if (currency !== undefined && currencyDisplay === "code") {
    return formatted.replace(`${currency.toUpperCase()}`, "").trim() + " " + currency.toUpperCase()
  }

  return formatted
}
