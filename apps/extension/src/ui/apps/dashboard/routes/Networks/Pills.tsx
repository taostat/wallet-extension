import { classNames } from "@taostats-wallet/util"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

const Pill = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <div
    className={classNames(
      "bg-fg-brand/10 text-fg-brand inline-block rounded p-4 text-xs font-light",
      className,
    )}
  >
    {children}
  </div>
)

export const TestnetPill = () => {
  const { t } = useTranslation()
  return <Pill className="bg-orange-secondary/10 text-fg-orange">{t("Testnet")}</Pill>
}

export const CustomPill = () => {
  const { t } = useTranslation()
  return <Pill>{t("Custom")}</Pill>
}
