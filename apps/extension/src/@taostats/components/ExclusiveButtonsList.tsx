import { classNames } from "@taostats-wallet/util"
import { Check } from "@untitledui/icons/Check"
import { FC } from "react"

type ExclusiveButtonsListProps<T> = {
  options: ExclusiveButtonsListItemProps<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

type ExclusiveButtonsListItemProps<T> = {
  value: T
  label: string
}

export const ExclusiveButtonsList = <T extends string | number>({
  options,
  value,
  onChange,
  className,
}: ExclusiveButtonsListProps<T>) => {
  return (
    <div className={classNames("gap-xs flex flex-col", className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          displayName={option.label}
          selected={option.value === value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  )
}

const Button: FC<{
  displayName: string
  selected: boolean
  onClick: () => void
}> = ({ displayName, selected, onClick }) => {
  return (
    <button
      type="button"
      className={classNames(
        "text-fg-secondary gap-xs px-sm sm:px-lg flex h-10 w-full items-center justify-between rounded-sm",
        "border-primary border",
        selected && "bg-brand-secondary text-fg-brand border-brand",
        "hover:border-primary hover:bg-tertiary stroke-fg-brand",
      )}
      onClick={onClick}
    >
      <div>{displayName}</div>
      {!!selected && <Check className="text-fg-brand text-base sm:text-lg" />}
    </button>
  )
}
