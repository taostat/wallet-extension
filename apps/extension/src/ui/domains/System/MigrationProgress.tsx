import { classNames } from "@taostats-wallet/util"
import { Home01 } from "@untitledui/icons/Home01"
import { appStore } from "extension-core"
import { DISCORD_URL } from "extension-shared"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { useAppState } from "@ui/state"
import { IS_POPUP } from "@ui/util/constants"

export const MigrationProgress = () => {
  const { t } = useTranslation()

  const [migration] = useAppState("currentMigration")
  if (!migration) return null

  return (
    <div
      className={classNames(
        // displayed as the only content of the page, while a migration is running.
        !IS_POPUP && "flex h-screen w-screen flex-col items-center justify-center",
      )}
    >
      <div className="animate-fade-in-slow flex h-[600px] w-[400px] flex-col items-center justify-between overflow-hidden p-4">
        <div className="flex h-[268px] flex-col items-center justify-center gap-12 pt-2">
          <Home01
            className={classNames("h-24 w-24", !migration.errors?.length && "animate-pulse")}
          />
          <div className={classNames("text-lg font-bold")}>
            {migration.errors?.length ? t("Taostats update failed") : t("Taostats update")}
          </div>
        </div>
        <div className="flex h-[268px] max-h-[268px] w-full flex-col items-center justify-center gap-6">
          {migration.errors?.length ? (
            <div className="leading-paragraph flex h-full w-full flex-col gap-4">
              <div className="text-fg-secondary">
                <Trans
                  t={t}
                  defaults="If you need assistance, contact us on Discord at <Link />"
                  values={migration}
                  components={{
                    Link: (
                      <a className="text-fg-primary underline" href={DISCORD_URL}>
                        {DISCORD_URL}
                      </a>
                    ),
                  }}
                ></Trans>
              </div>
              <ul className="text-fg-orange grow overflow-scroll pl-4">
                {migration.errors.map((err, idx) => (
                  <li key={idx} className="list-disc">
                    {migration.name}: {String(err)}
                  </li>
                ))}
              </ul>
              <Button
                className="shrink-0"
                onClick={() => {
                  appStore.delete("currentMigration")
                }}
              >
                {t("Continue anyway")}
              </Button>
            </div>
          ) : migration.acknowledgeRequest ? (
            <div className="flex grow flex-col">
              <p className="text-fg-secondary mt-2 grow text-center text-base">
                {migration.acknowledgeRequest}
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  appStore.set({ currentMigration: { ...migration, acknowledged: true } })
                }}
              >
                {t("Continue")}
              </Button>
            </div>
          ) : (
            <p className="text-fg-secondary mt-2 text-center text-base">
              <span>{t("Progress:")}</span>{" "}
              <span className="tabular-nums">{(100 * (migration.progress ?? 0)).toFixed(0)}%</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
