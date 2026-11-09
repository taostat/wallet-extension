import { Suspense } from "react"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { SuspenseTracker } from "@taostats/components/SuspenseTracker"

import { SupportOpsBackup } from "./SupportOpsBackupButton"
import { SupportOpsRestoreButton } from "./SupportOpsRestoreButton"

export const SupportOpsPage = () => (
  <Suspense fallback={<SuspenseTracker name="Support" />}>
    <div className="container mx-auto flex w-[800px] flex-col gap-10 py-20">
      <HeaderBlock
        title="Taostats Support Operations"
        text="Use this page to back up or restore your Taostats data."
      />
      <div className="grid grid-cols-2 gap-5">
        <SupportOpsBackup />
        <SupportOpsRestoreButton />
      </div>
    </div>
  </Suspense>
)
