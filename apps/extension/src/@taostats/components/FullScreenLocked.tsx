import { classNames } from "@taostats-wallet/util"
import { ReactNode } from "react"

import { TaostatsLogo } from "@taostats/theme/logos"

import { FadeIn } from "./FadeIn"

type Props = {
  className?: string
  title?: ReactNode
  subtitle?: ReactNode
}

export const FullScreenLocked = ({ className, title, subtitle }: Props) => (
  <FadeIn className="flex h-screen w-screen flex-col items-center justify-center">
    <section
      className={classNames("text-fg-secondary flex select-none flex-col items-center", className)}
    >
      <div className="relative">
        <TaostatsLogo className={classNames("text-fg-primary mb-md block text-[120px]")} />
      </div>
      {title && <h1 className="text-md text-fg-tertiary mb-xxs font-bold">{title}</h1>}
      {subtitle && <h2 className="text-xs">{subtitle}</h2>}
    </section>
  </FadeIn>
)
