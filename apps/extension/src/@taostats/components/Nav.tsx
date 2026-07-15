import { classNames } from "@taostats-wallet/util"
import { DetailedHTMLProps, FC, HTMLAttributes, ReactNode } from "react"
import { NavLink, To } from "react-router-dom"

export const Nav: FC<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>> = ({
  className,
  ...props
}) => (
  <nav className={classNames("flex flex-col items-start justify-start", className)} {...props} />
)

export type NavItemProps = {
  className?: string
  children: ReactNode
  icon: ReactNode
  iconContainerClassName?: string
  contentClassName?: string
  to?: To
  onClick?: () => void
}

export const NavItem: FC<NavItemProps> = ({
  className,
  children,
  icon,
  iconContainerClassName,
  contentClassName,
  to,
  ...props
}) => {
  const iconContainer = icon && (
    <div
      className={classNames("flex w-20 shrink-0 justify-center text-lg", iconContainerClassName)}
    >
      {icon}
    </div>
  )
  const content = (
    <>
      {iconContainer}
      <div className={classNames("flex-grow", contentClassName)}>{children}</div>
    </>
  )

  const isNavLink = to !== undefined
  const navClassName = classNames(
    "hover:bg-tertiary text-fg-secondary hover:text-fg-primary flex h-10 w-full shrink-1 items-center justify-start gap-xs rounded-sm p-xs text-left",
    isNavLink && "[&.active]:text-fg-brand",
    className,
  )

  if (isNavLink)
    return (
      <NavLink to={to} className={navClassName} {...props}>
        {content}
      </NavLink>
    )
  return (
    <button type="button" className={navClassName} {...props}>
      {content}
    </button>
  )
}
