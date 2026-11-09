import { classNames } from "@taostats-wallet/util"
import { FC, forwardRef, SVGProps } from "react"

import { getPillClassName, PillSize } from "./Pill"

export type PillButtonSize = "tiny" | "xs" | "sm" | "base"

export type PillButtonProps = Omit<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
    icon?: FC<SVGProps<SVGSVGElement>>
    size?: PillButtonSize
  },
  "ref"
>

const buttonSizeMap: Record<PillButtonSize, PillSize> = {
  tiny: "xs",
  xs: "xs",
  sm: "sm",
  base: "md",
}

const getFontSize = (size: PillButtonSize) => {
  // because of tailwind, all used classes must appear as plain text
  switch (size) {
    case "base":
      return "text-base"
    case "tiny":
      return "text-tiny"
    case "sm":
      return "text-sm"
    case "xs":
    default:
      return "text-xs"
  }
}

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ icon: Icon, size = "xs", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={classNames(
          getFontSize(size),
          getPillClassName({ variant: "secondary", size: buttonSizeMap[size] }),
          "transition-colors duration-100 ease-out",
          "hover:bg-secondary-btn-bg-hover disabled:opacity-50",
          "allow-focus outline-offset-0 focus-visible:outline-current",
          className,
        )}
        {...props}
      >
        {Icon && (
          <div>
            <Icon />
          </div>
        )}
        <div className="max-w-full">{children}</div>
      </button>
    )
  },
)
PillButton.displayName = "PillButton"
