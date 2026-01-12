import { classNames } from "@taostats-wallet/util"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

export const MsgSignButtonFallback: FC<{ label?: string; className?: string }> = ({
  label,
  className,
}) => {
  const { t } = useTranslation()

  return (
    <Button className={classNames("w-full", className)} primary disabled>
      {label ?? t("Sign")}
    </Button>
  )
}
