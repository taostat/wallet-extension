import { classNames } from "@taostats-wallet/util"
import { FC, HTMLAttributes } from "react"

export type SurfaceCardProps = HTMLAttributes<HTMLDivElement>

/**
 * Shared bordered surface used by portfolio header, accounts sidebar, etc.
 * `border-primary/6` + `bg-secondary-solid` + rounded-lg.
 */
export const SurfaceCard: FC<SurfaceCardProps> = ({ className, ...props }) => (
  <div
    className={classNames(
      "border-primary/6 bg-secondary-solid relative rounded-lg border",
      className,
    )}
    {...props}
  />
)
