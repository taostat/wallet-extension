import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

export const VerificationComplete = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src="/images/recovery/backup-logo.png"
          alt=""
          className="h-[128px] w-auto select-none object-contain"
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-fg-primary text-xl font-semibold">{t("Verification Successful")}</h2>
          <p className="text-fg-tertiary text-sm">{t("Your recovery phrase has been verified.")}</p>
        </div>
      </div>

      <Button
        fullWidth
        onClick={onComplete}
        className="!bg-fg-brand hover:!bg-fg-brand/90 !border-0 !text-black shadow-none focus-visible:ring-0"
      >
        {t("Done")}
      </Button>
    </div>
  )
}
