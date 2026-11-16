import { classNames } from "@taostats-wallet/util"
import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Save01 } from "@untitledui/icons/Save01"
import { log } from "extension-shared"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Button,
  Drawer,
  FormFieldInputText,
  PillButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "taostats-ui"

import { STAKING_MODAL_CONTENT_CONTAINER_ID } from "../../../shared/ModalContent"
import { useBittensorStakeWizard } from "../../hooks/useBittensorStakeWizard"
import {
  SUBNET_SLIPPAGE_SCHEMA,
  useBittensorSubnetSlippage,
} from "../../hooks/useBittensorSubnetSlippage"
import {
  DEFAULT_USER_MAX_SLIPPAGE,
  HIGH_PRICE_IMPACT,
  VERY_HIGH_PRICE_IMPACT,
} from "../../utils/constants"

export const BittensorSlippageDrawer = () => {
  const { slippageDrawer, netuid } = useBittensorStakeWizard()
  const [slippage, setSlippage] = useBittensorSubnetSlippage(netuid)
  const [slippageEdit, setSlippageEdit] = useState<string>(String(slippage))
  const { t } = useTranslation()

  const { isOpen, close } = slippageDrawer

  const handleSubmit = useCallback(() => {
    try {
      setSlippage(Number(slippageEdit))
      close()
    } catch (err) {
      log.error("Invalid slippage input:", err)
    }
  }, [close, setSlippage, slippageEdit])

  const handleReset = useCallback(() => {
    setSlippage(DEFAULT_USER_MAX_SLIPPAGE)
    setSlippageEdit(String(DEFAULT_USER_MAX_SLIPPAGE))
  }, [setSlippage])

  const isValid = useMemo(() => {
    if (slippageEdit === "") return false
    const parsed = SUBNET_SLIPPAGE_SCHEMA.safeParse(Number(slippageEdit))
    return parsed.success
  }, [slippageEdit])

  return (
    <Drawer
      anchor="bottom"
      isOpen={isOpen}
      onDismiss={close}
      containerId={STAKING_MODAL_CONTENT_CONTAINER_ID}
    >
      <div className="bg-secondary flex w-full flex-col items-center gap-2 rounded-t-xl p-6">
        <div className="text-fg-primary pb-4 font-bold">{t("Slippage Tolerance")}</div>
        <p className="text-fg-secondary text-sm">
          {t(
            "How much the price may move after you sign, beyond the quote you were shown. If it moves further, the transaction is cancelled.",
          )}
        </p>
        <p className="text-fg-secondary text-sm">
          {t("This setting will apply to all your subnet staking transactions.")}
        </p>
        <div className="text-fg-secondary mt-2 flex items-center gap-1 self-start text-sm">
          <div className="">{t("Max Slippage")}</div>
          <Tooltip>
            <TooltipTrigger>
              <InfoCircle />
            </TooltipTrigger>
            <TooltipContent>
              <span className="block max-w-[260px]">
                {t(
                  "Protects you if the price moves before your transaction lands, for example if someone trades ahead of you. Your own trade's price impact is shown separately before you sign.",
                )}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
        <FormFieldInputText
          small
          containerProps={{ className: "px-3 text-right bg-secondary" }}
          after={
            <div className="flex items-center gap-2">
              <div>%</div>
              <PillButton className="h-[30px] px-2" onClick={handleReset}>
                {t("Reset")}
              </PillButton>
            </div>
          }
          placeholder={String(DEFAULT_USER_MAX_SLIPPAGE)}
          onChange={(e) => setSlippageEdit(e.target.value)}
          value={slippageEdit}
        />
        <div
          className={classNames(
            "mb-2 flex w-full items-center justify-end gap-1 text-xs text-orange-500",
            Number(slippageEdit) < HIGH_PRICE_IMPACT && "invisible",
            Number(slippageEdit) >= VERY_HIGH_PRICE_IMPACT && "text-red-500",
          )}
        >
          <AlertTriangle />
          <div>
            {Number(slippageEdit) >= VERY_HIGH_PRICE_IMPACT
              ? t("Very high slippage")
              : t("High slippage")}
          </div>
        </div>
        <div className="flex w-full items-center">
          <Button
            className="w-full"
            icon={Save01}
            primary
            disabled={!isValid}
            onClick={handleSubmit}
          >
            {t("Save")}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
