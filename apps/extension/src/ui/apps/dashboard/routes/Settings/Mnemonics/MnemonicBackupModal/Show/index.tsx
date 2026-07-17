import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { MnemonicUnlock } from "@ui/domains/Mnemonic/MnemonicUnlock"

import { Stages, useMnemonicBackupModal } from "../context"
import { MnemonicBackupModalBase } from "../MnemonicBackupModalBase"
import { Verify } from "./Verify"
import { ViewMnemonic } from "./View"

export const ShowMnemonic = () => {
  const { t } = useTranslation()
  const { mnemonic, stage, setStage } = useMnemonicBackupModal()
  const [isUnlocked, setIsUnlocked] = useState(false)

  const title = useMemo(() => {
    switch (stage) {
      case Stages.Verify:
        return t("Verify Recovery Phrase")
      case Stages.Show:
      default:
        return t("Backup Recovery Phrase")
    }
  }, [stage, t])

  const handleUnlocked = useCallback(() => setIsUnlocked(true), [])

  const widthClass =
    isUnlocked || stage === Stages.Verify ? "!w-[500px]" : "!w-[400px]"

  if (!mnemonic)
    return (
      <MnemonicBackupModalBase title={"Error"} className="!w-[400px]">
        {t("No mnemonic available")}
      </MnemonicBackupModalBase>
    )

  return (
    <MnemonicBackupModalBase title={title} className={widthClass}>
      <div className="grow">
        <MnemonicUnlock
          mnemonicId={mnemonic.id}
          buttonText={t("View Recovery Phrase")}
          onUnlocked={handleUnlocked}
          title={
            <span className="text-fg-secondary">
              {t("Enter your password to show your recovery phrase")}
            </span>
          }
        >
          {stage === Stages.Show && <ViewMnemonic handleComplete={() => setStage(Stages.Verify)} />}
          {stage === Stages.Verify && <Verify />}
        </MnemonicUnlock>
      </div>
    </MnemonicBackupModalBase>
  )
}
