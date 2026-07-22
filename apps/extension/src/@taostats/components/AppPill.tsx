import * as Sentry from "@sentry/browser"
import { FC, useMemo } from "react"
import { Pill, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

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
        <Pill
          as="div"
          variant="bordered"
          shape="soft"
          size="xs"
          className="gap-xxs max-w-[220px] text-sm font-light"
        >
          <Favicon url={url} className="text-base" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{host}</span>
        </Pill>
      </TooltipTrigger>
      <TooltipContent>{url}</TooltipContent>
    </Tooltip>
  )
}
