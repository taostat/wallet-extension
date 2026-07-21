import { KnownRequestIdOnly } from "extension-core"
import { FC, useCallback, useEffect, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useParams, Navigate } from "react-router-dom"
import { Button } from "taostats-ui"

import { notify } from "@taostats/components/Notifications"
import { api } from "@ui/api"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useRequest } from "@ui/state"
import { closeWalletSurfaceAfterApproval } from "@ui/util/closeWalletSurface"
import { useCloseIfRequestMissing } from "@ui/util/useCloseIfRequestMissing"

import { PopupContent, PopupFooter, PopupHeader, PopupLayout } from "../Layout/PopupLayout"

export const Metadata: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation()
  const { id } = useParams<"id">() as KnownRequestIdOnly<"metadata">
  const metadataRequest = useRequest(id)
  const { popupOpenEvent } = useAnalytics()
  useEffect(() => {
    popupOpenEvent("metadata")
  }, [popupOpenEvent])

  useCloseIfRequestMissing(id)

  const approve = useCallback(async () => {
    if (!metadataRequest) return
    try {
      await api.approveMetaRequest(metadataRequest.id)
      void closeWalletSurfaceAfterApproval()
    } catch (err) {
      notify({ type: "error", title: "Failed to update", subtitle: (err as Error).message })
    }
  }, [metadataRequest])

  const reject = useCallback(() => {
    if (!metadataRequest) return
    void closeWalletSurfaceAfterApproval()
    api.rejectMetaRequest(metadataRequest.id)
  }, [metadataRequest])

  const displayUrl = useMemo(
    () =>
      metadataRequest?.url
        ? new URL(metadataRequest?.url || "").origin // use origin to keep the prefixed protocol
        : (metadataRequest?.url ?? ""),
    [metadataRequest?.url],
  )

  if (!metadataRequest) return <Navigate to="/portfolio" replace />

  const { request } = metadataRequest

  return (
    <PopupLayout className={className}>
      <PopupHeader>{t("Update Metadata")}</PopupHeader>
      <PopupContent>
        <div>
          <div className="px-2 text-center">
            <h1 className="my-4 text-lg">{t("Your metadata is out of date")}</h1>
            <p className="text-fg-secondary mt-8">
              <Trans t={t}>
                Approving this update will sync your metadata for the{" "}
                <span className="text-fg-primary">{request.chain}</span> chain
              </Trans>
              {displayUrl && (
                <>
                  {" "}
                  <Trans t={t}>
                    from <span className="text-fg-primary">{displayUrl}</span>
                  </Trans>
                </>
              )}
            </p>
          </div>
          <hr className="text-fg-disabled my-10" />
          <div className="text-left">
            <div className="ml-8 inline-grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-fg-secondary">{t("Symbol:")}</div>
              <div>{request.tokenSymbol}</div>
              <div className="text-fg-secondary">{t("Decimals:")}</div>
              <div>{request.tokenDecimals}</div>
            </div>
          </div>
        </div>
      </PopupContent>
      <PopupFooter>
        <div className="grid grid-cols-2 gap-6">
          <Button onClick={reject}>{t("Cancel")}</Button>
          <Button primary onClick={approve}>
            {t("Approve")}
          </Button>
        </div>
      </PopupFooter>
    </PopupLayout>
  )
}
