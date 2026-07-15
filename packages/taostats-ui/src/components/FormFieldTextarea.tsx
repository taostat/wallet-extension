import { classNames } from "@taostats-wallet/util"
import { DetailedHTMLProps, forwardRef, TextareaHTMLAttributes } from "react"

type FormFieldTextareaProps = DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>

export const FormFieldTextarea = forwardRef<HTMLTextAreaElement, FormFieldTextareaProps>(
  (props, ref) => {
    return (
      <textarea
        ref={ref}
        className={classNames(
          "border-primary bg-secondary text-fg-primary placeholder:text-fg-tertiary focus-within:border-brand text-md disabled:text-fg-disabled px-lg py-md w-full resize-none rounded-md border font-normal focus-visible:outline-none",
          props.className,
        )}
        {...props}
      />
    )
  },
)
FormFieldTextarea.displayName = "FormFieldTextarea"
