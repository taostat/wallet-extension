import { ScaleApi } from "@taostats-wallet/sapi"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { SignerPayloadJSON } from "extension-core"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer } from "taostats-ui"

import { ScrollContainer } from "@taostats/components/ScrollContainer"

import { useSubSignDecodedBatchDrawer } from "./SubSignDecodedBatchDrawerContext"
import { SubSignDecodedCallContent } from "./SubSignDecodedCallContent"

export const SubSignDecodedBatchDrawer: FC<{ sapi: ScaleApi; payload: SignerPayloadJSON }> = ({
  sapi,
  payload,
}) => {
  const { t } = useTranslation()
  const {
    isOpen,
    currentCall,
    canGoNext,
    canGoPrev,
    goNext,
    goPrev,
    close,
    currentIndex,
    batchItemsCount,
  } = useSubSignDecodedBatchDrawer()

  return (
    <Drawer
      anchor="right"
      isOpen={isOpen && !!currentCall}
      containerId="main"
      onDismiss={close}
      className="bg-black-primary text-fg-secondary flex h-full w-full flex-col"
    >
      <div className="flex w-full items-center gap-2 p-4 px-6">
        <div className="text-fg-primary grow truncate tabular-nums">
          {t("Batch item {{currentIndex}} of {{batchItemsCount}}", {
            currentIndex: currentIndex + 1,
            batchItemsCount,
          })}
        </div>
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={goPrev}
          className="bg-secondary enabled:hover:bg-tertiary rounded-xs p-1 px-2 disabled:opacity-50"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={goNext}
          className="bg-secondary enabled:hover:bg-tertiary rounded-xs p-1 px-2 disabled:opacity-50"
        >
          <ChevronRight />
        </button>
      </div>
      <ScrollContainer className="grow px-6">
        {!!currentCall && (
          <SubSignDecodedCallContent decodedCall={currentCall} sapi={sapi} payload={payload} />
        )}
      </ScrollContainer>
      <div className="px-6 pb-5 pt-4">
        <Button fullWidth onClick={close}>
          {t("Close")}
        </Button>
      </div>
    </Drawer>
  )
}
