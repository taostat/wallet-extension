import { classNames } from "@taostats-wallet/util"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Loading01 } from "@untitledui/icons/Loading01"
import { FC, PropsWithChildren } from "react"

type IconSize = "xl" | "lg" | "md" | "base" | "sm"

const getIconSizeClass = (size: IconSize) => {
  switch (size) {
    case "base":
      return "text-base"
    case "md":
      return "text-md"
    case "sm":
      return "text-sm"
    case "lg":
      return "text-lg"
    case "xl":
      return "text-xl"
  }
}

type SignAlertMessageProps = PropsWithChildren & {
  className?: string
  type?: "warning" | "error"
  iconSize?: IconSize
  processing?: boolean
}

export const SignAlertMessage: FC<SignAlertMessageProps> = ({
  children,
  className,
  type = "warning",
  iconSize = "xl",
  processing,
}) => {
  return (
    <div
      className={classNames(
        "bg-orange-secondary/10 flex w-full items-center gap-4 rounded-sm p-5",
        className,
      )}
    >
      <div
        className={classNames(
          type === "error" ? "text-fg-orange" : "text-fg-secondary",
          getIconSizeClass(iconSize),
        )}
      >
        {processing ? (
          <Loading01 className="animate-spin-slow transition-none" />
        ) : (
          <InfoCircle className="transition-none" />
        )}
      </div>
      <div
        className={classNames(
          "scrollable scrollable-700 grow overflow-y-auto text-left text-xs leading-[140%]",
          type === "error" ? "text-fg-orange" : "text-fg-secondary",
        )}
      >
        {children}
      </div>
    </div>
  )
}
