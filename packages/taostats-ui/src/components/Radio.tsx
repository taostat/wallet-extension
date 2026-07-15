import { classNames } from "@taostats-wallet/util"
import { ChangeEventHandler, FC, ReactNode } from "react"

export const Radio: FC<{
  name: string
  value: string
  label?: ReactNode
  checked?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  className?: string
}> = ({ name, value, label, checked, className, onChange }) => {
  return (
    <label
      className={classNames(
        "text-fg-secondary cursor-pointer p-0.5",
        "hover:text-fg-primary",
        "has-[:checked]:text-fg-primary has-[:checked]:cursor-default",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className={classNames(
          "bg-fg-disabled h-[0.8em] w-[0.8em] appearance-none rounded-full",
          "checked:bg-fg-brand checked:border-fg-disabled checked:border-[0.15em]",
          "ring-fg-primary focus-visible:ring-1",
        )}
      />
      {!!label && <span className="ml-xs">{label}</span>}
    </label>
  )
}
