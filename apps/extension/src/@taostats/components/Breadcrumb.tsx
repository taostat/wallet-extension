import { classNames } from "@taostats-wallet/util"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { FC, Fragment, ReactNode } from "react"

type BreadcrumbItem = {
  label: ReactNode
  className?: string
  onClick?: () => void
}

export const Breadcrumb: FC<{
  items: BreadcrumbItem[]
  className?: string
}> = ({ items, className }) => {
  return (
    <div className={classNames("text-fg-secondary gap-xxs flex items-center text-base", className)}>
      {items.map(({ label, onClick, className }, index) => {
        return (
          <Fragment key={index}>
            {onClick ? (
              <button
                onClick={onClick}
                className={classNames(
                  "bg-tertiary hover:bg-secondary hover:text-fg-primary px-xs h-8 truncate rounded-sm",
                  className,
                )}
              >
                {label}
              </button>
            ) : (
              <span className={classNames("truncate", className)}>{label}</span>
            )}
            {index < items.length - 1 && <ChevronRight />}
          </Fragment>
        )
      })}
    </div>
  )
}
