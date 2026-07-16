import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { Lock01 } from "@untitledui/icons/Lock01"
import { ChangeEventHandler, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer, FormFieldInputText } from "taostats-ui"

import { useOpenClose } from "@taostats/hooks/useOpenClose"
import { api } from "@ui/api"
import { useAnalytics } from "@ui/hooks/useAnalytics"

import { PopupContent, PopupFooter, PopupLayout } from "../Layout/PopupLayout"

const ConfirmDrawer = ({
  isOpen,
  closeResetWallet,
}: {
  isOpen: boolean
  closeResetWallet: () => void
}) => {
  const { t } = useTranslation()
  const [confirmText, setConfirmText] = useState<string>("")
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    return () => {
      setConfirmText("")
    }
  }, [])

  const handleTextChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setConfirmText(e.target.value)
  }, [])

  const handleReset = useCallback(async () => {
    setResetting(true)
    // don't wait for the response here, or the normal onboarding tab will open
    api.resetWallet()
    window.close()
  }, [])

  const isMatch = useMemo(() => confirmText?.toLowerCase() === "reset wallet", [confirmText])

  return (
    <Drawer isOpen={isOpen} anchor="bottom">
      <div className="bg-secondary items-center rounded-t-xl p-6 pt-6">
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <div className="text-3xl">
            <AlertTriangle className="text-brand-orange text-[48px]" />
          </div>
          <div className="max-w-[300px] font-bold leading-[22px] text-white">
            {t("Are you sure you want to reset your Taostats wallet?")}
          </div>
        </div>
        <div className="text-fg-secondary my-4 text-sm">
          <p className="px-2 text-center">
            {t(
              "Your current wallet, accounts and assets will be erased from Taostats. You will need to re-import your original account using your recovery (seed) phrase or private key.",
            )}
          </p>
          <p className="mt-6 text-center">
            {t("Type '{{resetWalletText}}' below to continue", { resetWalletText: "Reset wallet" })}
          </p>
        </div>
        <FormFieldInputText onChange={handleTextChange} placeholder={"Reset wallet"} />
        <div className="mt-6 flex flex-col gap-4">
          <Button
            type="submit"
            className="enabled:!bg-brand-orange hover:enabled:!bg-brand-orange/80 h-12 enabled:text-white"
            fullWidth
            onClick={handleReset}
            primary={isMatch}
            processing={resetting}
            disabled={!isMatch}
          >
            {t("Reset Wallet")}
          </Button>
          <Button className="h-12" fullWidth onClick={closeResetWallet}>
            {t("Cancel")}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

export const ResetWallet = ({ closeResetWallet }: { closeResetWallet: () => void }) => {
  const { t } = useTranslation()
  const { popupOpenEvent } = useAnalytics()
  const { open, isOpen } = useOpenClose()

  useEffect(() => {
    popupOpenEvent("reset wallet")
  }, [popupOpenEvent])

  return (
    <PopupLayout>
      <div className="text-fg-secondary flex h-16 items-center justify-center px-6 pr-[16px]">
        <ChevronLeft
          className="hover:text-fg-primary flex-shrink cursor-pointer text-lg"
          onClick={closeResetWallet}
        />
        <span className="flex-grow pr-[24px] text-center">{t("Reset Wallet")}</span>
      </div>
      <PopupContent>
        <div className="flex h-full flex-col items-center justify-end gap-8 pb-4">
          <Lock01 className="text-fg-brand text-[48px]" />
          <div className="text-lg font-bold">{t("Forgot your password?")}</div>
          <div className="text-fg-secondary space-y-6">
            <p className="text-center">
              {t(
                "This action will reset your current wallet, accounts and assets. There is no way for us to recover your password as it is only stored on your device. You can also try other passwords.",
              )}
            </p>
            <p className="text-center">
              {t(
                "If you still want to reset your wallet, you will need to import your original recovery phrase. Proceed only if you have your recovery phrase.",
              )}
            </p>
          </div>
        </div>
      </PopupContent>
      <PopupFooter className="flex flex-col gap-4">
        <Button fullWidth primary onClick={open} className="h-12">
          {t("Reset Wallet")}
        </Button>
        <Button fullWidth onClick={closeResetWallet} className="h-12">
          {t("Cancel")}
        </Button>
      </PopupFooter>
      <ConfirmDrawer isOpen={isOpen} closeResetWallet={closeResetWallet} />
    </PopupLayout>
  )
}
