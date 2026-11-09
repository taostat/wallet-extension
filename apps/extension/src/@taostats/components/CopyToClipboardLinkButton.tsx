import { cn } from "@taostats-wallet/util"
import { Check } from "@untitledui/icons/Check"
import { Copy01 } from "@untitledui/icons/Copy01"
import { FC, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

export const CopyToClipboardLinkButton: FC<{ data: string; className?: string }> = ({
  data,
  className,
}) => {
  const { t } = useTranslation()
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(data).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }, [data])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn("text-fg-secondary hover:text-fg-primary inline-flex items-center", className)}
    >
      {isCopied ? (
        <>
          <Check className="text-fg-brand mr-xxs inline" />
          <span className="text-fg-brand">{t("Copied successfully")}</span>
        </>
      ) : (
        <>
          <Copy01 className="mr-1 inline" />
          <span>{t("Copy to clipboard")}</span>
        </>
      )}
    </button>
  )
}
