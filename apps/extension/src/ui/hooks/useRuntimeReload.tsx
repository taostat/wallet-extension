import { connectionMetaDb } from "@taostats-wallet/connection-meta"
import { db as mainDb } from "extension-core"
import { useCallback, useState } from "react"

import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"

export const useRuntimeReload = (analyticsPage: AnalyticsPage) => {
  const [hasRuntimeReloadFn] = useState(() => typeof chrome?.runtime?.reload === "function")
  const runtimeReload = useCallback(async () => {
    sendAnalyticsEvent({
      ...analyticsPage,
      name: "Interact",
      action: "Reload Wallet button",
    })

    // these do not contain any user data, they will be safely recreated on next startup
    await Promise.allSettled([
      connectionMetaDb.delete(),
      mainDb.metadata.clear(),
      mainDb.blobs.clear(), // chaindata, balances, nfts etc
      tryDeleteDatabase("TaostatsExtensionChaindata"), // old chaindata db
      tryDeleteDatabase("TaostatsExtensionChaindataV4"), // current chaindata db, it will be recreated on next startup
    ])

    chrome.runtime.reload()
  }, [analyticsPage])

  return [hasRuntimeReloadFn, runtimeReload] as const
}

const tryDeleteDatabase = (name: string) => {
  return new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
}
