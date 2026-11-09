import { Account, isAccountAddressEthereum } from "extension-core"
import { FC, Fragment, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ConnectAccountToggleButtonRow } from "./ConnectAccountToggleButtonRow"

const AccountSeparator = () => <div className="bg-secondary mx-3 h-px"></div>

export const ConnectedAccountsPolkadot: FC<{
  activeAccounts: Array<[Account, boolean]>
  onUpdateAccounts: (addresses: string[]) => void
}> = ({ activeAccounts, onUpdateAccounts }) => {
  const { t } = useTranslation()

  const hasEthereumActiveAccounts = useMemo(
    () => activeAccounts.some((acc) => isAccountAddressEthereum(acc[0]) && acc[1]),
    [activeAccounts],
  )
  const [
    enableEvmAccounts,
    // setEnableEvmAccounts
  ] = useState(hasEthereumActiveAccounts)

  const displayedAccounts = useMemo(
    () => activeAccounts.filter(([acc]) => enableEvmAccounts || !isAccountAddressEthereum(acc)),
    [activeAccounts, enableEvmAccounts],
  )

  const handleAccountToggle = useCallback(
    (address: string) => {
      const isActive = activeAccounts.find(([acc]) => acc.address === address)?.[1] ?? false
      const otherActive = activeAccounts.filter(([, active]) => active).map(([acc]) => acc.address)
      const newActive = isActive
        ? otherActive?.filter((a) => a !== address)
        : [...otherActive, address]
      onUpdateAccounts(newActive)
    },
    [activeAccounts, onUpdateAccounts],
  )

  const handleDisconnectAllClick = useCallback(() => {
    onUpdateAccounts([])
  }, [onUpdateAccounts])

  const handleConnectAllClick = useCallback(() => {
    onUpdateAccounts(displayedAccounts.map(([a]) => a.address))
  }, [displayedAccounts, onUpdateAccounts])

  return (
    <>
      <div className="mb-1 mt-3 flex w-full items-center justify-between gap-1.5 overflow-hidden px-2 text-xs">
        <div className="flex items-center gap-1 truncate">
          <button
            type="button"
            className="text-fg-secondary hover:text-fg-tertiary truncate"
            onClick={handleDisconnectAllClick}
          >
            {t("Disconnect All")}
          </button>
          <div className="bg-disabled h-[10px] w-px"></div>
          <button
            type="button"
            className="text-fg-secondary hover:text-fg-tertiary truncate"
            onClick={handleConnectAllClick}
          >
            {t("Connect All")}
          </button>
        </div>
      </div>
      {displayedAccounts.map(([acc, isConnected], idx) => (
        <Fragment key={acc.address}>
          {!!idx && <AccountSeparator />}
          <ConnectAccountToggleButtonRow
            account={acc}
            checked={isConnected}
            onClick={() => handleAccountToggle(acc.address)}
          />
        </Fragment>
      ))}
    </>
  )
}
