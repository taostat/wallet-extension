import {
  DotNetwork,
  getNetworkGenesisHash,
  isNetworkDot,
} from "@taostats-wallet/chaindata-provider"
import {
  decodeSs58Address,
  isAddressEqual,
  isAddressValid,
  isSs58Address,
} from "@taostats-wallet/crypto"
import { EyeIcon, HomeIcon, UserIcon, XOctagonIcon } from "@taostats-wallet/icons"
import {
  isAccountCompatibleWithNetwork,
  isAccountOwned,
  isAddressCompatibleWithNetwork,
} from "extension-core"
import { useCallback, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"

import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { SearchInput } from "@taostats/components/SearchInput"
import { useSendFundsWizard } from "@ui/apps/popup/pages/SendFunds/context"
import { useAccounts, useNetworkById, useToken } from "@ui/state"

import { NetworkLogo } from "../Networks/NetworkLogo"
import { SendFundsAccountsList } from "./SendFundsAccountsList"
import { useSendFunds } from "./useSendFunds"

const AddressFormatError = ({ chain }: { chain?: DotNetwork }) => {
  const { t } = useTranslation()
  return (
    <div className="h-min-h-full align-center flex w-full flex-col items-center gap-4 px-12 py-7">
      <XOctagonIcon className="text-brand-orange text-lg" />
      <span className="text-body">{t("Address Format Mismatch")}</span>
      <p className="text-body-secondary mt-4 text-center">
        <Trans
          t={t}
          defaults="The address you've entered is not compatible with the <Chain><ChainLogo />{{chainName}}</Chain> chain. Please enter a compatible address or select a different chain to send on."
          components={{
            Chain: <div className="text-body inline-flex items-baseline gap-1" />,
            ChainLogo: <NetworkLogo className="self-center" networkId={chain?.id} />,
          }}
          values={{ chainName: chain?.name ?? t("Unknown") }}
        />
      </p>
    </div>
  )
}

export const SendFundsRecipientPicker = () => {
  const { t } = useTranslation()
  const { from, to, set, tokenId } = useSendFundsWizard()
  const { setRecipientWarning } = useSendFunds()
  const [search, setSearch] = useState("")
  const token = useToken(tokenId)
  const network = useNetworkById(token?.networkId)

  // includes contacts
  const allAccounts = useAccounts("all")

  // consider only accounts that are compatible with the token's network
  const compatibleRecipients = useMemo(() => {
    if (!network) return []
    return allAccounts.filter(
      (account) =>
        isAccountCompatibleWithNetwork(network, account) &&
        !isAddressEqual(account.address, from ?? ""),
    )
  }, [allAccounts, from, network])

  // resolve search
  const matchingAccounts = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase()
    if (!lowerSearch) return compatibleRecipients

    return compatibleRecipients.filter(
      (account) =>
        account.name?.toLowerCase().includes(lowerSearch) ||
        account.address.toLowerCase().includes(lowerSearch),
    )
  }, [compatibleRecipients, search])

  // group results by category
  const [ownedAccounts, watchedAccounts, contacts] = useMemo(() => {
    return [
      matchingAccounts.filter(isAccountOwned),
      matchingAccounts.filter((a) => a.type === "watch-only"),
      matchingAccounts.filter((a) => a.type === "contact"),
    ]
  }, [matchingAccounts])

  const newAddress = useMemo<{
    address: string
    name?: string
    ss58FormatError?: boolean
  } | null>(() => {
    if (!search || !network) return null

    // if we have a result in wallet accounts, then address is the one of our accounts
    // => no need to add an entry
    if (matchingAccounts.length) return null

    if (isAddressValid(search) && isAddressCompatibleWithNetwork(network, search)) {
      if (network.platform === "polkadot" && isSs58Address(search)) {
        const [, ss58Format] = decodeSs58Address(search)
        return {
          address: search,
          ss58FormatError: ![42, network.prefix, network.oldPrefix].includes(ss58Format),
        }
      }
      return { address: search }
    }

    return null
  }, [matchingAccounts.length, network, search])

  const handleSelect = useCallback(
    (address: string) => {
      set("to", address, true)
      setRecipientWarning(undefined)
    },
    [set, setRecipientWarning],
  )

  const handleSubmitSearch = useCallback(() => {
    if (newAddress && !newAddress.ss58FormatError) set("to", newAddress.address, true)
  }, [newAddress, set])

  return (
    <div className="flex h-full min-h-full w-full flex-col overflow-hidden">
      <div className="flex min-h-fit w-full items-center gap-8 px-12 pb-8">
        <div className="font-bold">{t("To")}</div>
        <div className="mx-1 grow overflow-hidden px-1">
          <SearchInput
            onSubmit={handleSubmitSearch}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onChange={setSearch}
            placeholder={t("Enter address")}
          />
        </div>
      </div>
      <ScrollContainer className="bg-black-secondary border-grey-700 scrollable h-full w-full grow overflow-x-hidden border-t">
        {isNetworkDot(network) && newAddress?.ss58FormatError ? (
          <AddressFormatError chain={network ?? undefined} />
        ) : (
          <>
            {newAddress && (
              <SendFundsAccountsList
                allowZeroBalance
                accounts={[newAddress]}
                noFormat // preserve user input chain format
                selected={to}
                onSelect={handleSelect}
              />
            )}
            <SendFundsAccountsList
              allowZeroBalance
              accounts={contacts}
              genesisHash={getNetworkGenesisHash(network)}
              selected={to}
              onSelect={handleSelect}
              header={
                <>
                  <UserIcon className="mr-2 inline align-text-top" />
                  <span>{t("Contacts")}</span>
                </>
              }
            />
            <SendFundsAccountsList
              allowZeroBalance
              accounts={ownedAccounts}
              genesisHash={getNetworkGenesisHash(network)}
              selected={to}
              onSelect={handleSelect}
              header={
                <>
                  <HomeIcon className="mr-2 inline-block align-text-top" />
                  {t("My Accounts")}
                </>
              }
              showBalances
              tokenId={tokenId}
            />
            <SendFundsAccountsList
              allowZeroBalance
              accounts={watchedAccounts}
              genesisHash={getNetworkGenesisHash(network)}
              selected={to}
              onSelect={handleSelect}
              header={
                <>
                  <EyeIcon className="mr-2 inline-block align-text-top" />
                  {t("Followed only")}
                </>
              }
              showBalances
              tokenId={tokenId}
            />
          </>
        )}
      </ScrollContainer>
    </div>
  )
}
