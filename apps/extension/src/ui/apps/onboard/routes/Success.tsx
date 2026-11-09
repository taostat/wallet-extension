import { ArrowRight } from "@untitledui/icons/ArrowRight"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

import { AnalyticsPage } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

import { useOnboard } from "../context"
import { OnboardLayout } from "../OnboardLayout"

const SUCCESS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Onboarding",
  featureVersion: 5,
  page: "Onboarding - Step 5 - Success",
}

export const SuccessPage = () => {
  const { t } = useTranslation()
  useAnalyticsPageView(SUCCESS_PAGE)
  const { completeOnboarding } = useOnboard()

  return (
    <OnboardLayout analytics={SUCCESS_PAGE} className="min-h-[60rem] min-w-[54rem]">
      <div className="mb-[40rem] mt-10 flex w-full max-w-[72rem] flex-col items-center justify-start gap-7 px-8">
        <img
          src="/images/onboarding/onboarding-success.png"
          alt=""
          className="pointer-events-none h-auto w-full max-w-[25rem] select-none"
          draggable={false}
        />

        <h1 className="text-fg-primary -mt-[2rem] select-none text-center text-[54px] font-medium leading-[1.2] tracking-tight">
          {t("Welcome to", "Welcome to")}
          <br />
          {t("Taostats wallet!", "Taostats wallet!")}
        </h1>

        <div className="text-tertiary text-md text-center">
          {t("Your Taostats wallet is ready to use")}
        </div>

        <Button
          icon={ArrowRight}
          primary
          small
          onClick={completeOnboarding}
          data-testid="onboarding-enter-taostats-button"
          className="bg-fg-brand text-fg-primary-alt hover:bg-fg-brand/90 shadow-none"
        >
          {t("Enter")}
        </Button>
      </div>
    </OnboardLayout>
  )
}
