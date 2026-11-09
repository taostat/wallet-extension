import { classNames } from "@taostats-wallet/util"
import { FC, HTMLAttributes } from "react"

export type SurfaceCardProps = HTMLAttributes<HTMLDivElement>

/**
 * Shared bordered surface used by portfolio header, accounts sidebar, etc.
 */
export const SurfaceCard: FC<SurfaceCardProps> = ({ className, ...props }) => (
  <div
    className={classNames(
      "bg-secondary-solid border-primary relative rounded-lg border",
      className,
    )}
    {...props}
  />
)
