import type { ReactNode } from "react"
import { Token } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { Suspense } from "react"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"

import { StakeAccountPillButton } from "../../Stake/StakeAccountPillButton"

type BittensorAssetAccountSummaryProps = {
  token: Token | null | undefined
  accountAddress?: string
  onAccountClick: () => void
  suspenseName?: string
  className?: string
  assetLabel: ReactNode
  accountLabel: ReactNode
}

export const BittensorAssetAccountSummary = ({
  accountAddress,
  onAccountClick,
  suspenseName = "AccountPillButton",
  className,
  accountLabel,
}: BittensorAssetAccountSummaryProps) => {
  return (
    <div
      className={classNames(
        "bg-app-bg leading-paragraph flex flex-col gap-2 rounded p-2 text-sm",
        className,
      )}
    >
      <div className="flex h-8 items-center justify-between gap-2">
        <div className="whitespace-nowrap">{accountLabel}</div>
        <div className="overflow-hidden">
          <Suspense fallback={<SuspenseTracker name={suspenseName} />}>
            <StakeAccountPillButton address={accountAddress} onClick={onAccountClick} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
