import { classNames } from "@taostats-wallet/util"
import { Check } from "@untitledui/icons/Check"
import {
  ButtonHTMLAttributes,
  FC,
  forwardRef,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  SVGProps,
  useCallback,
} from "react"

import {
  Popover,
  PopoverContent,
  PopoverOptions,
  PopoverTrigger,
  PopoverTriggerProps,
  usePopoverContext,
} from "./Popover"

export const ContextMenu: FC<{ children: ReactNode } & PopoverOptions> = (props) => (
  <Popover {...props} />
)

export const ContextMenuTrigger = forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & PopoverTriggerProps
>((props, ref) => <PopoverTrigger {...props} ref={ref} />)
ContextMenuTrigger.displayName = "ContextMenuTrigger"

export const ContextMenuContent: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
  return (
    <PopoverContent
      {...props}
      className="border-primary bg-menu-bg text-fg-primary shadow-menu-dropdown px-xs py-xs gap-xxs z-50 flex w-min flex-col whitespace-nowrap rounded-md border text-left text-sm backdrop-blur-md"
    />
  )
}

export const ContextMenuItem: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  onClick,
  className,
  ...props
}) => {
  const { setOpen } = usePopoverContext()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      setOpen(false)
    },
    [setOpen, onClick],
  )

  return (
    <button
      type="button"
      {...props}
      onClick={handleClick}
      className={classNames(
        "enabled:hover:bg-tertiary focus-visible:bg-tertiary disabled:text-fg-disabled text-fg-primary px-md py-sm flex min-h-8 items-center rounded-sm text-left",
        className,
      )}
    />
  )
}

export const ContextMenuOptionItem: FC<{
  label: string
  selected: boolean
  onClick: () => void
}> = ({ label, selected, onClick }) => (
  <ContextMenuItem
    className={classNames(
      "gap-xl flex items-center justify-between",
      selected ? "text-fg-brand" : "text-fg-secondary",
    )}
    onClick={onClick}
  >
    <div>{label}</div>
    <Check className={classNames(selected ? "visible" : "invisible")} />
  </ContextMenuItem>
)

/**
 * Styled context menu row with a left-aligned mono/uppercase label and a
 * right-aligned icon. Shared across the account and recovery-phrase menus.
 */
export const ContextMenuActionItem: FC<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: ReactNode
    icon: FC<SVGProps<SVGSVGElement>>
    destructive?: boolean
  }
> = ({ label, icon: Icon, destructive, className, ...props }) => (
  <ContextMenuItem
    {...props}
    className={classNames(
      "gap-xl min-w-[220px] justify-between font-mono text-xs uppercase tracking-wide transition-colors duration-300",
      destructive ? "text-fg-error hover:text-fg-error" : "text-fg-primary",
      className,
    )}
  >
    <span>{label}</span>
    <Icon className="size-4 shrink-0" />
  </ContextMenuItem>
)
