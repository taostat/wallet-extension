import { detectAddressEncoding } from "@taostats-wallet/crypto"
import { classNames } from "@taostats-wallet/util"
import { Copy01 } from "@untitledui/icons/Copy01"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Plus } from "@untitledui/icons/Plus"
import { UserPlus01 } from "@untitledui/icons/UserPlus01"
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  forwardRef,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  PillButton,
} from "taostats-ui"

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

const SquareButton = forwardRef<
  HTMLButtonElement,
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
>((props, ref) => (
  <button
    {...props}
    type="button"
    ref={ref}
    className={classNames(
      "enabled:hover:bg-tertiary enabled:hover:text-fg-secondary flex h-[32px] w-[32px] items-center justify-center rounded-sm enabled:cursor-pointer disabled:cursor-not-allowed",
      props.className,
    )}
  ></button>
))
SquareButton.displayName = "SquareButton"

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

  return (
    <div className="bg-secondary group flex h-16 w-full items-center justify-between gap-2 rounded px-4">
      <AccountIcon
        className="text-xl"
        address={contact.address}
        genesisHash={contact.genesisHash}
      />
      <div className="flex grow flex-col justify-between overflow-hidden">
        <div className="truncate">{contact.name}</div>
        <div>
          {isMultiAddress ? (
            <div className="text-fg-secondary text-xs">{t("Multichain address")}</div>
          ) : (
            <Address
              className="text-fg-secondary text-xs"
              address={contact.address}
              genesisHash={contact.genesisHash}
            />
          )}
        </div>
      </div>
      <div className={`text-fg-disabled flex shrink-0 gap-1`}>
        <SquareButton onClick={handleCopyClick}>
          <Copy01 />
        </SquareButton>
        <ContextMenu placement="bottom-end">
          <ContextMenuTrigger asChild>
            <SquareButton>
              <DotsHorizontal />
            </SquareButton>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <Suspense fallback={<SuspenseTracker name="AddressBookContactItem.ContextMenu" />}>
              <ContextMenuItem onClick={() => handleEdit(contact.address)}>
                {t("Edit contact")}
              </ContextMenuItem>
              <ContextMenuItem onClick={handleCopyClick}>{t("Copy address")}</ContextMenuItem>
              <ContextMenuItem
                disabled={!canViewOnExplorer}
                onClick={handleViewOnExplorer}
                className="disabled:!text-fg-disabled disabled:!cursor-not-allowed disabled:!bg-transparent"
              >
                {t("View on Taostats")}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleDelete(contact.address)}>
                {t("Delete contact")}
              </ContextMenuItem>
            </Suspense>
          </ContextMenuContent>
        </ContextMenu>
      </div>
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
      <div className="flex flex-col gap-1.5">
        {contactsToDisplay.map((contact) => (
          <AddressBookContactItem
            contact={contact}
            key={contact.address}
            handleDelete={setToDelete}
            handleEdit={setToEdit}
          />
        ))}
        {contactsToDisplay.length === 0 && (
          <div className="bg-secondary text-fg-secondary flex h-[160px] w-full flex-col items-center justify-center gap-6 rounded px-8 py-4">
            <span>{t("You have no saved contacts yet.")}</span>
            <Button primary onClick={open} iconLeft={Plus}>
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
