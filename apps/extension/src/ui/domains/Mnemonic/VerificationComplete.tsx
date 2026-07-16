import { ShieldSuccessIcon } from "@taostats-wallet/icons"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

export const VerificationComplete = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex-col gap-6">
        <div className="flex flex-col gap-2 rounded py-6">
          <div className="text-primary-700 flex flex-col items-center justify-center gap-4 self-stretch">
            <ShieldSuccessIcon className="h-10 w-8" />
            <span className="leading-paragraph text-center text-lg font-semibold">
              {t("Verification Successful")}
            </span>
          </div>
          <span className="text-fg-primary font-400 text-center leading-10">
            {t("Your recovery phrase has been verified.")}
          </span>
        </div>
      </div>
      <Button primary onClick={onComplete} fullWidth>
        {t("Done")}
      </Button>
    </>
  )
}
