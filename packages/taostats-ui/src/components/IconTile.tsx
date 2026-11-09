import { classNames } from "@taostats-wallet/util"
import { FC, SVGProps } from "react"

export type IconTileSize = "md" | "sm"

export type IconTileProps = {
  icon: FC<SVGProps<SVGSVGElement>>
  size?: IconTileSize
  className?: string
  iconClassName?: string
}

const SIZE_CLASS: Record<
  IconTileSize,
  { tile: string; icon: string }
> = {
  md: { tile: "size-10 rounded-xl", icon: "size-5" },
  sm: { tile: "size-8 rounded-lg", icon: "size-4" },
}

/**
 * Rounded icon well with subtle top-light gradient — used on settings rows and similar lists.
 */
export const IconTile: FC<IconTileProps> = ({
  icon: Icon,
  size = "md",
  className,
  iconClassName,
}) => {
  const { tile, icon } = SIZE_CLASS[size]

  return (
    <span
      className={classNames(
        "icon-tile text-fg-brand relative flex shrink-0 items-center justify-center",
        tile,
        className,
      )}
      aria-hidden
    >
      <Icon className={classNames("relative z-[1]", icon, iconClassName)} />
    </span>
  )
}
