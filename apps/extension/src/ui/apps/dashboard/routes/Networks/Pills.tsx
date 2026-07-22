import { useTranslation } from "react-i18next"
import { Pill } from "taostats-ui"

export const TestnetPill = () => {
  const { t } = useTranslation()
  return (
    <Pill variant="orange" shape="square" className="font-light">
      {t("Testnet")}
    </Pill>
  )
}

export const CustomPill = () => {
  const { t } = useTranslation()
  return (
    <Pill variant="brand" shape="square" className="font-light">
      {t("Custom")}
    </Pill>
  )
}
