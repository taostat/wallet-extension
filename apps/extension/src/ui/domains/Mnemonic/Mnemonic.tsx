import { classNames } from "@taostats-wallet/util"
import { Check } from "@untitledui/icons/Check"
import { Copy01 } from "@untitledui/icons/Copy01"
import { Eye } from "@untitledui/icons/Eye"
import { EyeOff } from "@untitledui/icons/EyeOff"
import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { notify } from "@taostats/components/Notifications"

/**
 * Props for the Mnemonic component
 */
type MnemonicProps = {
  /**
   * A function that is called when the mnemonic is revealed. Optional.
   */
  onReveal?: () => void
  /**
   * The mnemonic to be displayed.
   */
  mnemonic: string
}

type EyeIconTypes = "open" | "closed" | null

export const Mnemonic: FC<MnemonicProps> = ({ onReveal, mnemonic }) => {
  const { t } = useTranslation()
  const [isRevealed, setIsRevealed] = useState(false)
  const [blurOnHover, setBlurOnHover] = useState(false)
  const [iconType, setIconType] = useState<EyeIconTypes>("closed")

  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await window.navigator.clipboard.writeText(mnemonic)
      setIsCopied(true)
      notify({
        title: t("Copied to clipboard"),
        type: "success",
      })
    } catch (err) {
      notify({
        title: t("Failed to copy"),
        type: "error",
      })
    }
  }, [mnemonic, t])

  useEffect(() => {
    if (isRevealed) onReveal?.()
  }, [isRevealed, onReveal])

  useEffect(() => {
    if (!isCopied) return () => {}

    const timeout = setTimeout(() => {
      setIsCopied(false)
    }, 3000)

    return () => {
      clearTimeout(timeout)
    }
  }, [isCopied])

  return (
    <div className="w-full min-w-0">
      <div className="bg-secondary relative w-full overflow-hidden rounded p-1">
        <div className="grid min-h-[126px] grid-cols-4 gap-2 p-1">
          {!!mnemonic &&
            mnemonic.split(" ").map((word, i) => (
              <span
                className="bg-tertiary text-fg-primary min-w-0 truncate rounded p-2 text-xs"
                key={`mnemonic-${i}`}
              >
                <span className="text-fg-disabled select-none">{i + 1}. </span>
                <span className="notranslate">{word}</span>
              </span>
            ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsRevealed((isRevealed) => !isRevealed)
            setBlurOnHover(isRevealed)
            setIconType(isRevealed ? "open" : null)
          }}
          className={classNames(
            "text-fg-primary absolute inset-0 z-[1] flex items-center justify-center rounded-sm transition",
            !isRevealed && "backdrop-blur-md",
            blurOnHover && isRevealed && "hover:backdrop-blur-md",
          )}
          onMouseLeave={() => {
            if (isRevealed) {
              setBlurOnHover(true)
              setIconType(null)
            }
          }}
          onMouseOver={() => isRevealed && setIconType("closed")}
          onFocus={() => isRevealed && setIconType("closed")}
        >
          {iconType === "open" && <Eye className="text-xl" />}
          {iconType === "closed" && <EyeOff className="text-xl" />}
        </button>
      </div>
      <div className="flex items-center py-2 text-sm">
        <button
          type="button"
          onClick={handleCopy}
          className={"text-fg-secondary hover:text-fg-primary flex items-center"}
        >
          {isCopied ? (
            <>
              <Check className="text-fg-brand mr-1 inline" />
              <span className="text-fg-brand">{t("Copied")}</span>
            </>
          ) : (
            <>
              <Copy01 className="mr-1 inline" />
              <span>{t("Copy to clipboard")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
