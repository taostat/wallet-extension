import { SecretIcon } from "@taostats-wallet/icons"
import { Plus } from "@untitledui/icons/Plus"
import { Account, isAccountOfType } from "extension-core"
import { FC, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Dropdown } from "taostats-ui"

import { useAccounts, useMnemonics } from "@ui/state"

export type MnemonicOption = {
  value: string
  label: string
  accounts?: Account[]
}

export const AccountAddMnemonicDropdown: FC<{
  label?: string
  value: string | null // null means "generate new"
  onChange: (mnemonicId: string | null) => void
}> = ({ label, value, onChange }) => {
  const { t } = useTranslation()

  const allAccounts = useAccounts()

  const newMmnemonicOption = useMemo(
    () => ({
      value: "new",
      label: t("Generate new recovery phrase"),
      accounts: [],
    }),
    [t],
  )

  const mnemonics = useMnemonics()
  const mnemonicOptions: MnemonicOption[] = useMemo(() => {
    const accountsByMnemonic = allAccounts.reduce(
      (result, acc) => {
        if (!isAccountOfType(acc, "keypair") || !acc.mnemonicId) return result
        if (!result[acc.mnemonicId]) result[acc.mnemonicId] = []
        result[acc.mnemonicId].push(acc)
        return result
      },
      {} as Record<string, Account[]>,
    )
    return [
      ...mnemonics
        .map((m) => ({
          label: m.name,
          value: m.id,
          accounts: accountsByMnemonic[m.id] || [],
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      newMmnemonicOption,
    ]
  }, [allAccounts, mnemonics, newMmnemonicOption])

  const selected = useMemo(
    () => mnemonicOptions.find((o) => o.value === value) ?? newMmnemonicOption,
    [mnemonicOptions, newMmnemonicOption, value],
  )

  const handleChange = useCallback(
    (o: MnemonicOption | null) => {
      if (!o) return // shouldn't happen
      onChange(o.value === "new" ? null : o.value)
    },
    [onChange],
  )

  return (
    <Dropdown
      className="[&>label]:mb-2"
      items={mnemonicOptions}
      label={label ?? t("Recovery phrase")}
      propertyKey="value"
      renderItem={(o) => (
        <div
          className="text-fg-secondary flex w-full items-center gap-3 overflow-hidden"
          data-testid="account-add-mnemonic-dropdown"
        >
          <div className="bg-fg-primary/10 text-md rounded-full p-2">
            {o.value === "new" ? <Plus /> : <SecretIcon />}
          </div>
          <div className="grow truncate text-sm">{o.label}</div>
          {o.value !== "new" && (
            <div className="text-fg-disabled flex shrink-0 items-center gap-1 truncate text-xs">
              {t("used by {{count}} accounts", { count: o.accounts?.length ?? 0 })}
            </div>
          )}
        </div>
      )}
      value={selected}
      onChange={handleChange}
      buttonClassName="py-3 bg-secondary"
      optionClassName="py-2 bg-secondary"
    />
  )
}
