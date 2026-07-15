import { classNames } from "@taostats-wallet/util"
import {
  DetailedHTMLProps,
  FC,
  forwardRef,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react"

export type FormFieldInputContainerProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  small?: boolean
}

export const FormFieldInputContainer: FC<FormFieldInputContainerProps> = ({
  small,
  className,
  ...props
}) => {
  return (
    <div
      {...props}
      className={classNames(
        "border-primary bg-secondary text-fg-primary text-md focus-within:border-brand gap-xs px-lg flex w-full items-center rounded-md border font-normal leading-none",
        small ? "h-9" : "h-10",
        className,
      )}
    />
  )
}

export type FormFieldInputTextProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  containerProps?: FormFieldInputContainerProps
  before?: ReactNode
  after?: ReactNode
  small?: boolean
}

export const FormFieldInputText = forwardRef<HTMLInputElement, FormFieldInputTextProps>(
  ({ containerProps, small, before, after, ...props }, ref) => {
    return (
      <FormFieldInputContainer small={small} {...containerProps}>
        {before}
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          data-lpignore
          ref={ref}
          {...props}
          className={classNames(
            "text-fg-primary placeholder:text-fg-tertiary disabled:text-fg-disabled h-full min-w-0 grow bg-transparent focus-visible:outline-none",
            props.className,
          )}
        />
        {after}
      </FormFieldInputContainer>
    )
  },
)
FormFieldInputText.displayName = "FormFieldInputText"
