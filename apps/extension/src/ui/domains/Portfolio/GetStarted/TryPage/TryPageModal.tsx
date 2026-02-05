import { useTranslation } from "react-i18next"
import { Modal, ModalDialog } from "taostats-ui"

import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { AnalyticsPage } from "@ui/api/analytics"

import { TryPageContent } from "./TryPageContent"
import { useTryPageModal } from "./useTryPageModal"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Portfolio",
  featureVersion: 2,
  page: "Try Taostats Wallet",
}

export const TryPageModal = () => {
  const { t } = useTranslation()
  const { isOpen, close } = useTryPageModal()

  return (
    <Modal isOpen={isOpen} onDismiss={close} containerId="main">
      <ModalDialog
        centerTitle
        title={<>{t("Try Taostats Wallet")}</>}
        onClose={close}
        className="h-[60rem] w-[40rem]"
      >
        <ScrollContainer className="h-full w-full">
          <TryPageContent analytics={ANALYTICS_PAGE} />
        </ScrollContainer>
      </ModalDialog>
    </Modal>
  )
}
