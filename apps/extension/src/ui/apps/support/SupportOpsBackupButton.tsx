import { Save01 } from "@untitledui/icons/Save01"
import { FC, useCallback } from "react"
import { Button, Modal, ModalDialog, useOpenClose } from "taostats-ui"

import downloadJson from "@taostats/util/downloadJson"

import { SupportOpsCtaButton } from "./shared/SupportOpsCtaButton"
import { TaostatsJsonBackup } from "./shared/types"

export const SupportOpsBackup = () => {
  const { isOpen, open, close } = useOpenClose()

  return (
    <>
      <SupportOpsCtaButton
        title="Backup"
        description="Export your Taostats data to a file"
        onClick={open}
      />

      <Modal isOpen={isOpen} onDismiss={close}>
        <BackupModalDialog onClose={close} />
      </Modal>
    </>
  )
}

const BackupModalDialog: FC<{ onClose: () => void }> = ({ onClose }) => {
  const handleSave = useCallback(async () => {
    await backupLocalStorage()
    onClose()
  }, [onClose])

  return (
    <ModalDialog title="Backup" className="w-[400px]" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-fg-secondary leading-paragraph">
          This will save all your Taostats data into a file, which you can use to restore your
          Taostats on another browser.
          <br />
          Make sure to store this file securely.
        </p>
        <div className="bg-orange-secondary/10 text-fg-orange flex items-center justify-center gap-4 rounded p-2.5 px-4 text-center text-sm">
          <p>
            <strong>DO NOT</strong> share your backup file with <strong>anyone</strong>.
            <br />
            The Taostats support team will <strong>never</strong> ask for it.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Button onClick={onClose}>Cancel</Button>
          <Button primary icon={Save01} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </ModalDialog>
  )
}

const backupLocalStorage = async () => {
  const backup: TaostatsJsonBackup = {
    isTaostatsBackup: true,
    version: process.env.VERSION!,
    timestamp: Date.now(),
    storage: await chrome.storage.local.get(),
  }

  downloadJson(backup, `backup.taostats.${backup.timestamp}`)
}
