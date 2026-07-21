import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Account, KnownRequestIdOnly, ProviderType } from "extension-core"
import capitalize from "lodash-es/capitalize"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useParams, Navigate } from "react-router-dom"
import { Button, Drawer } from "taostats-ui"

import { AppPill } from "@taostats/components/AppPill"
import { notify } from "@taostats/components/Notifications"
import { api } from "@ui/api"
import { ConnectAccountsContainer } from "@ui/domains/Site/ConnectAccountsContainer"
import { ConnectedAccountsPolkadot } from "@ui/domains/Site/ConnectedAccountsPolkadot"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useInjectableAccounts } from "@ui/hooks/useInjectableAccounts"
import { useRequest } from "@ui/state"
import { closeWalletSurface, closeWalletSurfaceAfterApproval } from "@ui/util/closeWalletSurface"
import { useCloseIfRequestMissing } from "@ui/util/useCloseIfRequestMissing"

import { PopupContent, PopupFooter, PopupHeader, PopupLayout } from "../Layout/PopupLayout"

const NoAccountWarning = ({
  onIgnoreClick,
  onAddAccountClick,
  type,
}: {
  type: ProviderType
  onIgnoreClick: () => void
  onAddAccountClick: () => void
}) => {
  const { t } = useTranslation()
  return (
    <Drawer isOpen anchor="bottom" containerId="main">
      <div className="bg-secondary flex flex-col gap-4 rounded-t-xl p-6">
        <div className="w-full text-center">
          <InfoCircle className="text-fg-brand inline-block text-[40px]" />
        </div>
        <p className="text-fg-secondary text-center">
          <Trans
            t={t}
            defaults="This application requires a<br/>Bittensor account to connect.<br/>Would you like to create or import one?"
            components={{ strong: <strong className="text-fg-primary" />, br: <br /> }}
            values={{ type: capitalize(type) }}
          />
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <Button onClick={onIgnoreClick}>{t("No")}</Button>
          <Button primary onClick={onAddAccountClick}>
            {t("Yes")}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

type ConnectComponent = FC<{
  siteUrl: string
  connected: string[]
  setConnected: (connected: string[]) => void
  onNoAccountClose: (navigateToAddAccount: boolean) => () => void
}>

export const Connect: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation()
  const { id } = useParams<"id">() as KnownRequestIdOnly<"auth">
  const authRequest = useRequest(id)
  const { popupOpenEvent } = useAnalytics()
  const [connected, setConnected] = useState<string[]>([])

  useCloseIfRequestMissing(id)

  const authorise = useCallback(async () => {
    if (!authRequest) return
    try {
      await api.authrequestApprove(authRequest.id, connected)
      void closeWalletSurfaceAfterApproval()
    } catch (err) {
      notify({ type: "error", title: t("Failed to connect"), subtitle: (err as Error).message })
    }
  }, [authRequest, connected, t])

  const reject = useCallback(() => {
    if (!authRequest) return
    void closeWalletSurfaceAfterApproval()
    api.authrequestReject(authRequest.id)
  }, [authRequest])

  const ignore = useCallback(() => {
    if (!authRequest) return
    void closeWalletSurfaceAfterApproval()
    api.authrequestIgnore(authRequest.id)
  }, [authRequest])

  useEffect(() => {
    popupOpenEvent("connect")
  }, [popupOpenEvent])

  const onNoAccountClose = useCallback(
    (navigateToAddAccount: boolean) => () => {
      if (navigateToAddAccount) {
        api.dashboardOpen("/accounts/add")
        ignore()
      } else reject()
      void closeWalletSurface()
    },
    [ignore, reject],
  )

  if (!authRequest) return <Navigate to="/portfolio" replace />

  const ConnectContentComponent: ConnectComponent = getConnectComponent(
    authRequest.request.provider,
  )

  return (
    <PopupLayout className={className}>
      <PopupHeader>
        <AppPill url={authRequest.url} />
      </PopupHeader>
      <ConnectContentComponent
        siteUrl={authRequest.url}
        connected={connected}
        setConnected={setConnected}
        onNoAccountClose={onNoAccountClose}
      />

      <PopupFooter>
        <div className="grid w-full grid-cols-2 gap-6">
          <Button onClick={reject} data-testid="connection-reject-button">
            {t("Reject")}
          </Button>
          <Button
            primary
            onClick={authorise}
            disabled={connected.length <= 0}
            data-testid="connection-connect-button"
          >
            {t("Connect")} {connected.length > 0 && connected.length}
          </Button>
        </div>
      </PopupFooter>
    </PopupLayout>
  )
}
const getConnectComponent = (provider: ProviderType): ConnectComponent => {
  switch (provider) {
    case "polkadot":
      return ConnectPolkadot
    default:
      throw new Error(`Unknown provider type: ${provider}`)
  }
}

export const ConnectPolkadot: ConnectComponent = ({
  siteUrl,
  connected,
  setConnected,
  onNoAccountClose,
}) => {
  const { t } = useTranslation()

  const accounts = useInjectableAccounts(siteUrl, "polkadot")

  const activeAccounts = useMemo(
    () => accounts.map((acc) => [acc, connected.includes(acc.address)] as [Account, boolean]),
    [accounts, connected],
  )

  return (
    <PopupContent>
      <section className="flex flex-col gap-2">
        <ConnectAccountsContainer
          status="disabled"
          connectedAddresses={connected}
          label={t("Polkadot")}
          infoText={t(`Choose which accounts you want to connect`)}
          isSingleProvider
        >
          <ConnectedAccountsPolkadot
            activeAccounts={activeAccounts}
            onUpdateAccounts={setConnected}
          />
        </ConnectAccountsContainer>
        {!accounts.length && (
          <NoAccountWarning
            type={"polkadot"}
            onIgnoreClick={onNoAccountClose(false)}
            onAddAccountClick={onNoAccountClose(true)}
          />
        )}
      </section>
    </PopupContent>
  )
}
