import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { FC } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button, Drawer } from "taostats-ui"

export const CopyAddressExchangeWarning: FC<{
  isOpen: boolean
  onDismiss: () => void
  onContinue: () => void
}> = ({ isOpen, onDismiss, onContinue }) => {
  const { t } = useTranslation()

  return (
    <Drawer containerId="copy-address-modal" isOpen={isOpen} anchor="bottom" onDismiss={onDismiss}>
      <div className="bg-secondary flex w-full flex-col items-center rounded-t-xl p-6">
        <AlertCircle className="text-fg-brand text-3xl" />
        <div className="text-md mt-6 font-bold">{t("Receiving from an exchange?")}</div>
        <p className="text-fg-secondary mt-4 text-center">
          {t("Generic substrate addresses are often incompatible with exchanges.")}
          <br />
          <Trans
            t={t}
            defaults="Taostats recommends you use a <Highlight>network specific address</Highlight>. Always check with your exchange before sending funds."
            components={{
              Highlight: <span className="text-fg-primary" />,
            }}
          />
        </p>
        <Button className="mt-6" primary fullWidth onClick={onContinue}>
          {t("Continue")}
        </Button>
      </div>
    </Drawer>
  )
}
