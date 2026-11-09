import { classNames } from "@taostats-wallet/util"
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react"

/** Icon toolbar button — matches `Button` `color="secondary"` + `iconOnly`. */
export const PortfolioToolbarButton = forwardRef<
  HTMLButtonElement,
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={classNames(
        "bg-secondary-btn-bg border-primary text-fg-primary shadow-btn-secondary hover:bg-secondary-btn-bg-hover",
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-sm transition-colors",
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&>svg]:size-4",
        className,
      )}
    />
  )
})
PortfolioToolbarButton.displayName = "ToolbarButton"
