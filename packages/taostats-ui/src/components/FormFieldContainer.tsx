import { classNames } from "@taostats-wallet/util"
import { FC, ReactNode } from "react"

type FormFieldContainerProps = {
  className?: string
  label?: ReactNode
  children: ReactNode
  error?: string | null
  noErrorRow?: boolean
}

export const FormFieldContainer: FC<FormFieldContainerProps> = ({
  className,
  label,
  children,
  error,
  noErrorRow,
}) => {
  return (
    <div className={classNames("leading-base text-left text-base", className)}>
      <div className="text-fg-secondary text-sm font-medium">{label}</div>
      <div className="mt-xs">{children}</div>
      {!noErrorRow && (
        <div className="text-fg-orange py-xxs h-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-right text-xs leading-none">
          {error}
        </div>
      )}
    </div>
  )
}
