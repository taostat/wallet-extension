import { classNames } from "@taostats-wallet/util"
import { Loading01 } from "@untitledui/icons/Loading01"
import { FC, SVGProps, useMemo } from "react"

type ButtonColor = "default" | "primary" | "red" | "orange"

export type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  processing?: boolean
  primary?: boolean
  fullWidth?: boolean
  small?: boolean
  icon?: FC<SVGProps<SVGSVGElement>>
  iconLeft?: FC<SVGProps<SVGSVGElement>>
  color?: ButtonColor // this overrides the `primary` flag if set
}

export const Button: FC<ButtonProps> = ({
  icon: Icon,
  iconLeft: IconLeft,
  disabled,
  primary,
  fullWidth,
  small,
  processing,
  className,
  color,
  ...props
}) => {
  const colors = useMemo(() => {
    // color prop takes precedence over primary flag
    const effectiveColor: ButtonColor = color ?? (primary ? "primary" : "default")

    if (disabled) return "bg-disabled text-fg-disabled border border-primary"

    switch (effectiveColor) {
      case "default":
        return "border border-white text-fg-primary hover:bg-fg-primary hover:text-fg-primary-alt focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

      case "primary":
        return "bg-fg-primary text-fg-primary-alt shadow-btn-primary hover:bg-fg-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

      case "orange":
        return "bg-fg-orange text-fg-primary-alt shadow-btn-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

      case "red":
        return "bg-fg-error text-fg-primary-alt shadow-btn-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    }
  }, [color, disabled, primary])

  return (
    <button
      type="button"
      disabled={disabled || processing}
      className={classNames(
        "relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-200 ease-linear disabled:pointer-events-none",
        small ? "px-lg py-md gap-xs rounded-sm text-sm" : "gap-xs rounded-md px-3.5 py-2.5 text-sm",
        fullWidth ? "w-full" : "",
        colors,
        className,
      )}
      {...props}
    >
      {
        <div
          className={classNames("gap-xs flex items-center", !disabled && processing && "invisible")}
        >
          {IconLeft && (
            <div className={small ? "text-sm" : "text-md"}>
              <IconLeft />
            </div>
          )}
          <div>{props.children}</div>
          {Icon && (
            <div className={small ? "text-sm" : "text-md"}>
              <Icon />
            </div>
          )}
        </div>
      }
      {!disabled && processing && (
        <div
          className={classNames(
            "absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center",
          )}
        >
          <Loading01 className="animate-spin-slow text-md" />
        </div>
      )}
    </button>
  )
}
