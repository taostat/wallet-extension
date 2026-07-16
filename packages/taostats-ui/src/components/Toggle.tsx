import { classNames } from "@taostats-wallet/util"
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, PropsWithChildren, useId } from "react"

// can't override size, naming this variant instead but it's only for size
type ToggleVariant = "default" | "sm" | "tiny"

const VARIANTS: Record<ToggleVariant, string> = {
  tiny: "h-3 w-[22px] after:size-2.5 after:left-px after:top-px border-2",
  sm: "h-5 w-[36px] after:h-4 after:w-4 ",
  default: "h-6 w-[44px] after:h-5 after:w-5 ",
}

type ToggleProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "ref"
> &
  PropsWithChildren & {
    variant?: ToggleVariant
  }

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    const defaultId = useId()
    const id = props.id ?? defaultId

    return (
      <label
        htmlFor={id}
        className={classNames(
          "relative inline-flex items-center",
          props.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className,
        )}
      >
        <input id={id} ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <div
          className={classNames(
            "bg-tertiary peer box-content shrink-0 rounded-full border-2 border-transparent",
            "peer-focus-visible:border-fg-primary peer-focus:outline-none",
            "peer-checked:after:bg-fg-brand peer-checked:after:translate-x-full",
            "after:bg-secondary relative after:absolute after:left-0.5 after:top-0.5 after:rounded-full after:transition-all after:content-['']",
            VARIANTS[variant],
          )}
          data-testid="component-toggle-button"
        ></div>
        {children && <span className="text-fg-primary ml-xs">{children}</span>}
      </label>
    )
  },
)
Toggle.displayName = "Toggle"
