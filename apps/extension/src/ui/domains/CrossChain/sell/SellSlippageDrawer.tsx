import {
  bpsToPercent,
  MAX_SLIPPAGE_BPS,
  MIN_SLIPPAGE_BPS,
  parseSlippagePercent,
  SLIPPAGE_PRESETS_BPS,
  slippageBpsToPercentText,
} from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { FC, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer, FormFieldInputText } from "taostats-ui"

import { CROSS_CHAIN_SELL_CONTAINER_ID } from "../constants"
import { useCrossChainSell } from "./useCrossChainSell"

/**
 * The sell's max slippage, as the website's cross-chain settings: three presets, or a value typed
 * from 0.01% to 10%. For this sell only: nothing is stored.
 */
export const SellSlippageDrawer: FC<{ isOpen: boolean; onDismiss: () => void }> = ({
  isOpen,
  onDismiss,
}) => (
  <Drawer
    anchor="bottom"
    isOpen={isOpen}
    onDismiss={onDismiss}
    containerId={CROSS_CHAIN_SELL_CONTAINER_ID}
  >
    {isOpen ? <SlippageSetting onDone={onDismiss} /> : null}
  </Drawer>
)

const SlippageSetting: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useTranslation()
  const { slippageBps, setSlippageBps } = useCrossChainSell()
  const isPreset = (SLIPPAGE_PRESETS_BPS as readonly number[]).includes(slippageBps)
  // What the custom field shows: the current value unless it is a preset.
  const [customText, setCustomText] = useState(
    isPreset ? "" : slippageBpsToPercentText(slippageBps),
  )
  const parsed = parseSlippagePercent(customText)
  const problem =
    customText !== "" && !parsed.ok && parsed.reason !== "empty"
      ? parsed.reason === "tooHigh"
        ? t("Enter at most {{max}}.", { max: `${bpsToPercent(MAX_SLIPPAGE_BPS)}%` })
        : t("Enter at least {{min}}.", { min: `${bpsToPercent(MIN_SLIPPAGE_BPS)}%` })
      : null

  return (
    <div className="bg-secondary flex w-full flex-col gap-4 rounded-t-xl p-6">
      <div className="text-fg-primary text-center font-bold">{t("Max Slippage")}</div>
      <div className="flex items-center gap-2">
        {SLIPPAGE_PRESETS_BPS.map((bps) => {
          const isSelected = customText === "" && slippageBps === bps
          return (
            <button
              key={bps}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setCustomText("")
                setSlippageBps(bps)
              }}
              className={cn(
                "h-9 min-w-14 rounded-sm border px-3 text-sm",
                isSelected
                  ? "border-brand bg-brand-secondary text-fg-brand"
                  : "border-primary text-fg-secondary hover:text-fg-primary",
              )}
            >
              {bpsToPercent(bps)}%
            </button>
          )
        })}
        <FormFieldInputText
          small
          inputMode="decimal"
          aria-label={t("Custom max slippage, in percent")}
          placeholder={t("Custom")}
          value={customText}
          onChange={(e) => {
            const value = e.target.value.replace(",", ".")
            if (!/^\d*\.?\d*$/.test(value)) return
            setCustomText(value)
            const next = parseSlippagePercent(value)
            if (next.ok) setSlippageBps(next.bps)
          }}
          after={<span className="text-fg-secondary text-sm">%</span>}
          containerProps={{ className: cn("grow", problem && "border-alert-error") }}
        />
      </div>
      {problem ? (
        <div role="alert" className="text-fg-error text-xs">
          {problem}
        </div>
      ) : null}
      <p className="text-fg-secondary text-xs">
        {t(
          "Your swap won't go through if the price moves against you by more than this before it's sent.",
        )}
      </p>
      <Button primary fullWidth onClick={onDone}>
        {t("Done")}
      </Button>
    </div>
  )
}
