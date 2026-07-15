import * as Sentry from "@sentry/browser"
import { FC, useMemo } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { Favicon } from "./Favicon"

export const AppPill: FC<{ url?: string }> = ({ url }) => {
  const host = useMemo(() => {
    try {
      if (!url) return null
      const typedUrl = new URL(url)
      return typedUrl.hostname
    } catch (err) {
      Sentry.captureException(err)
      return null
    }
  }, [url])

  if (!url || !host) return null

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="text-fg-secondary bg-secondary border-primary gap-xxs px-xs py-xxs flex max-w-[22rem] items-center rounded-3xl border text-sm font-light">
          <Favicon url={url} className="text-base" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{host}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{url}</TooltipContent>
    </Tooltip>
  )
}
