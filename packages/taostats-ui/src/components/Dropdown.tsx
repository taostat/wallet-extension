import { Listbox } from "@headlessui/react"
import { classNames } from "@taostats-wallet/util"
import { ChevronDown } from "@untitledui/icons/ChevronDown"
import { ReactNode } from "react"

export type DropdownOption = Record<string, unknown>

export type DropdownOptionRender<T extends DropdownOption> = (
  item: T,
  labelKey?: keyof T,
) => ReactNode

const DEFAULT_RENDER = <T extends DropdownOption>(item: T, labelKey?: keyof T): ReactNode => {
  return <>{labelKey ? item[labelKey] : item.toString()}</>
}

export type DropdownProps<T extends DropdownOption> = {
  label?: ReactNode
  items: T[]
  propertyKey: keyof T
  propertyLabel?: keyof T
  renderItem?: DropdownOptionRender<T>
  value?: T | null | undefined
  placeholder?: string
  onChange?: (item: T | null) => void
  disabled?: boolean
  /** Compact trigger/options padding, aligned with Button `small`. */
  small?: boolean
  className?: string
  buttonClassName?: string
  optionClassName?: string
}

export const Dropdown = <T extends Record<string, unknown>>({
  className,
  buttonClassName,
  optionClassName,
  disabled,
  small,
  label,
  propertyKey,
  propertyLabel,
  items,
  value,
  placeholder,
  renderItem = DEFAULT_RENDER,
  onChange,
}: DropdownProps<T>) => (
  <Listbox disabled={disabled} value={value} onChange={onChange}>
    {({ open }) => (
      <div className={className}>
        {label && (
          <Listbox.Label className="text-fg-secondary mb-md block text-sm font-medium">
            {label}
          </Listbox.Label>
        )}
        <div className={"text-fg-secondary inline-block max-h-[200px] w-full"}>
          <Listbox.Button
            className={classNames(
              "bg-secondary-btn-bg text-fg-primary enabled:hover:bg-secondary-btn-bg-hover disabled:bg-disabled disabled:text-fg-disabled shadow-btn-secondary flex w-full items-center border text-left",
              small
                ? "gap-xs px-md py-xs rounded-sm text-xs"
                : "gap-md px-lg py-md text-sm",
              open
                ? classNames("border-brand", small ? "rounded-t-sm" : "rounded-t-md")
                : classNames("border-primary", small ? "rounded-sm" : "rounded-md"),
              buttonClassName,
            )}
          >
            <div className="flex flex-grow flex-col justify-center overflow-hidden">
              {value ? renderItem(value, propertyLabel) : placeholder}
            </div>
            {!disabled && (
              <ChevronDown
                className={classNames(
                  "text-fg-tertiary shrink-0",
                  small ? "size-3.5" : "text-[1.2em]",
                )}
              />
            )}
          </Listbox.Button>
          <div className="relative w-full">
            <div
              className={classNames(
                "bg-menu-bg border-primary shadow-menu-dropdown scrollable scrollable-700 absolute left-0 top-0 z-10 max-h-[300px] w-full overflow-y-auto overflow-x-hidden border border-t-0 backdrop-blur-md",
                small ? "rounded-b-sm" : "rounded-b-md",
              )}
            >
              <Listbox.Options>
                {items.map((item, i, arr) => (
                  <Listbox.Option
                    key={item[propertyKey] as string | number}
                    value={item}
                    className={classNames(
                      "bg-menu-bg hover:bg-tertiary hover:text-fg-primary text-fg-primary w-full max-w-full cursor-pointer overflow-hidden",
                      "flex-grow flex-col justify-center",
                      small ? "px-md py-xs text-xs" : "px-lg py-md text-sm",
                      i === arr.length - 1 && (small ? "rounded-b-sm" : "rounded-b-md"),
                      optionClassName,
                    )}
                  >
                    {renderItem(item, propertyLabel)}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </div>
        </div>
      </div>
    )}
  </Listbox>
)
