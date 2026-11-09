import { Loading01 } from "@untitledui/icons/Loading01"
import { useTranslation } from "react-i18next"

export const SignViewBodyShimmer = () => {
  const { t } = useTranslation()

  return (
    <div className="text-fg-secondary flex flex-col items-center gap-1 pt-32 leading-[140%]">
      <Loading01 className="animate-spin-slow h-8 w-8" />
      <div className="mt-2 text-base font-bold text-white opacity-70">
        {t("Analysing transaction")}
      </div>
      <div className="text-sm font-normal opacity-70">{t("This shouldn't take long...")}</div>
    </div>
  )
}
