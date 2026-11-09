import { getNetworkGenesisHash } from "@taostats-wallet/chaindata-provider"
import { encodeAnyAddress } from "@taostats-wallet/crypto"
import { isAccountCompatibleWithNetwork } from "extension-core"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { SearchInput } from "@taostats/components/SearchInput"
import { useSendFundsWizard } from "@ui/apps/popup/pages/SendFunds/context"
import { useAccounts, useNetworkById, useToken } from "@ui/state"

import { SendFundsAccountsList } from "./SendFundsAccountsList"

export const SendFundsAccountPicker = () => {
  const { t } = useTranslation()
  const { from, to, tokenId, set, remove } = useSendFundsWizard()
  const [search, setSearch] = useState("")

  const token = useToken(tokenId)
  const network = useNetworkById(token?.networkId)

  const allAccounts = useAccounts("owned")

  const accounts = useMemo(
    () =>
      allAccounts
        .filter((account) => !search || account.name?.toLowerCase().includes(search))
        .filter((account) => network && isAccountCompatibleWithNetwork(network, account)),
    [allAccounts, network, search],
  )

  const handleSelect = useCallback(
    (address: string) => {
      if (to && encodeAnyAddress(to) === encodeAnyAddress(address)) remove("to")
      set("from", address, true)
    },
    [remove, set, to],
  )

  return (
    <div className="flex h-full min-h-full w-full flex-col overflow-hidden">
      <div className="flex min-h-fit w-full items-center gap-4 px-6 pb-4">
        <div className="font-bold">{"From"}</div>
        <div className="mx-0.5 grow overflow-hidden px-0.5">
          <SearchInput onChange={setSearch} placeholder={t("Search by account name")} />
        </div>
      </div>
      <ScrollContainer className="bg-secondary border-primary scrollable h-full w-full grow overflow-x-hidden border-t">
        <SendFundsAccountsList
          accounts={accounts}
          genesisHash={getNetworkGenesisHash(network)}
          selected={from}
          onSelect={handleSelect}
          showBalances
          tokenId={tokenId}
          showIfEmpty
        />
      </ScrollContainer>
    </div>
  )
}
