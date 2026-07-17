import { PolkadotVaultIcon, SecretIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { CornerDownRight } from "@untitledui/icons/CornerDownRight"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Download01 } from "@untitledui/icons/Download01"
import { Edit01 } from "@untitledui/icons/Edit01"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Trash01 } from "@untitledui/icons/Trash01"
import { AccountOfType, getAccountGenesisHash, isAccountOfType, Mnemonic } from "extension-core"
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ContextMenu,
  ContextMenuActionItem,
  ContextMenuContent,
  ContextMenuTrigger,
  getContainerClassName,
  IconTile,
} from "taostats-ui"

import { Accordion, AccordionIcon } from "@taostats/components/Accordion"
import { CopyAddressIconButton } from "@taostats/components/CopyAddressIconButton"
import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { useOpenClose } from "@taostats/hooks/useOpenClose"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { AccountsStack } from "@ui/domains/Account/AccountIconsStack"
import { Address } from "@ui/domains/Account/Address"
import { useAccounts, useMnemonics } from "@ui/state"

import { MnemonicBackupModalProvider, useMnemonicBackupModal } from "./MnemonicBackupModal"
import {
  MnemonicDeleteModal,
  MnemonicDeleteModalProvider,
  useMnemonicDeleteModal,
} from "./MnemonicDeleteModal"
import {
  MnemonicRenameModal,
  MnemonicRenameModalProvider,
  useMnemonicRenameModal,
} from "./MnemonicRenameModal"
import {
  MnemonicSetPvVerifierModal,
  MnemonicSetPvVerifierModalProvider,
  useMnemonicSetPvVerifierModal,
} from "./MnemonicSetPvVerifierModal"

const NoMnemonicMessage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleAddAccountClick = useCallback(() => {
    navigate("/accounts/add")
  }, [navigate])

  return (
    <div className="text-fg-secondary bg-secondary flex items-center gap-3 rounded p-3 text-base">
      <InfoCircle className="shrink-0 text-lg" />
      <div>
        <Trans
          t={t}
          components={{
            Link: (
              <button
                type="button"
                onClick={handleAddAccountClick}
                className="hover:text-fg-tertiary text-fg-tertiary inline"
              ></button>
            ),
          }}
          defaults="Your recovery phrases will be displayed here after adding accounts. <Link>Add an account</Link>"
        />
      </div>
    </div>
  )
}

const useMnemonicAccounts = (mnemonicId: string) => {
  const accounts = useAccounts("owned")

  return useMemo(
    () =>
      accounts
        .filter((acc) => isAccountOfType(acc, "keypair"))
        .filter((account) => account.mnemonicId === mnemonicId)
        .sort((a1, a2) => (a1.derivationPath ?? "")?.localeCompare(a2.derivationPath ?? "")),
    [accounts, mnemonicId],
  )
}

const AccountRow: FC<{ account: AccountOfType<"keypair"> }> = ({ account }) => (
  <div className="text-fg-secondary bg-app-bg mt-2 flex h-[48px] w-full items-center gap-3 overflow-hidden rounded-sm px-4">
    <AccountIcon
      className="text-lg"
      address={account.address}
      genesisHash={getAccountGenesisHash(account)}
    />
    <div className="flex grow flex-col gap-0.5 overflow-hidden">
      <div className="text-fg-primary max-w-full truncate text-sm">{account.name}</div>
      <div className="text-fg-secondary flex items-center gap-1 text-xs">
        <Address address={account.address} startCharCount={6} endCharCount={6} />
        <CopyAddressIconButton address={account.address} iconClassName="size-3.5" />
      </div>
    </div>
    <div className="text-fg-secondary flex flex-col font-mono text-xs">
      {account.derivationPath}
    </div>
  </div>
)

