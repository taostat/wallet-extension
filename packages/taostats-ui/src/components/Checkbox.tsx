import { classNames } from "@taostats-wallet/util"
import {
  DetailedHTMLProps,
  forwardRef,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from "react"

export type CheckboxProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  containerProps?: DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>
  childProps?: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ disabled, className, children, containerProps = {}, childProps = {}, ...inputProps }, ref) => {
    return (
      <label
        className={classNames(
          "inline-flex items-center justify-start gap-[0.5em]",
          !disabled && "cursor-pointer",
          className,
        )}
        {...containerProps}
      >
        <input
          type="checkbox"
          className={classNames(
            "form-checkbox rounded-xs border-fg-tertiary text-fg-brand h-[1.2em] w-[1.2em] cursor-pointer border bg-transparent",
            "checked:hover:border-fg-tertiary checked:active hover:border-fg-primary checked:active:focus-visible:border-transparent",
            "active:bg-tertiary enabled:focus-visible:border-fg-primary",
            "[&.form-checkbox:]:focus:!ring-0 !outline-0 !ring-0 [&.form-checkbox]:focus:!outline-0 [&.form-checkbox]:focus:!outline-offset-0 [&.form-checkbox]:focus:ring-offset-0",
            "disabled:checked:bg-tertiary disabled:border-fg-disabled disabled:cursor-default disabled:bg-transparent disabled:checked:border-transparent",
          )}
          ref={ref}
          disabled={disabled}
          {...inputProps}
        />
        {children && (
          <span
            className={classNames(
              "text-fg-primary text-left",
              disabled && "text-fg-disabled",
              childProps.className,
            )}
            {...childProps}
          >
            {children}
          </span>
        )}
      </label>
    )
  },
)
Checkbox.displayName = "Checkbox"
