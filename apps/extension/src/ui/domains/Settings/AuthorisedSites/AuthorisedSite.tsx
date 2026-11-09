import { ProviderType } from "extension-core"
import { FC, useCallback, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button, Modal, ModalDialog, useOpenClose } from "taostats-ui"

import { Accordion, AccordionIcon } from "@taostats/components/Accordion"
import { Favicon } from "@taostats/components/Favicon"
import useAuthorisedSiteById from "@ui/hooks/useAuthorisedSiteById"

import { AuthorisedSiteAccount } from "./AuthorisedSiteAccount"

const Title: FC<{ name: string; domain: string }> = ({ name, domain }) => (
  <div className="flex items-center gap-1.5 text-base">
    <Favicon url={domain} className="text-[20px]" />
    <div className="ml-1">{name || domain}</div>
  </div>
)

const ConfirmForgetDialog: FC<{
  siteLabel: string
  onConfirm: () => void
  onCancel: () => void
}> = ({ siteLabel, onConfirm, onCancel }) => {
  const { t } = useTranslation()

  return (
    <div className="text-fg-secondary text-sm">
      <p className="text-sm">
        <Trans
          t={t}
          defaults="Confirm to forget <Highlight>{{siteLabel}}</Highlight>."
          components={{ Highlight: <span className="text-fg-primary" /> }}
          values={{ siteLabel }}
        />
      </p>
      <p className="mt-2 text-sm">
        {t("You can always reconnect to this site by visiting it in the future.")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Button type="button" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button primary onClick={onConfirm}>
          {t("Forget Site")}
        </Button>
      </div>
    </div>
  )
}

const Rule = () => <div className="mx-[1em] inline-block h-[1em] w-px bg-current"></div>

export const AuthorizedSite: FC<{
  id: string
  provider: ProviderType
}> = ({ id, provider }) => {
  const { t } = useTranslation()
  const { origin, connected, availableAddresses, toggleAll, toggleOne, forget } =
    useAuthorisedSiteById(id, provider)
  const [showForget, setShowForget] = useState(false)
  const hideForget = useCallback(() => setShowForget(false), [])
  const confirmForget = useCallback(() => {
    forget()
    setShowForget(false)
  }, [forget])

  const { toggle, isOpen } = useOpenClose()

  return (
    <div>
      <button
        type="button"
        className="text-fg-secondary hover:text-fg-primary bg-secondary hover:bg-secondary flex h-12 w-full items-center gap-1.5 rounded-sm px-4 text-left"
        onClick={toggle}
      >
        <div className="text-fg-primary">
          <Title name={origin} domain={id} />
        </div>
        <div className="text-fg-secondary grow">{origin === "" ? "" : id}</div>
        <div className="text-fg-brand mr-1.5 shrink-0 text-right">
          {t("{{connectedCount}} of {{totalCount}}", {
            connectedCount: connected?.length ?? 0,
            totalCount: availableAddresses?.length ?? 0,
          })}
        </div>
        <div className="text-lg">
          <AccordionIcon isOpen={isOpen} />
        </div>
      </button>
      <Accordion isOpen={isOpen}>
        <div className="mt-2 flex w-full flex-col gap-1 px-4">
          <div className="text-fg-disabled text-right text-xs">
            <button className="hover:text-fg-primary" onClick={() => setShowForget(true)}>
              {t("Forget Site")}
            </button>
            <Rule />
            <button className="hover:text-fg-primary" onClick={() => toggleAll(false)}>
              {t("Disconnect All")}
            </button>

            <Rule />
            <button className="hover:text-fg-primary" onClick={() => toggleAll(true)}>
              {t("Connect All")}
            </button>
          </div>
          {availableAddresses.map((address) => (
            <AuthorisedSiteAccount
              key={address}
              address={address}
              isConnected={connected.includes(address)}
              onChange={() => toggleOne(address)}
            />
          ))}
        </div>
      </Accordion>
      <Modal isOpen={showForget} onDismiss={hideForget}>
        <ModalDialog title={t("Forget Site")} onClose={hideForget}>
          <ConfirmForgetDialog
            siteLabel={origin ?? id}
            onConfirm={confirmForget}
            onCancel={hideForget}
          />
        </ModalDialog>
      </Modal>
    </div>
  )
}
