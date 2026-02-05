import { BraveIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { Card } from "@taostats/components/Card"

type Props = {
  className?: string
  onLearnMoreClick?: () => void
}

export const BraveWarningCard = ({ className, onLearnMoreClick }: Props) => {
  const { t } = useTranslation()
  return (
    <Card
      className={classNames("mt-10", className)}
      title={
        <div className="flex w-full items-center gap-5">
          <BraveIcon className="inline" />
          <span>{t("Attention Brave users")}</span>
        </div>
      }
      description={
        <span className="text-body-secondary text-sm">
          {t("By default, Brave prevents Taostats Wallet from loading all your balances.")}
        </span>
      }
      cta={
        <Button className="w-full" onClick={onLearnMoreClick}>
          {t("Learn how to fix")}
        </Button>
      }
    />
  )
}
