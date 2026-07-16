import { classNames, sleep } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { ArrowRight } from "@untitledui/icons/ArrowRight"
import { CheckCircle } from "@untitledui/icons/CheckCircle"
import { Lock01 } from "@untitledui/icons/Lock01"
import { LockUnlocked01 } from "@untitledui/icons/LockUnlocked01"
import { FC, useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Button, Checkbox, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { FadeIn } from "@taostats/components/FadeIn"
import { notify, notifyUpdate } from "@taostats/components/Notifications"
import { shortenAddress } from "@taostats/util/shortenAddress"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { useSelectedCurrency } from "@ui/state"

import { BalancesSummaryTooltipContent } from "../../BalancesSummaryTooltipContent"
import { BackToAddAccountButton } from "../BackToAddAccountButton"
import { JsonImportAccount, useJsonAccountImport } from "./context"
import { UnlockJsonAccountsButton } from "./UnlockJsonAccountsButton"

const JsonAccount: FC<{ account: JsonImportAccount; onSelect: (select: boolean) => void }> = ({
  account,
  onSelect,
}) => {
  const { t } = useTranslation()
  const handleClick = useCallback(() => {
    onSelect(!account.selected)
  }, [onSelect, account])

  const currency = useSelectedCurrency()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <button
            tabIndex={-1}
            type="button"
            className="bg-app-bg text-fg-primary enabled:hover:bg-secondary flex h-16 w-full shrink-0 cursor-pointer items-center gap-5 rounded-sm px-4 text-left disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClick}
            disabled={!account.isPrivateKeyAvailable || account.isExisting}
          >
            <AccountIcon
              className="text-xl"
              address={account.address}
              genesisHash={account.genesisHash}
            />
            <div className="flex grow flex-col gap-1 overflow-hidden">
              <div className="flex w-full items-center gap-0.5 overflow-hidden text-base">
                <div className="truncate">{account.name}</div>
                <div className="shrink-0">
                  <AccountTypeIcon className="text-fg-brand inline-block" />
                </div>
              </div>
              <div className="text-fg-secondary text-sm">{shortenAddress(account.address)}</div>
            </div>
            <div className={classNames(account.isLoading && "animate-pulse")}>
              <Tooltip placement="bottom-end">
                <TooltipTrigger asChild>
                  <div>
                    <Fiat amount={account.balances.sum.fiat(currency).total} isBalance />
                  </div>
                </TooltipTrigger>
                <BalancesSummaryTooltipContent balances={account.balances} />
              </Tooltip>
            </div>
            {account.isExisting || !account.isPrivateKeyAvailable ? (
              <div className="w-4 shrink-0"></div>
            ) : account.isLocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-fg-orange shrink-0">
                    <Lock01 />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {t("Account is locked, password needs to be provided")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-fg-brand shrink-0">
                    <LockUnlocked01 />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t("Account is unlocked and can be imported")}</TooltipContent>
              </Tooltip>
            )}

            {account.isExisting ? (
              <div className="w-[19.2px] shrink-0 text-center">
                <CheckCircle className="text-fg-brand" />
              </div>
            ) : !account.isPrivateKeyAvailable ? (
              <div className="w-[19.2px] shrink-0 text-center">
                <AlertCircle className="text-fg-orange" />
              </div>
            ) : (
              <Checkbox
                readOnly
                checked={account.selected}
                disabled={!account.isPrivateKeyAvailable || account.isExisting}
                className="[&>input]:!border-primary"
              />
            )}
          </button>
        </div>
      </TooltipTrigger>
      {account.isExisting ? (
        <TooltipContent>{t("This account already exists.")}</TooltipContent>
      ) : !account.isPrivateKeyAvailable ? (
        <TooltipContent>{t("Private key is not available.")}</TooltipContent>
      ) : null}
    </Tooltip>
  )
}

