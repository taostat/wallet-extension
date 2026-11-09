import { ArrowRight } from "@untitledui/icons/ArrowRight"
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "extension-shared"
import { useCallback, useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { BracketGlowWord, Button } from "taostats-ui"

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
      <div className="mb-[40rem] mt-0 flex w-full max-w-[72rem] flex-col items-center justify-start gap-4 px-8">
        <img
          src="/images/onboarding/onboarding-bg.png"
          alt=""
          className="pointer-events-none -mt-[4rem] h-auto w-full max-w-[70rem] select-none"
          draggable={false}
        />

        <h1 className="text-fg-primary -mt-[0.5rem] select-none text-center text-[2.8rem] font-medium leading-[1.2] tracking-tight lg:text-[3.6rem]">
          <BrandMark />
          <span>{t(" The", " The")}</span>
          <br />
          <span>{t("bittensor wallet", "bittensor wallet")}</span>
        </h1>

        <div className="flex flex-col items-center gap-[1.6rem]">
          <Button
            primary
            small
            icon={ArrowRight}
            onClick={handleNextClick()}
            data-testid="onboarding-get-started-button"
            className="bg-fg-brand text-fg-primary-alt hover:bg-fg-brand/90 shadow-none"
          >
            {t("Get Started")}
          </Button>
          <div className="text-fg-tertiary whitespace-nowrap text-center text-sm leading-[2rem]">
            <Trans t={t}>
              By continuing, you agree to the{" "}
              <a
                href={TERMS_OF_USE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-fg-secondary hover:text-fg-primary underline underline-offset-2 transition-colors"
                onClick={handleLinkClick("Terms of Service")}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-fg-secondary hover:text-fg-primary underline underline-offset-2 transition-colors"
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

/** Glowing [Taostats] brand mark; 10 clicks opens the support page. */
const BrandMark = () => {
  const [clickCount, setClickCount] = useState(0)

  const handleClick = useCallback(() => {
    if (clickCount === 9) window.location.href = "support.html"
    else setClickCount((prev) => prev + 1)
  }, [clickCount])

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <span onClick={handleClick} className="inline-flex cursor-default align-bottom">
      <BracketGlowWord className="text-[2.8rem] lg:text-[3.6rem]">Taostats:</BracketGlowWord>
    </span>
  )
}
