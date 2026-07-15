import type { ReactNode } from "react"
import { classNames } from "@taostats-wallet/util"

const BRACKET_CORNERS = [
  {
    position: "left-0 top-0",
    borders: "border-l-[1.5px] border-t-[1.5px]",
  },
  {
    position: "right-0 top-0",
    borders: "border-r-[1.5px] border-t-[1.5px]",
  },
  {
    position: "bottom-0 left-0",
    borders: "border-b-[1.5px] border-l-[1.5px]",
  },
  {
    position: "bottom-0 right-0",
    borders: "border-b-[1.5px] border-r-[1.5px]",
  },
] as const

const BracketCorners = ({ className }: { className?: string }) =>
  BRACKET_CORNERS.map((corner) => (
    <span
      key={corner.position}
      aria-hidden
      className={classNames(
        "border-fg-brand absolute size-[14px] border-solid",
        corner.position,
        corner.borders,
        className,
      )}
    />
  ))

export type BracketGlowWordProps = {
  children: ReactNode
  className?: string
}

/** Brand word with glowing corner brackets — matches the api-keys ui-v2 treatment. */
export const BracketGlowWord = ({ children, className }: BracketGlowWordProps) => (
  <span
    className={classNames(
      "relative inline-flex items-center px-[6.5px] py-[1.5px] sm:px-[6.5px]",
      className,
    )}
  >
    <BracketCorners className="pointer-events-none" />
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-plus-lighter blur-[5.7px]"
    >
      <BracketCorners />
    </span>
    <span
      aria-hidden
      className="text-fg-brand pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-[0.79] mix-blend-plus-lighter blur-[15.65px]"
    >
      {children}
    </span>
    <span className="text-fg-brand relative z-10">{children}</span>
  </span>
)
