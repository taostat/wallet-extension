import { classNames } from "@taostats-wallet/util"
import { FC, ReactNode } from "react"
import { SurfaceCard } from "taostats-ui"

const SelectionIndicator: FC<{ className?: string }> = ({ className }) => (
  <span
    className={classNames(
      "border-fg-brand flex size-4 shrink-0 items-center justify-center rounded-sm border",
      className,
    )}
    aria-hidden
  >
    <span className="bg-fg-brand size-2 rounded-[2px]" />
  </span>
)

export const PortfolioAccountRow: FC<{
  logo: ReactNode
  label: ReactNode
  fiat: ReactNode
  right?: ReactNode
  isSelected?: boolean
  onClick: () => void
  className?: string
}> = ({ logo, label, fiat, right, isSelected, onClick, className }) => {
  return (
    <SurfaceCard
      className={classNames(
        "relative flex h-14 w-full items-center gap-2 px-2 transition-colors",
        isSelected ? "border-fg-brand bg-fg-brand/5" : "hover:bg-tertiary/50",
        className,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        onClick={onClick}
      >
        <div className="flex size-10 shrink-0 items-center justify-center text-[40px]">{logo}</div>
        <div className="flex grow flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-fg-primary truncate text-sm font-medium">{label}</div>
          <div className="text-fg-tertiary truncate text-xs">{fiat}</div>
        </div>
      </button>
      <div className="flex shrink-0 items-center pr-0.5">
        {isSelected ? <SelectionIndicator /> : right}
      </div>
    </SurfaceCard>
  )
}
