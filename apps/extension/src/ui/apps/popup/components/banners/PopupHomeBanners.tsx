import { NewFeaturesButton } from "../NewFeaturesButton"
import { BackupReminderBanner } from "./BackupReminderBanner"
import { UnifiedAddressInfoBanner } from "./UnifiedAddressInfoBanner"

export const PopupHomeBanners = () => {
  return (
    <>
      <BackupReminderBanner />
      <NewFeaturesButton />
      <UnifiedAddressInfoBanner />
    </>
  )
}
