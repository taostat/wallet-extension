import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { TAOSTATS_WEB_APP_URL } from "extension-shared"
import { FC, useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { TaostatsLogo } from "@taostats/theme/logos"
import { api } from "@ui/api"

type PhishingPageProps = {
  url: string
}

export const PhishingPage: FC<PhishingPageProps> = ({ url }) => {
  const { t } = useTranslation()
  const allowSite = useCallback(async () => {
    await api.allowPhishingSite(url)
    window.location.replace(url)
  }, [url])

  const displayUrl = useMemo(() => {
    try {
      return new URL(url).origin
    } catch (err) {
      return url
    }
  }, [url])

  return (
    <div className="bg-tertiary max-h-screen">
      <div className="flex h-screen flex-col items-center justify-center">
        <TaostatsLogo className="my-16 h-16 w-4/12" />
        <div className="flex flex-grow items-center">
          <div className="scrollable scrollable-700 flex flex-col overflow-auto">
            <div className="bg-black-primary text-fg-secondary flex max-w-3xl flex-col items-center gap-16 self-center rounded-lg p-20 text-center">
              <AlertTriangle className="text-fg-orange inline-block text-[7.7rem]" />
              <h1 className="text-bold text-fg-orange m-0 text-xl">{t("Warning")}</h1>
              <div className="text-lg font-light text-white">
                <Trans t={t}>
                  <span className="block break-all">{displayUrl}</span> has been reported as a{" "}
                  <span className="text-fg-orange block">malicious site</span>
                </Trans>
              </div>
              <div className="leading-10">
                <Trans t={t}>
                  This domain has been reported as a known phishing site on a community maintained
                  list.
                </Trans>
              </div>
              <div className="w-full">
                <a href={TAOSTATS_WEB_APP_URL}>
                  <Button className="mb-6 w-full" primary>
                    {t("Get me out of here")}
                  </Button>
                </a>
                <button
                  type="button"
                  className="text-fg-disabled hover:text-fg-secondary cursor-pointer text-sm leading-8"
                  onClick={allowSite}
                >
                  {t("I trust this site")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
