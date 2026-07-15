import { FC, ReactNode } from "react"

export const HeaderBlock: FC<{
  title?: ReactNode
  text?: ReactNode
  className?: string
}> = ({ title, text, className }) => (
  <header className={className}>
    {title && <h1 className="text-fg-primary text-lg">{title}</h1>}
    {text && <p className="text-fg-secondary mt-xs text-sm">{text}</p>}
  </header>
)
