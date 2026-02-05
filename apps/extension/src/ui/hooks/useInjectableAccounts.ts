import {
  Account,
  isAccountInTypes,
  isAccountNotContact,
  isAccountPlatformPolkadot,
  ProviderType,
} from "extension-core"
import { isInternalUrl } from "extension-shared"
import { useMemo } from "react"

import { useAccounts, useSettingValue } from "@ui/state"

export const useInjectableAccounts = (siteUrl: string, provider: ProviderType) => {
  const isInternalSite = isInternalUrl(siteUrl)
  const isDevMode = useSettingValue("developerMode")
  const accounts = useAccounts()

  const providerCompatibleAccounts = useMemo<Account[]>(() => {
    switch (provider) {
      case "polkadot":
        return accounts.filter(isAccountPlatformPolkadot)
    }
  }, [accounts, provider])

  return useMemo(() => {
    if (isDevMode) return providerCompatibleAccounts
    if (isInternalSite) return providerCompatibleAccounts.filter(isAccountNotContact)
    return providerCompatibleAccounts.filter(
      (account) => !isAccountInTypes(account, ["contact", "watch-only"]),
    )
  }, [isDevMode, isInternalSite, providerCompatibleAccounts])
}
