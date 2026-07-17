import { classNames } from "@taostats-wallet/util"
import {
  DetailedHTMLProps,
  FC,
  MouseEventHandler,
  ReactNode,
  SVGProps,
  useCallback,
  useMemo,
} from "react"
import { useNavigate } from "react-router-dom"

import { IconTile } from "./IconTile"

export type CtaButtonSize = "large" | "small"

type CtaButton = DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  iconLeft?: FC<SVGProps<SVGSVGElement>>
  iconRight?: FC<SVGProps<SVGSVGElement>>
  title: ReactNode
  subtitle: ReactNode
  to?: string
  size?: CtaButtonSize
}

export const getContainerClassName = (size: CtaButtonSize) => {
  switch (size) {
    case "large":
      return {
        containerClassName: "min-h-[72px] py-4",
        contentClassName: "gap-1",
        titleClassName: "text-sm",
        subtitleClassName: "text-xs",
        iconTileSize: "md" as const,
      }
    case "small":
      return {
        containerClassName: "min-h-14 py-3",
        contentClassName: "gap-0.5",
        titleClassName: "text-sm",
        subtitleClassName: "text-xs",
        iconTileSize: "sm" as const,
      }
  }
}

export const CtaButton: FC<CtaButton> = ({
  iconLeft: IconLeft,
  iconRight: IconRight,
  title,
  subtitle,
  className,
  to,
  size = "large",
  onClick,
  ...props
}) => {
  const navigate = useNavigate()
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (to && to.startsWith("http")) window.open(to, "_blank")
      else if (to) navigate(to)
      else if (onClick) onClick(e)
    },
    [navigate, onClick, to],
  )

  const { containerClassName, contentClassName, titleClassName, subtitleClassName, iconTileSize } =
    useMemo(() => getContainerClassName(size), [size])

  return (
    <button
      type="button"
      {...props}
      className={classNames(
        "border-primary bg-secondary-solid text-fg-disabled enabled:hover:bg-tertiary/50 enabled:hover:text-fg-primary gap-md px-lg flex w-full cursor-pointer items-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-50",
        containerClassName,
        className,
      )}
      onClick={handleClick}
    >
      {IconLeft && <IconTile icon={IconLeft} size={iconTileSize} />}
      <div className={classNames("flex grow flex-col items-start", contentClassName)}>
        <div className={classNames("text-fg-primary font-medium", titleClassName)}>{title}</div>
        <div className={classNames("text-fg-secondary text-left", subtitleClassName)}>
          {subtitle}
        </div>
      </div>
      {IconRight && <IconRight className="text-fg-tertiary shrink-0 text-lg" />}
    </button>
  )
}
