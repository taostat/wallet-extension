import { classNames } from "@taostats-wallet/util"
import {
  DetailedHTMLProps,
  FC,
  MouseEventHandler,
  ReactNode,
  SVGProps,
  useCallback,
  useMemo,
} from "react"
import { useNavigate } from "react-router-dom"

export type CtaButtonSize = "large" | "small"

type CtaButton = DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  iconLeft?: FC<SVGProps<SVGSVGElement>>
  iconRight?: FC<SVGProps<SVGSVGElement>>
  title: ReactNode
  subtitle: ReactNode
  to?: string
  size?: CtaButtonSize
}

export const getContainerClassName = (size: CtaButtonSize) => {
  switch (size) {
    case "large":
      return {
        iconLeftClassName: "text-lg",
        containerClassName: "h-16 py-md",
        contentClassName: "gap-xs",
        titleClassName: "text-md",
        subtitleClassName: "text-sm",
      }
    case "small":
      return {
        iconLeftClassName: "text-xl",
        containerClassName: "h-12 py-sm",
        contentClassName: "gap-xxs",
        titleClassName: "text-sm",
        subtitleClassName: "text-xs",
      }
  }
}

export const CtaButton: FC<CtaButton> = ({
  iconLeft: IconLeft,
  iconRight: IconRight,
  title,
  subtitle,
  className,
  to,
  size = "large",
  onClick,
  ...props
}) => {
  const navigate = useNavigate()
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (to && to.startsWith("http")) window.open(to, "_blank")
      else if (to) navigate(to)
      else if (onClick) onClick(e)
    },
    [navigate, onClick, to],
  )

  const {
    containerClassName,
    iconLeftClassName,
    contentClassName,
    titleClassName,
    subtitleClassName,
  } = useMemo(() => getContainerClassName(size), [size])

  return (
    <button
      type="button"
      {...props}
      className={classNames(
        "bg-secondary-btn-bg border-primary text-fg-disabled enabled:hover:bg-secondary-btn-bg-hover enabled:hover:text-fg-primary gap-md px-lg shadow-btn-secondary flex w-full cursor-pointer items-center rounded-md border disabled:cursor-not-allowed disabled:opacity-50",
        containerClassName,
        className,
      )}
      onClick={handleClick}
    >
      {IconLeft && (
        <IconLeft className={classNames("text-fg-primary shrink-0", iconLeftClassName)} />
      )}
      <div className={classNames("flex grow flex-col items-start", contentClassName)}>
        <div className={classNames("text-fg-primary font-medium", titleClassName)}>{title}</div>
        <div className={classNames("text-fg-secondary text-left", subtitleClassName)}>
          {subtitle}
        </div>
      </div>
      {IconRight && <IconRight className="text-fg-tertiary shrink-0 text-lg" />}
    </button>
  )
}
