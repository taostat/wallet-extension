import { classNames } from "@taostats-wallet/util"
import { Loading01 } from "@untitledui/icons/Loading01"
import { forwardRef, SVGProps, useMemo } from "react"

type ButtonColor = "default" | "primary" | "secondary" | "brand" | "red" | "orange"
type ButtonSize = "default" | "small" | "header"

export type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  processing?: boolean
  primary?: boolean
  fullWidth?: boolean
  small?: boolean
  size?: ButtonSize
  /** Square icon-sized button (e.g. currency toggle). */
  iconOnly?: boolean
  icon?: React.FC<SVGProps<SVGSVGElement>>
  iconLeft?: React.FC<SVGProps<SVGSVGElement>>
  color?: ButtonColor // this overrides the `primary` flag if set
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    icon: Icon,
    iconLeft: IconLeft,
    disabled,
    primary,
    fullWidth,
    small,
    size: sizeProp,
    iconOnly,
    processing,
    className,
    color,
    children,
    ...props
  },
  ref,
) {
  const size: ButtonSize = sizeProp ?? (small ? "small" : "default")

  const colors = useMemo(() => {
    // color prop takes precedence over primary flag
    const effectiveColor: ButtonColor = color ?? (primary ? "primary" : "default")

    if (disabled && effectiveColor !== "secondary")
      return "bg-disabled text-fg-disabled border border-primary"

    switch (effectiveColor) {
      case "default":
        return "border border-white text-fg-primary hover:bg-fg-primary hover:text-fg-primary-alt focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

      case "primary":
        return "bg-fg-primary text-fg-primary-alt shadow-btn-primary hover:bg-fg-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

      // Matches monorepo new-look `secondary`: white/5 bg + 6% border (border-primary already encodes 6%)
      case "secondary":
        return classNames(
          "bg-secondary-btn-bg border-primary text-fg-primary shadow-btn-secondary border",
          "hover:bg-secondary-btn-bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          disabled && "bg-disabled text-fg-disabled border-primary",
        )

      // Teal outline + tinted fill (settings Reload / Check)
      case "brand":
        return classNames(
          "bg-brand-secondary border-brand text-fg-brand border",
          "hover:bg-fg-brand/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          disabled && "bg-disabled text-fg-disabled border-primary",
        )

      case "orange":
        return "bg-fg-orange text-fg-primary-alt shadow-btn-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

      case "red":
        return "bg-fg-error text-fg-primary-alt shadow-btn-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    }
  }, [color, disabled, primary])

  const sizeClasses = useMemo(() => {
    if (iconOnly) return "size-8 shrink-0 rounded-md text-sm"

    switch (size) {
      case "small":
        return "px-md py-xs gap-xs rounded-sm text-xs"
      case "header":
        return "px-lg py-md gap-xs rounded-md text-sm"
      default:
        return "gap-xs rounded-md px-3.5 py-2.5 text-sm"
    }
  }, [iconOnly, size])

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || processing}
      className={classNames(
        "relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-200 ease-linear disabled:pointer-events-none",
        sizeClasses,
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
            <div className={size === "default" && !iconOnly ? "text-md" : "text-sm"}>
              <IconLeft className={size === "default" && !iconOnly ? "size-4" : "size-3.5"} />
            </div>
          )}
          <div>{children}</div>
          {Icon && (
            <div className={size === "default" && !iconOnly ? "text-md" : "text-sm"}>
              <Icon className={size === "default" && !iconOnly ? "size-4" : "size-3.5"} />
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
})
