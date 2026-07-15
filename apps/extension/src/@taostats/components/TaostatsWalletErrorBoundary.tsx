import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react"
import { DexieError } from "dexie"
import { DEBUG, DISCORD_URL } from "extension-shared"
import { ReactNode, useCallback } from "react"
import { Button } from "taostats-ui"

import { TaostatsLogo } from "@taostats/theme/logos"

export const TaostatsWalletErrorBoundary = ({ children }: { children?: ReactNode }) => (
  <SentryErrorBoundary fallback={ErrorMessage}>{children}</SentryErrorBoundary>
)

function ErrorMessage({ error, eventId }: { error: unknown; eventId?: string }) {
  const isDbVersionError = (error as DexieError)?.inner?.name === "VersionError"
  const canClearDatabases = DEBUG && isDbVersionError
  const errorMessage = isDbVersionError ? "Invalid database version" : "Sorry, an error occurred"

  const clearDatabases = useCallback(() => {
    indexedDB.deleteDatabase("TaostatsExtension")
    indexedDB.deleteDatabase("TaostatsExtensionBalances")
    indexedDB.deleteDatabase("TaostatsExtensionChaindata")
    indexedDB.deleteDatabase("TaostatsExtensionChaindataV4")
    indexedDB.deleteDatabase("TaostatsExtensionConnectionMeta")
    alert("Databases cleared. Please click OK to reinitialise")
    chrome.runtime.reload()
  }, [])

  return (
    <section className="text-fg-secondary max-w-screen p-xl mx-auto flex h-[60rem] max-h-screen w-[40rem] flex-col overflow-hidden text-center">
      <div className="gap-2xl flex w-full flex-grow flex-col items-center justify-center">
        <h1 className="text-fg-primary m-0 text-3xl font-bold">Oops!</h1>
        <TaostatsLogo className="text-[16rem]" />
        <div className="gap-xxs flex flex-col">
          <div>{errorMessage}</div>
          {!canClearDatabases && (
            <>
              <a
                className="text-fg-brand/80 hover:text-fg-brand focus:text-fg-brand"
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                Contact us on Discord for support
              </a>
              {eventId ? (
                <div className="text-tiny text-fg-tertiary mt-md">Error ID:&nbsp;{eventId}</div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-4">
        {canClearDatabases && (
          <Button fullWidth color="red" onClick={clearDatabases}>
            Clear local databases
          </Button>
        )}
        <Button fullWidth onClick={() => window.close()}>
          Close
        </Button>
      </div>
    </section>
  )
}
