import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { FC, PropsWithChildren } from "react"

export const SummaryContainer: FC<PropsWithChildren & { className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={classNames(
      "leading-paragraph mb-8 mt-4 rounded text-left",
      "bg-secondary border-primary text-fg-secondary border",
      "empty:hidden",
      className,
    )}
  >
    {children}
  </div>
)

export const SummaryContent: FC<PropsWithChildren & { className?: string }> = ({
  children,
  className,
}) => <div className={classNames("px-8 py-4", className)}>{children}</div>

export const SummaryAlert: FC<PropsWithChildren & { className?: string }> = ({
  children,
  className,
}) => (
  <div className={classNames("flex w-full items-stretch gap-3 px-8 py-4 text-xs", className)}>
    <div>
      <AlertCircle className="text-fg-brand inline-block shrink-0 align-text-top text-sm" />
    </div>
    <div className="grow">{children}</div>
  </div>
)

export const SummarySeparator: FC<{ className?: string }> = ({ className }) => (
  <div className={classNames("bg-tertiary h-0.5 shrink-0", className)} />
)