export const ImportJsonAccountsForm: FC<{ onSuccess: (address: string) => void }> = ({
  onSuccess,
}) => {
  const { t } = useTranslation()

  const {
    accounts = [],
    canImport,
    selectAccount,
    selectAll,
    selectNone,
    importAccounts,
    requiresFilePassword,
  } = useJsonAccountImport()

  const { selectedCount, totalCount } = useMemo(() => {
    const selectedCount = accounts.filter((a) => a.selected).length.toString()
    const totalCount = accounts.length.toString()
    return { selectedCount, totalCount }
  }, [accounts])

  const handleSelect = useCallback(
    (id: string) => (select: boolean) => {
      selectAccount(id, select)
    },
    [selectAccount],
  )

  const [isImporting, setIsImporting] = useState(false)

  const handleImportClick = useCallback(async () => {
    setIsImporting(true)

    const count = accounts?.filter((a) => a.selected).length

    const notificationId = notify(
      {
        type: "processing",
        title: t("Importing {{count}} accounts", { count }),
        subtitle: t("Please wait"),
      },
      { autoClose: false },
    )

    // ensure notification has time to display
    await sleep(50)

    try {
      const addresses = await importAccounts()
      onSuccess(addresses[0])
      notifyUpdate(notificationId, {
        type: "success",
        title: t("Accounts imported", { count }),
        subtitle: "",
      })
    } catch (err) {
      notifyUpdate(notificationId, {
        type: "error",
        title: t("Error importing account"),
        subtitle: (err as Error)?.message,
      })
    }
    setIsImporting(false)
  }, [accounts, importAccounts, onSuccess, t])

  const alreadyImported = useMemo(() => {
    return !accounts.filter((a) => !a.isExisting && a.isPrivateKeyAvailable).length
  }, [accounts])

  if (requiresFilePassword) return null
  if (!accounts?.length) return <BackToAddAccountButton methodType="new" />

  return (
    <FadeIn>
      {alreadyImported && (
        <div className="bg-secondary text-fg-secondary mb-4 flex w-full items-center gap-3 rounded p-4">
          <AlertCircle className="shrink-0 text-lg" />
          <div className="grow">
            {t("All accounts included in this file already exist in Taostats.")}
          </div>
        </div>
      )}
      <div className={classNames("flex items-center px-4", accounts.length > 4 && "pr-6")}>
        <div className="grow">
          <Trans
            t={t}
            values={{ selectedCount, totalCount }}
            defaults="Selected accounts <Selected>{{selectedCount}}</Selected><Total>/{{totalCount}}</Total>"
            components={{
              Selected: <span className="text-fg-brand ml-1" />,
              Total: <span className="text-fg-disabled text-sm" />,
            }}
          ></Trans>
        </div>
        {accounts.length > 1 && (
          <div className="text-fg-disabled flex items-center gap-2">
            <button type="button" className="hover:text-fg-tertiary" onClick={selectNone}>
              {t("Clear")}
            </button>
            <div className="bg-disabled h-3 w-px"></div>
            <button type="button" className="hover:text-fg-tertiary" onClick={selectAll}>
              {t("Select all")}
            </button>
          </div>
        )}
      </div>
      <div
        className={classNames(
          "scrollable scrollable-800 mt-3 flex max-h-[280px] flex-col gap-2 overflow-y-auto",
          accounts.length > 4 && "pr-2",
        )}
      >
        {accounts.map((acc, i) => (
          <JsonAccount key={i} account={acc} onSelect={handleSelect(acc.id)} />
        ))}
      </div>
      <div className="mt-8 flex w-full justify-between">
        <BackToAddAccountButton methodType="new" />
        <div className="flex justify-end gap-4">
          <UnlockJsonAccountsButton />
          <Button
            icon={ArrowRight}
            type="button"
            primary
            disabled={!canImport}
            onClick={handleImportClick}
            processing={isImporting}
          >
            {t("Import")}
          </Button>
        </div>
      </div>
    </FadeIn>
  )
}