const MnemonicRow: FC<{ mnemonic: Mnemonic }> = ({ mnemonic }) => {
  const { t } = useTranslation()
  const { isOpen, toggle } = useOpenClose()
  const { open: openRename } = useMnemonicRenameModal()
  const { isVerifier } = useMnemonicSetPvVerifierModal()
  const { open: openDelete, canDelete } = useMnemonicDeleteModal()
  const { open: openBackup } = useMnemonicBackupModal()
  const refActions = useRef<HTMLDivElement>(null)

  const [actionsWidth, setActionsWidth] = useState<number>()
  const actionsStyle = useMemo(() => ({ width: actionsWidth }), [actionsWidth])

  useLayoutEffect(() => {
    setActionsWidth(refActions.current?.clientWidth)
  }, [])

  const accounts = useMnemonicAccounts(mnemonic.id)

  const handleRenameClick = useCallback(() => {
    openRename(mnemonic.id)
  }, [mnemonic.id, openRename])

  const handleDeleteClick = useCallback(() => {
    openDelete(mnemonic.id)
  }, [mnemonic.id, openDelete])

  const handleBackupClick = useCallback(() => {
    openBackup(mnemonic.id)
  }, [mnemonic.id, openBackup])

  const { containerClassName, contentClassName, titleClassName, subtitleClassName, iconTileSize } =
    getContainerClassName("large")

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={toggle}
          className={classNames(
            "border-primary gap-md px-lg flex w-full items-center rounded-lg border text-left",
            containerClassName,
            mnemonic.confirmed
              ? "bg-secondary-solid text-fg-secondary hover:bg-tertiary/50"
              : "bg-orange-secondary/5 hover:bg-orange-secondary/10 text-fg-secondary",
          )}
        >
          <IconTile icon={SecretIcon} size={iconTileSize} />
          <div
            className={classNames(
              "flex grow flex-col items-start overflow-hidden",
              contentClassName,
            )}
          >
            <div className="flex max-w-full items-center gap-1">
              <div className={classNames("text-fg-primary truncate font-medium", titleClassName)}>
                {mnemonic.name}
              </div>
              {isVerifier(mnemonic.id) && <PolkadotVaultIcon className="text-fg-brand shrink-0" />}
            </div>
            <div
              className={classNames(
                "text-fg-secondary flex items-center gap-1",
                subtitleClassName,
              )}
            >
              <AccountsStack accounts={accounts} />
              <div>{t("used by {{count}} accounts", { count: accounts.length })}</div>
            </div>
          </div>

          {/* reserved space for the context menu button */}
          <div style={actionsStyle} className="h-9 shrink-0" />
          <AccordionIcon isOpen={isOpen} className="text-fg-tertiary shrink-0 text-lg" />
        </button>
        <div
          ref={refActions}
          className="absolute inset-y-0 right-12 flex flex-col justify-center"
        >
          <div className="relative flex items-center gap-3">
            {!mnemonic.confirmed && (
              <button
                type="button"
                onClick={handleBackupClick}
                className="bg-orange-secondary/5 hover:bg-orange-secondary/10 text-fg-orange flex h-[30px] items-center gap-[0.5em] rounded-[20px] border px-3 text-sm"
              >
                <span>{t("Backup")}</span>
                <AlertCircle className="inline-block text-base" />
              </button>
            )}
            <ContextMenu placement="bottom-end">
              <ContextMenuTrigger className="hover:bg-secondary active:hover:bg-secondary hover:text-fg-primary text-fg-secondary rounded p-1">
                <DotsHorizontal className="text-lg" />
              </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuActionItem label={t("Rename")} icon={Edit01} onClick={handleRenameClick} />
              <ContextMenuActionItem
                label={t("Backup")}
                icon={mnemonic.confirmed ? Download01 : AlertCircle}
                onClick={handleBackupClick}
              />
              <ContextMenuActionItem
                label={t("Delete")}
                icon={Trash01}
                destructive
                disabled={!canDelete(mnemonic.id)}
                onClick={handleDeleteClick}
              />
            </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>
      </div>
      <Accordion isOpen={isOpen}>
        <div className="relative pl-[60px]">
          {!accounts.length && (
            <div className="text-fg-secondary bg-app-bg mt-2 flex h-[48px] items-center gap-3 rounded-sm px-4 text-sm">
              <InfoCircle className="text-md" />{" "}
              {t("There are no accounts derived from this recovery phrase")}
            </div>
          )}
          {accounts.map((account) => (
            <AccountRow key={account.address} account={account} />
          ))}
          <CornerDownRight className="text-fg-disabled absolute left-6 top-3 text-lg" />
        </div>
      </Accordion>
    </div>
  )
}

const BackupReminder: FC = () => {
  const { t } = useTranslation()
  const mnemonics = useMnemonics()

  const count = useMemo(
    () => mnemonics.filter((mnemonic) => !mnemonic.confirmed).length,
    [mnemonics],
  )

  if (!count) return null

  return (
    <div
      className={classNames(
        "border-primary mb-4 flex w-full items-center gap-2 rounded-sm border p-2",
      )}
    >
      <div className="bg-fg-brand/10 rounded-full p-1.5">
        <AlertCircle className="text-fg-brand text-sm" />
      </div>
      <div className="grow text-sm">
        {t("{{count}} recovery phrase(s) have not been backed up yet.", { count })}
      </div>
    </div>
  )
}

const MnemonicsList = () => {
  const mnemonics = useMnemonics()

  const sortedMnemonics = useMemo(
    () => [...mnemonics].sort((m1, m2) => m1.name.localeCompare(m2.name)),
    [mnemonics],
  )

  const notBackedUp = useMemo(
    () => mnemonics.filter((mnemonic) => !mnemonic.confirmed),
    [mnemonics],
  )
  const { open: openBackup } = useMnemonicBackupModal()
  const [searchParams, updateSearchParams] = useSearchParams()

  useEffect(() => {
    const showBackupModal = searchParams.has("showBackupModal")
    if (showBackupModal) {
      searchParams.delete("showBackupModal")
      updateSearchParams(searchParams, { replace: true })
      if (notBackedUp.length === 1) {
        // open the backup modal for the only mnemonic that is not backed up
        openBackup(notBackedUp[0].id)
      }
    }
  }, [searchParams, notBackedUp, openBackup, updateSearchParams])

  if (!mnemonics.length) return <NoMnemonicMessage />

  return (
    <div className="flex flex-col gap-2">
      {sortedMnemonics.map((mnemonic) => (
        <MnemonicRow key={mnemonic.id} mnemonic={mnemonic} />
      ))}
    </div>
  )
}

const Content = () => {
  const { t } = useTranslation()

  return (
    <MnemonicRenameModalProvider>
      <MnemonicDeleteModalProvider>
        <MnemonicSetPvVerifierModalProvider>
          <MnemonicBackupModalProvider>
            <HeaderBlock
              title={t("Recovery Phrases")}
              text={t("Manage and backup your recovery phrases")}
            />
            <Spacer large />
            <BackupReminder />
            <MnemonicsList />
            <MnemonicDeleteModal />
            <MnemonicRenameModal />
            <MnemonicSetPvVerifierModal />
          </MnemonicBackupModalProvider>
        </MnemonicSetPvVerifierModalProvider>
      </MnemonicDeleteModalProvider>
    </MnemonicRenameModalProvider>
  )
}

export const MnemonicsPage = () => <Content />
