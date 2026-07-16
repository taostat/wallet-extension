import { Address } from "extension-core"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { PortfolioAccount } from "../PortfolioAccount"

type AssetStateProps = {
  title: string
  description?: string
  render: boolean
  address?: Address
  isLoading?: boolean
  locked?: boolean
}

export const AssetState = ({
  title,
  description,
  render,
  address,
  isLoading,
  locked,
}: AssetStateProps) => {
  if (!render) return null
  return (
    <div className="flex flex-col justify-center gap-1 overflow-hidden p-4">
      <div className="flex w-full items-baseline gap-2 overflow-hidden">
        <div className="shrink-0 whitespace-nowrap font-bold capitalize text-white">{title}</div>
        {/* show description next to title when address is set */}
        {description && address && (
          <Tooltip>
            <TooltipTrigger className="max-w-full truncate text-sm">{description}</TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        )}
        {!description && address && isLoading && (
          <div className="bg-secondary rounded-xs h-[14px] w-[120px] animate-pulse" />
        )}
      </div>
      {address && (
        <div className="text-sm">
          <PortfolioAccount address={address} />
        </div>
      )}
      {/* show description below title when address is not set */}
      {isLoading && !description && !address && locked && (
        <div className="bg-secondary rounded-xs h-[16px] w-[120px] animate-pulse" />
      )}
      {description && !address && (
        <Tooltip>
          <TooltipTrigger className="max-w-full truncate text-left text-sm">
            {description}
          </TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
