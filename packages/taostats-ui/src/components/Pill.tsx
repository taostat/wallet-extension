import { classNames } from "@taostats-wallet/util"
import { forwardRef, HTMLAttributes, ReactNode } from "react"

export type PillVariant =
  | "secondary"
  | "neutral"
  | "positive"
  | "negative"
  | "brand"
  | "tertiary"
  | "bordered"
  | "orange"

export type PillSize = "xs" | "sm" | "md"

/** `pill` = rounded-full, `soft` = rounded-3xl, `square` = rounded */
export type PillShape = "pill" | "soft" | "square"

export type PillClassNameOptions = {
  variant?: PillVariant
  size?: PillSize
  shape?: PillShape
  mono?: boolean
  className?: string
}

const variantClasses: Record<PillVariant, string> = {
  secondary: "bg-secondary-btn-bg text-white",
  neutral: "bg-secondary text-fg-tertiary",
  positive: "bg-brand-secondary text-fg-brand",
  negative: "bg-accent-2/10 text-accent-2",
  brand: "bg-fg-brand/10 text-fg-brand",
  tertiary: "bg-tertiary text-fg-primary",
  bordered: "bg-secondary border-primary text-fg-secondary border",
  orange: "bg-orange-secondary/10 text-fg-orange",
}

const sizeClasses: Record<PillSize, string> = {
  xs: "gap-xxs px-sm py-xxs text-xs",
  sm: "gap-xs px-2 py-1 text-xs leading-none",
  md: "gap-xs px-[1em] py-[0.666em] text-xs leading-none",
}

const shapeClasses: Record<PillShape, string> = {
  pill: "rounded-full",
  soft: "rounded-3xl",
  square: "rounded p-2",
}

export const getPillClassName = ({
  variant = "secondary",
  size = "xs",
  shape = "pill",
  mono = false,
  className,
}: PillClassNameOptions = {}) =>
  classNames(
    "inline-flex shrink-0 items-center font-medium",
    variantClasses[variant],
    shape !== "square" && sizeClasses[size],
    shapeClasses[shape],
    shape === "square" && "text-xs",
    mono && "font-mono",
    className,
  )

export type PillProps = PillClassNameOptions &
  Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: ReactNode
    as?: "span" | "div"
  }

export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  (
    {
      variant = "secondary",
      size = "xs",
      shape = "pill",
      mono = false,
      className,
      children,
      as: Component = "span",
      ...props
    },
    ref,
  ) => (
    <Component
      ref={ref as never}
      className={getPillClassName({ variant, size, shape, mono, className })}
      {...props}
    >
      {children}
    </Component>
  ),
)
Pill.displayName = "Pill"
