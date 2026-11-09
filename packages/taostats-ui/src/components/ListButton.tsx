import { classNames } from "@taostats-wallet/util"
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react"

type ListButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

export const ListButton = forwardRef<HTMLButtonElement, ListButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      className={classNames(
        "bg-secondary hover:bg-tertiary text-fg-secondary hover:text-fg-primary allow-focus gap-sm px-lg py-md flex w-full items-center rounded-sm text-left",
        className,
      )}
      ref={ref}
      type="button"
      {...props}
    />
  ),
)
ListButton.displayName = "ListButton"
