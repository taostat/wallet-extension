import { classNames } from "@taostats-wallet/util"
import { FC, ReactNode, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

import { ScrollContainer } from "@taostats/components/ScrollContainer"

import { BottomNav } from "../components/Navigation/BottomNav"
import { PopupLogoHeader } from "./PopupLogoHeader"
import { PopupLayout } from "./PopupLayout"

type PopupTabShellProps = {
  headerRight?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export const PopupTabShell: FC<PopupTabShellProps> = ({
  headerRight,
  children,
  contentClassName,
}) => {
  const scrollableRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    scrollableRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ScrollContainer ref={scrollableRef} className="size-full overflow-hidden">
      <div className="flex size-full flex-col gap-2 py-4">
        <PopupLogoHeader right={headerRight} />
        <div className={classNames("min-h-0 flex-1", contentClassName)}>{children}</div>
        <BottomNav />
      </div>
    </ScrollContainer>
  )
}

export const PopupTabPage: FC<PopupTabShellProps> = (props) => (
  <PopupLayout>
    <PopupTabShell {...props} />
  </PopupLayout>
)
