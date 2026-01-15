import { ArrowRightIcon } from "@taostats-wallet/icons"
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
    <OnboardLayout analytics={SUCCESS_PAGE} className="min-h-[48rem] min-w-[59rem]">
      <div className="flex w-[36.9rem] flex-col items-center justify-center gap-12 p-12">
        <div className="whitespace-nowrap text-center text-lg">
          {t("Welcome to Taostats wallet!")}
        </div>
        <div className="text-body-secondary text-center">
          {t("Your Taostats wallet is ready to use")} 🎉
        </div>
        <Button
          icon={ArrowRightIcon}
          primary
          onClick={completeOnboarding}
          data-testid="onboarding-enter-talisman-button"
        >
          {t("Enter")}
        </Button>
      </div>
    </OnboardLayout>
  )
}
