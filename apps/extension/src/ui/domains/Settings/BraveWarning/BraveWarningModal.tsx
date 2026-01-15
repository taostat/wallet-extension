import imgBraveFlag from "@taostats/theme/images/brave_flag.gif"
import { appStore } from "extension-core"
import { FC, useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button, Toggle } from "taostats-ui"

type BraveWarningModalProps = {
  className?: string
  popup?: boolean
}

export const BraveWarningModal: FC<BraveWarningModalProps> = () => {
  const { t } = useTranslation()
  const [hideBraveWarning, setHideBraveWarning] = useState<boolean>()
  const [hasBraveWarningBeenShown, setHasBraveWarningBeenShown] = useState<boolean>()

  useEffect(() => {
    if (!hasBraveWarningBeenShown) appStore.set({ hasBraveWarningBeenShown: true })
  }, [hasBraveWarningBeenShown])

  useEffect(() => {
    const sub = appStore.observable.subscribe((settings) => {
      setHideBraveWarning(settings.hideBraveWarning)
      setHasBraveWarningBeenShown(settings.hasBraveWarningBeenShown)
    })
    return () => sub.unsubscribe()
  }, [])

  return (
    <div className="text-body-secondary flex w-full flex-col gap-8">
      <p className="text-body-secondary [&>strong]:text-body px-8 text-xs">
        <Trans t={t}>
          Brave limits the amount of networks extensions can connect to. In order to view all your
          balances please disable the <strong>Restrict WebSockets Pool</strong> flag and restart
          Brave.
        </Trans>
      </p>
      <div>
        <img src={imgBraveFlag} alt="brave flag setting" />
      </div>
      <Button
        primary
        onClick={() =>
          chrome.tabs.create({
            url: "brave://flags/#restrict-websockets-pool",
            active: true,
          })
        }
      >
        {t("Open Brave flags")}
      </Button>
      <div className="text-body-secondary flex w-full items-center justify-center gap-4 text-sm">
        <div>{t("Don't ask again")}</div>
        <Toggle
          checked={hideBraveWarning}
          onChange={(e) => appStore.set({ hideBraveWarning: e.target.checked })}
        />
      </div>
    </div>
  )
}
