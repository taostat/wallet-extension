import { CrossChainAttentionNotice } from "@ui/domains/CrossChain/CrossChainAttentionNotice"

import { BackupReminderBanner } from "./BackupReminderBanner"

export const PopupHomeBanners = () => {
  return (
    <>
      <BackupReminderBanner />
      <CrossChainAttentionNotice />
    </>
  )
}
