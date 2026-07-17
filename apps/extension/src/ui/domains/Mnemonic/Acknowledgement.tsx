import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { EyeOff } from "@untitledui/icons/EyeOff"
import { Key01 } from "@untitledui/icons/Key01"
import { FC, SVGProps } from "react"
import { useTranslation } from "react-i18next"
import { Button, IconTile } from "taostats-ui"

const TipRow: FC<{ icon: FC<SVGProps<SVGSVGElement>>; children: string }> = ({
  icon,
  children,
}) => (
  <div className="gap-md flex items-start">
    <IconTile icon={icon} size="sm" />
    <p className="text-fg-secondary text-sm leading-snug">{children}</p>
  </div>
)

export const Acknowledgement = ({ onContinueClick }: { onContinueClick: () => void }) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="gap-xl flex flex-col items-center text-center">
        <img
          src="/images/recovery/backup-logo.png"
          alt=""
          className="h-[128px] w-auto select-none object-contain"
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-fg-primary text-xl font-semibold">{t("Protect Your Private Key")}</h2>
          <p className="text-fg-secondary text-sm">
            {t("Never pass the seed phrase from your wallet to anyone")}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-5">
        <TipRow icon={Key01}>
          {t(
            "Your Private Key is the key to your account — it grants full access, just like your password and login combined. Keep it secure.",
          )}
        </TipRow>
        <TipRow icon={EyeOff}>
          {t(
            "Anyone with access to this Private Key can control your funds. Taostats cannot recover your assets if it's lost or stolen.",
          )}
        </TipRow>
        <TipRow icon={AlertTriangle}>
          {t(
            "Never share your Private Key with anyone — including websites, apps, or individuals. Taostats will never ask for it.",
          )}
        </TipRow>
      </div>

      <Button
        fullWidth
        onClick={onContinueClick}
        data-testid="mnemonic-acknowledge-button"
        className="!bg-fg-brand hover:!bg-fg-brand/90 !border-0 !text-black shadow-none focus-visible:ring-0"
      >
        {t("Acknowledge & Continue")}
      </Button>
    </div>
  )
}
