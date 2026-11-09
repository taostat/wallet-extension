import { classNames } from "@taostats-wallet/util"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Account } from "extension-core"
import { FC, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useOpenClose } from "taostats-ui"

import { Accordion, AccordionIcon } from "@taostats/components/Accordion"
import { AccountsStack } from "@ui/domains/Account/AccountIconsStack"
import { useAccounts } from "@ui/state"

import { FormattedAddress } from "../Account/FormattedAddress"
import { ConnectedSiteIndicator } from "./ConnectedSiteIndicator"
import { SiteConnectionStatus } from "./types"

const ConnectionStatusContainer: FC<{
  status: SiteConnectionStatus
  className?: string
  children: ReactNode
}> = ({ status, className, children }) => {
  const colors = useMemo(() => {
    switch (status) {
      case "connected":
        return "bg-fg-brand"
      case "disconnected":
        return "bg-accent-2"
      case "disabled":
        return "bg-secondary"
    }
  }, [status])

  return (
    <div className={classNames("rounded-sm p-px", colors)}>
      <div className={classNames("overflow-hidden rounded-sm", className)}>{children}</div>
    </div>
  )
}

const ConnectedAccountsSummary: FC<{ connectedAccounts: Account[] }> = ({ connectedAccounts }) => {
  const { t } = useTranslation()
  return (
    <>
      {connectedAccounts.length > 1 && (
        <div className="flex items-center gap-1">
          <AccountsStack accounts={connectedAccounts} />
          <div className="text-fg-primary text-xs">
            {t("{{count}} connected", { count: connectedAccounts.length })}
          </div>
        </div>
      )}
      {connectedAccounts.length === 1 && (
        <FormattedAddress
          className="text-fg-primary text-xs"
          address={connectedAccounts[0].address}
          noTooltip
        />
      )}
      {!connectedAccounts.length && (
        <div className="text-fg-disabled text-xs">{t("Not connected")}</div>
      )}
    </>
  )
}

const ConnectAccountsExpandedContainer: FC<{
  label: string
  status: SiteConnectionStatus
  connectedAddresses: string[]
  infoText: string
  children: ReactNode
}> = ({ label, status, connectedAddresses, infoText, children }) => {
  const accounts = useAccounts()

  const connectedAccounts = useMemo(() => {
    return accounts.filter((account) => connectedAddresses.includes(account.address))
  }, [accounts, connectedAddresses])

  return (
    <ConnectionStatusContainer status={status} className="bg-black">
      <div className="bg-app-bg px-3 py-1.5">
        <div className="flex flex-col">
          <div className="border-primary border-b pb-1.5">
            <div className="text-fg-secondary hover:text-fg-primary flex w-full py-1">
              <div className="flex w-6 shrink-0">
                <ConnectedSiteIndicator status={status} />
              </div>
              <div className="text-fg-primary grow">{label}</div>
              {status !== "disabled" && (
                <ConnectedAccountsSummary connectedAccounts={connectedAccounts} />
              )}
            </div>
          </div>
          <span className="text-fg-disabled flex items-center gap-0.5 pt-1.5 text-xs">
            <InfoCircle />
            <span>{infoText}</span>
          </span>
        </div>
      </div>
      <div>{children}</div>
    </ConnectionStatusContainer>
  )
}

const ConnectAccountsAccordionContainer: FC<{
  label: string
  status: SiteConnectionStatus
  connectedAddresses: string[]
  infoText: string
  children: ReactNode
}> = ({ label, status, connectedAddresses, infoText, children }) => {
  const { isOpen, toggle } = useOpenClose()
  const accounts = useAccounts()

  const connectedAccounts = useMemo(() => {
    return accounts.filter((account) => connectedAddresses.includes(account.address))
  }, [accounts, connectedAddresses])

  return (
    <ConnectionStatusContainer status={status} className="bg-black">
      <button type="button" onClick={toggle} className="bg-app-bg w-full px-3 py-1.5">
        <div className="flex flex-col">
          <div className={"border-primary border-b pb-1.5"}>
            <div className="flex w-full gap-3 py-1">
              <div className="flex grow items-center gap-1.5 text-left">
                <ConnectedSiteIndicator status={status} />
                <div className="text-fg-primary">{label}</div>
              </div>
              {status !== "disabled" && (
                <ConnectedAccountsSummary connectedAccounts={connectedAccounts} />
              )}
              <AccordionIcon isOpen={isOpen} />
            </div>
          </div>
          <span className="text-fg-disabled flex items-center gap-0.5 pt-1.5 text-xs">
            <InfoCircle />
            <span>{infoText}</span>
          </span>
        </div>
      </button>
      <Accordion isOpen={isOpen}>{children}</Accordion>
    </ConnectionStatusContainer>
  )
}

export const ConnectAccountsContainer: FC<{
  label: string
  status: SiteConnectionStatus
  connectedAddresses: string[]
  isSingleProvider?: boolean
  infoText: string
  children: ReactNode
}> = ({ label, status, connectedAddresses, infoText, children, isSingleProvider }) => {
  const Container = isSingleProvider
    ? ConnectAccountsExpandedContainer
    : ConnectAccountsAccordionContainer

  return (
    <Container
      label={label}
      status={status}
      connectedAddresses={connectedAddresses}
      infoText={infoText}
    >
      {children}
    </Container>
  )
}
