import { NetworkId } from "@taostats-wallet/chaindata-provider"
// import { TogglePill } from "@taostats/components/TogglePill"
import { activeTokensStore } from "extension-core"
import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Modal, ModalDialog, PillButton, useOpenClose } from "taostats-ui"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { SearchInput } from "@taostats/components/SearchInput"
import { Spacer } from "@taostats/components/Spacer"
import { AnalyticsPage } from "@ui/api/analytics"
import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { NetworkCombo } from "@ui/domains/Networks/NetworkCombo"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"
import { useAnyNetwork, useBalancesHydrate, useNetworks } from "@ui/state"

import { TokensList } from "./TokensList"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Settings",
  featureVersion: 1,
  page: "Settings - Tokens",
}

const platform = "polkadot"

const Content = () => {
  const { t } = useTranslation()
  useBalancesHydrate() // preload

  useAnalyticsPageView(ANALYTICS_PAGE)
  const navigate = useNavigate()
  const location = useLocation()

  // filters to persist in location state
  const [
    isActiveOnly,
    // setIsActiveOnly
  ] = useState((location.state?.isActiveOnly as boolean) ?? true)
  const [
    isCustomOnly,
    // setIsCustomOnly
  ] = useState((location.state?.isCustomOnly as boolean) ?? false)
  const [
    isHidePools,
    // setIsHidePools
  ] = useState((location.state?.isHidePools as boolean) ?? false)
  const [search, setSearch] = useState((location.state?.search as string) ?? "")
  const [networkId, setNetworkId] = useState<NetworkId | null>(location.state?.networkId ?? null)
  const networks = useNetworks({ platform, activeOnly: true, includeTestnets: true })

  // const toggleIsActiveOnly = useCallback(() => setIsActiveOnly((prev) => !prev), [])
  // const toggleIsCustomOnly = useCallback(() => setIsCustomOnly((prev) => !prev), [])
  // const toggleIsHidePools = useCallback(() => setIsHidePools((prev) => !prev), [])

  const networkOptions = useMemo(
    () => networks.concat().sort((n1, n2) => n1.name?.localeCompare(n2.name ?? "") ?? 0),
    [networks],
  )

  const network = useAnyNetwork(networkId)

  // persist all filters in location state so token page can navigate back here without losing filters
  useEffect(() => {
    navigate(location.pathname, {
      replace: true,
      state: { search, platform, isActiveOnly, isCustomOnly, isHidePools, networkId },
    })
  }, [isActiveOnly, isCustomOnly, isHidePools, location.pathname, navigate, search, networkId])

  const ocResetAllModal = useOpenClose()

  useEffect(() => {
    // reset selected network if platform changes to an incompatible one
    if (networkId && network?.platform !== platform) setNetworkId("ALL")
  }, [networkId, network])

  return (
    <>
      <div className="flex w-full gap-8">
        <HeaderBlock title={t("Tokens")} className="grow" text={t("Enable and disable tokens")} />
      </div>
      <Spacer small />
      <div className="h-4" />
      <NetworkCombo
        networks={networkOptions}
        onChange={setNetworkId}
        value={networkId}
        bgClassName="bg-grey-800"
      />
      <div className="h-4" />
      <div className="flex gap-4">
        <SearchInput
          initialValue={search}
          onChange={setSearch}
          placeholder={t("Search tokens")}
          containerClassName="rounded-sm [&>svg]:size-12"
        />
      </div>
      <div className="h-4"></div>
      <div className="flex justify-end gap-4">
        <div className="grow">
          <PillButton className="h-16" onClick={() => ocResetAllModal.open()}>
            {t("Reset active states")}
          </PillButton>
        </div>
        {/* <TogglePill
          label={t("Active only")}
          checked={isActiveOnly}
          onChange={toggleIsActiveOnly}
          disabled={!!search}
        /> */}
        {/* <TogglePill
          label={t("Custom only")}
          checked={isCustomOnly}
          onChange={toggleIsCustomOnly}
          disabled={!!search}
        /> */}
        {/* <TogglePill
          label={t("Enable pools")}
          checked={!isHidePools}
          onChange={toggleIsHidePools}
          disabled={!!search}
        /> */}
      </div>
      <Spacer />
      <TokensList
        platform={platform}
        isActiveOnly={isActiveOnly}
        isCustomOnly={isCustomOnly}
        isHidePools={isHidePools}
        networkId={networkId}
        search={search}
      />
      <Modal isOpen={ocResetAllModal.isOpen} onDismiss={ocResetAllModal.close}>
        <ResetStatesModalContent onClose={ocResetAllModal.close} />
      </Modal>
    </>
  )
}

export const TokensPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)

const ResetStatesModalContent: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const { t } = useTranslation()

  const handleClick = useCallback(async () => {
    activeTokensStore.mutate(() => ({}))
    onClose()
  }, [onClose])

  return (
    <ModalDialog title={t("Reset tokens")} onClose={onClose}>
      <div className="text-body-secondary mb-8 text-sm">
        {t("This will reset active state of all tokens to their defaults.")}
      </div>

      <div className="mt-4 flex justify-end gap-8">
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button primary onClick={handleClick}>
          {t("Reset")}
        </Button>
      </div>
    </ModalDialog>
  )
}
