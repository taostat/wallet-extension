import { PolkadotVaultIcon, SecretIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { CornerDownRight } from "@untitledui/icons/CornerDownRight"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { AccountOfType, getAccountGenesisHash, isAccountOfType, Mnemonic } from "extension-core"
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "taostats-ui"

import { Accordion, AccordionIcon } from "@taostats/components/Accordion"
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
      <div className="text-fg-secondary text-xs">
        <Address address={account.address} startCharCount={6} endCharCount={6} />
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
  const refBackup = useRef<HTMLButtonElement>(null)

  // const hasVerifierCertificateMnemonic = Boolean(useAppState("vaultVerifierCertificateMnemonicId"))

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className={classNames(
          "hover:text-fg-primary text-fg-secondary flex h-[65px] w-full items-center gap-3 rounded-sm px-4 text-left",
          mnemonic.confirmed
            ? "bg-secondary hover:bg-secondary"
            : "bg-orange-secondary/5 hover:bg-orange-secondary/10",
        )}
      >
        <div className="bg-tertiary/10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full">
          <SecretIcon className="text-fg-secondary text-lg" />
        </div>
        <div className="flex grow flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1">
            <div className="text-fg-primary truncate text-base">{mnemonic.name}</div>
            {isVerifier(mnemonic.id) && <PolkadotVaultIcon className="text-fg-brand shrink-0" />}
          </div>
          <div className="text-fg-secondary flex items-center gap-1 text-xs leading-none">
            <AccountsStack accounts={accounts} />
            <div>{t("used by {{count}} accounts", { count: accounts.length })}</div>
          </div>
        </div>

        {/* reserved space for the context menu button */}
        <div style={actionsStyle} className="h-[36px] w-[36px] shrink-0"></div>
        <AccordionIcon isOpen={isOpen} className="text-lg" />
      </button>
      <div
        ref={refActions}
        className="absolute right-12 top-0 flex h-[65px] flex-col justify-center"
      >
        <div className="relative flex items-center gap-3">
          {!mnemonic.confirmed && (
            <button
              ref={refBackup}
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
              <ContextMenuItem onClick={handleRenameClick}>{t("Rename")}</ContextMenuItem>
              <ContextMenuItem onClick={handleBackupClick}>
                <div className="flex items-center gap-[8px]">
                  <span>{t("Backup")}</span>
                  {!mnemonic.confirmed && (
                    <AlertCircle className="text-fg-orange inline-block text-base" />
                  )}
                </div>
              </ContextMenuItem>
              <ContextMenuItem onClick={handleDeleteClick} disabled={!canDelete(mnemonic.id)}>
                {t("Delete")}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
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
