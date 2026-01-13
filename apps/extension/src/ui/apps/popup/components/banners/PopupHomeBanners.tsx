import { NewFeaturesButton } from "../NewFeaturesButton"
import { AssetHubMigrationBanner } from "./AssetHubMigration/AssetHubMigrationBanner"
import { BackupReminderBanner } from "./BackupReminderBanner"
import { UnifiedAddressInfoBanner } from "./UnifiedAddressInfoBanner"

export const PopupHomeBanners = () => {
  return (
    <>
      <BackupReminderBanner />
      <NewFeaturesButton />
      <UnifiedAddressInfoBanner />
      <AssetHubMigrationBanner />
    </>
  )
}
