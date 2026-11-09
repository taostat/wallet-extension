import { detectAddressEncoding } from "@taostats-wallet/crypto"
import { classNames } from "@taostats-wallet/util"
import { Copy01 } from "@untitledui/icons/Copy01"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Edit01 } from "@untitledui/icons/Edit01"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { Plus } from "@untitledui/icons/Plus"
import { Trash01 } from "@untitledui/icons/Trash01"
import { UserPlus01 } from "@untitledui/icons/UserPlus01"
import { Suspense, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Button,
  ContextMenu,
  ContextMenuActionItem,
  ContextMenuContent,
  ContextMenuTrigger,
  getContainerClassName,
  PillButton,
} from "taostats-ui"

import { CopyAddressIconButton } from "@taostats/components/CopyAddressIconButton"
import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { useOpenClose } from "@taostats/hooks/useOpenClose"
import { AnalyticsPage } from "@ui/api/analytics"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { Address } from "@ui/domains/Account/Address"
import { useCopyAddressModal } from "@ui/domains/CopyAddress"
import { ContactCreateModal } from "@ui/domains/Settings/AddressBook/ContactCreateModal"
import { ContactDeleteModal } from "@ui/domains/Settings/AddressBook/ContactDeleteModal"
import { ContactEditModal } from "@ui/domains/Settings/AddressBook/ContactEditModal"
import { ExistingContactComponentProps } from "@ui/domains/Settings/AddressBook/types"
import { useViewOnExplorer } from "@ui/domains/ViewOnExplorer"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"
import { useBalances, useContacts, useNetworkByGenesisHash } from "@ui/state"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Settings",
  featureVersion: 1,
  page: "Address book contact list",
}

type ContactItemProps = ExistingContactComponentProps & {
  handleDelete: (address: string) => void
  handleEdit: (address: string) => void
}

const AddressBookContactItem = ({ contact, handleDelete, handleEdit }: ContactItemProps) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()
  const { open: openCopyAddressModal } = useCopyAddressModal()
  const contactChain = useNetworkByGenesisHash(contact.genesisHash)
  const { open: viewOnExplorer, canOpen: canViewOnExplorer } = useViewOnExplorer(
    contact.address,
    contact.genesisHash,
  )

  const handleViewOnExplorer = useCallback(() => {
    viewOnExplorer()
    genericEvent("open view on explorer", { from: "address book" })
  }, [genericEvent, viewOnExplorer])

  const handleCopyClick = useCallback(() => {
    openCopyAddressModal({
      networkId: contactChain?.id,
      address: contact.address,
    })
    genericEvent("open copy address", { from: "address book" })
  }, [contact.address, contactChain?.id, genericEvent, openCopyAddressModal])

  const isMultiAddress = useMemo(() => {
    try {
      const encoding = detectAddressEncoding(contact.address)
      // for substrate addresses, if not network specific we can't know which address format to display
      if (encoding === "ss58" && !contact.genesisHash) return true
      return false
    } catch {
      return false
    }
  }, [contact])

  const { containerClassName, contentClassName, titleClassName, subtitleClassName } =
    getContainerClassName("large")

  return (
    <div
      className={classNames(
        "border-primary bg-secondary-solid gap-md px-lg flex w-full items-center rounded-lg border",
        containerClassName,
      )}
    >
      <AccountIcon
        className="shrink-0 text-3xl"
        address={contact.address}
        genesisHash={contact.genesisHash}
      />
      <div className={classNames("flex grow flex-col items-start overflow-hidden", contentClassName)}>
        <div className={classNames("text-fg-primary truncate font-medium", titleClassName)}>
          {contact.name}
        </div>
        {isMultiAddress ? (
          <div className={classNames("text-fg-secondary font-mono", subtitleClassName)}>
            {t("Multichain address")}
          </div>
        ) : (
          <div
            className={classNames(
              "text-fg-secondary flex items-center gap-1 font-mono",
              subtitleClassName,
            )}
          >
            <Address address={contact.address} genesisHash={contact.genesisHash} />
            <CopyAddressIconButton address={contact.address} iconClassName="size-3.5" />
          </div>
        )}
      </div>
      <ContextMenu placement="bottom-end">
        <ContextMenuTrigger className="text-fg-secondary hover:text-fg-primary hover:bg-tertiary rounded p-2">
          <DotsHorizontal className="text-lg" />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <Suspense fallback={<SuspenseTracker name="AddressBookContactItem.ContextMenu" />}>
            <ContextMenuActionItem
              label={t("Edit contact")}
              icon={Edit01}
              onClick={() => handleEdit(contact.address)}
            />
            <ContextMenuActionItem
              label={t("Copy address")}
              icon={Copy01}
              onClick={handleCopyClick}
            />
            <ContextMenuActionItem
              label={t("View on Taostats")}
              icon={LinkExternal01}
              disabled={!canViewOnExplorer}
              onClick={handleViewOnExplorer}
            />
            <ContextMenuActionItem
              label={t("Delete contact")}
              icon={Trash01}
              destructive
              onClick={() => handleDelete(contact.address)}
            />
          </Suspense>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

const Content = () => {
  const { t } = useTranslation()
  // preload balances because of the send button
  useBalances("owned")

  const contacts = useContacts()
  const contactsMap = useMemo(
    () => Object.fromEntries(contacts.map((c) => [c.address, c])),
    [contacts],
  )
  const [toDelete, setToDelete] = useState<string>()
  const [toEdit, setToEdit] = useState<string>()
  const { open, isOpen, close } = useOpenClose()
  const contactsToDisplay = useMemo(
    () => contacts.concat().sort((a, b) => a.name.localeCompare(b.name)),
    [contacts],
  )

  useAnalyticsPageView(ANALYTICS_PAGE)

  return (
    <>
      <HeaderBlock title={t("Address Book")} text={t("Manage your saved contacts")} />
      <Spacer large />
      <div className="flex justify-end align-middle">
        {contactsToDisplay.length > 0 && (
          <PillButton onClick={open} icon={UserPlus01}>
            {t("Add new contact")}
          </PillButton>
        )}
      </div>
      <Spacer small />
      <div className="flex flex-col gap-2">
        {contactsToDisplay.map((contact) => (
          <AddressBookContactItem
            contact={contact}
            key={contact.address}
            handleDelete={setToDelete}
            handleEdit={setToEdit}
          />
        ))}
        {contactsToDisplay.length === 0 && (
          <div className="border-primary bg-secondary-solid text-fg-secondary flex h-[160px] w-full flex-col items-center justify-center gap-6 rounded-lg border px-8 py-4">
            <span>{t("You have no saved contacts yet.")}</span>
            <Button
              onClick={open}
              iconLeft={Plus}
              className="!border-0 !bg-fg-brand shadow-none hover:!bg-fg-brand/90 !text-black focus-visible:ring-0"
            >
              {t("Add a contact")}
            </Button>
          </div>
        )}
      </div>

      {toDelete && (
        <ContactDeleteModal
          isOpen={!!toDelete}
          close={() => setToDelete(undefined)}
          contact={contactsMap[toDelete]}
        />
      )}
      {toEdit && (
        <ContactEditModal
          isOpen={!!toEdit}
          close={() => setToEdit(undefined)}
          contact={contactsMap[toEdit]}
        />
      )}
      <ContactCreateModal isOpen={isOpen} close={close} />
    </>
  )
}

export const AddressBookPage = () => <Content />
