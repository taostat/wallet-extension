import { cn } from "@taostats-wallet/util"
import { Copy01 } from "@untitledui/icons/Copy01"
import { FC, MouseEvent, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { copyAddress } from "@ui/util/copyAddress"

type CopyAddressIconButtonProps = {
  address: string | undefined
  className?: string
  iconClassName?: string
  disabled?: boolean
  tooltip?: boolean
}

export const CopyAddressIconButton: FC<CopyAddressIconButtonProps> = ({
  address,
  className,
  iconClassName = "size-4",
  disabled,
  tooltip = true,
}) => {
  const { t } = useTranslation()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      if (!address) return
      void copyAddress(address)
    },
    [address],
  )

  const button = (
    <button
      type="button"
      data-no-dnd="true"
      onClick={handleClick}
      disabled={disabled || !address}
      className={cn(
        "text-fg-tertiary hover:text-fg-primary shrink-0 disabled:opacity-50",
        className,
      )}
      aria-label={t("Copy address")}
    >
      <Copy01 className={iconClassName} />
    </button>
  )

  if (!tooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{t("Copy address")}</TooltipContent>
    </Tooltip>
  )
}
