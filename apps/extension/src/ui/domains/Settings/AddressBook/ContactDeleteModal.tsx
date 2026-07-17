import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, Modal, ModalDialog } from "taostats-ui"

import { api } from "@ui/api"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

import { ContactModalProps } from "./types"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Settings",
  featureVersion: 1,
  page: "Address book contact delete",
}

export const ContactDeleteModal = ({ contact, isOpen, close }: ContactModalProps) => {
  const { t } = useTranslation()
  useAnalyticsPageView(ANALYTICS_PAGE)

  const handleDelete = useCallback(async () => {
    close()
    if (contact) {
      await api.accountForget(contact.address)
      sendAnalyticsEvent({
        ...ANALYTICS_PAGE,
        name: "Interact",
        action: "Delete address book contact",
      })
    }
  }, [close, contact])

  return (
    <Modal isOpen={isOpen} onDismiss={close}>
      <ModalDialog className="!w-[400px]" onClose={close}>
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1 text-center">
            <img
              src="/images/address-book/delete.png"
              alt=""
              className="h-[128px] w-auto select-none object-contain"
            />
            <div className="flex flex-col gap-2">
              <h2 className="text-fg-primary text-xl font-semibold">{t("Remove Contact")}</h2>
              <p className="text-fg-tertiary text-sm">
                {t("Confirm to remove contact from address book")}
              </p>
            </div>
          </div>

          <Button
            fullWidth
            onClick={handleDelete}
            className="!bg-fg-error hover:!bg-fg-error/90 !border-0 !text-black shadow-none focus-visible:ring-0"
          >
            {t("Remove")}
          </Button>
        </div>
      </ModalDialog>
    </Modal>
  )
}
