import { ArrowRightIcon, LockIcon, ShieldIcon, XIcon } from "@taostats-wallet/icons"
import { cn } from "@taostats-wallet/util"
import { useTranslation } from "react-i18next"
import { Button } from "taostats-ui"

export const Acknowledgement = ({ onContinueClick }: { onContinueClick: () => void }) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-4 flex flex-col gap-16">
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-6">
            <IconContainer Icon={LockIcon} />
            <span>
              {t(
                "Protect your recovery phrase. Anyone who has it can access your wallet and funds.",
              )}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <IconContainer Icon={ShieldIcon} />
            <span>{t("Write down your recovery phrase and store it in a secure location.")}</span>
          </div>
          <div className="flex items-center gap-6">
            <IconContainer Icon={XIcon} className="bg-[#FD48481A] text-red-500" />
            <span className="text-red-500">
              {t("If you lose your recovery phrase, you will lose access to your funds.")}
            </span>
          </div>
        </div>
        <Button
          primary
          onClick={onContinueClick}
          data-testid="mnemonic-acknowledge-button"
          icon={ArrowRightIcon}
        >
          {t("Acknowledge and Continue")}
        </Button>
      </div>
    </div>
  )
}

const IconContainer = ({
  Icon,
  className,
}: {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  className?: string
}) => {
  return (
    <span
      className={cn(
        "text-primary-700 flex h-20 items-center rounded-2xl bg-[#D5FF5C1A] p-6",
        className,
      )}
    >
      <Icon className="h-10 w-10" />
    </span>
  )
}
