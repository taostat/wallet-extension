import { classNames } from "@taostats-wallet/util"
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react"

export const PortfolioToolbarButton = forwardRef<
  HTMLButtonElement,
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={classNames(
        "bg-app-bg hover:bg-secondary text-fg-secondary border-content flex items-center justify-center rounded-sm",
        "focus-visible:border-primary size-16 border border-transparent ring-transparent",
        props.className,
      )}
    />
  )
})
PortfolioToolbarButton.displayName = "ToolbarButton"
