import { ArrowRightIcon } from "@taostats-wallet/icons"
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "extension-shared"
import { useCallback, useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "taostats-ui"

import { TaostatsLogo } from "@taostats/theme/logos"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

import { useOnboard } from "../context"
import { OnboardLayout } from "../OnboardLayout"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Onboarding",
  featureVersion: 5,
  page: "Onboarding - Step 1 - Welcome",
}

const handleLinkClick = (action: string) => () => {
  sendAnalyticsEvent({
    ...ANALYTICS_PAGE,
    name: "GotoExternal",
    action,
    site: "Taostats Docs",
  })
}

export const WelcomePage = () => {
  const { t } = useTranslation()
  useAnalyticsPageView(ANALYTICS_PAGE)
  const { reset, setStage } = useOnboard()
  const navigate = useNavigate()

  const handleNextClick = useCallback(
    () => async () => {
      reset()
      sendAnalyticsEvent({
        ...ANALYTICS_PAGE,
        name: "Goto",
        action: "Onboarding Welcome -> Password",
      })
      navigate("/password")
    },
    [navigate, reset],
  )

  useEffect(() => {
    setStage(0)
  }, [setStage])

  return (
    <OnboardLayout analytics={ANALYTICS_PAGE} className="min-h-[60rem] min-w-[54rem]">
      <div className="my-[8rem] flex flex-col items-center justify-center gap-20">
        <div className="welcome-text flex select-none flex-col items-center gap-14 text-center xl:w-[76rem]">
          <div className="flex flex-col items-center gap-10 text-white xl:w-[65.2rem]">
            <LogoWithSupportPageRedirect />
          </div>
          <div className="welcome-subtitle text-[2rem] lg:text-[2.8rem]">
            {t("Taostats: The Bittensor Wallet")}
          </div>
        </div>
        <div className="welcome-button flex w-[44rem] flex-col gap-8">
          <Button
            primary
            icon={ArrowRightIcon}
            onClick={handleNextClick()}
            data-testid="onboarding-get-started-button"
          >
            {t("Get Started")}
          </Button>
          <div className="text-body-secondary text-center text-sm leading-[2rem]">
            <Trans t={t}>
              By continuing, you agree to the{" "}
              <a
                href={TERMS_OF_USE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-body"
                onClick={handleLinkClick("Terms of Service")}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-body"
                onClick={handleLinkClick("Privacy Policy")}
              >
                Privacy Policy
              </a>
            </Trans>
          </div>
        </div>
      </div>
    </OnboardLayout>
  )
}

const LogoWithSupportPageRedirect = () => {
  const [clickCount, setClickCount] = useState(0)

  const handleClick = useCallback(() => {
    if (clickCount === 9) window.location.href = "support.html"
    else setClickCount((prev) => prev + 1)
  }, [clickCount])

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={handleClick}>
      <TaostatsLogo className="h-auto w-96" />
    </div>
  )
}
