import { classNames } from "@taostats-wallet/util"
import { FC, ReactNode, SVGProps, useMemo } from "react"
import { CtaButtonSize, getContainerClassName, IconTile } from "taostats-ui"

export const Setting: FC<{
  iconLeft?: FC<SVGProps<SVGSVGElement>>
  iconRight?: FC<SVGProps<SVGSVGElement>>
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  className?: string
  size?: CtaButtonSize
}> = ({
  iconLeft: IconLeft,
  iconRight: IconRight,
  title,
  subtitle,
  children,
  className,
  size = "large",
}) => {
  const { containerClassName, contentClassName, titleClassName, subtitleClassName, iconTileSize } =
    useMemo(() => getContainerClassName(size), [size])

  return (
    <div
      className={classNames(
        "border-primary bg-secondary-solid text-fg-secondary gap-md px-lg flex w-full items-center rounded-lg border",
        containerClassName,
        className,
      )}
    >
      {IconLeft && <IconTile icon={IconLeft} size={iconTileSize} />}
      <div className={classNames("flex grow flex-col items-start", contentClassName)}>
        <div className={classNames("text-fg-primary font-medium", titleClassName)}>{title}</div>
        <div className={classNames("text-fg-secondary text-left", subtitleClassName)}>
          {subtitle}
        </div>
      </div>
      {children}
      {IconRight && <IconRight className="text-fg-tertiary shrink-0 text-lg" />}
    </div>
  )
}
