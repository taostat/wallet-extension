import { act, renderHook, waitFor } from "@testing-library/react"
import { AuthorizedSiteId, ProviderType } from "extension-core"
import { TAOSTATS_WEB_APP_DOMAIN } from "extension-shared"

import { api } from "@ui/api"

import { ADDRESSES } from "../../../../tests/constants"
import { TestWrapper } from "../../../../tests/TestWrapper"
import useAuthorisedSiteById from "../useAuthorisedSiteById"

type RenderProps = { siteId: AuthorizedSiteId; providerType: ProviderType }

test("Can get Authorised Site by id", async () => {
  const { result } = renderHook(
    (props: RenderProps) => useAuthorisedSiteById(props.siteId, props.providerType),
    {
      initialProps: { siteId: TAOSTATS_WEB_APP_DOMAIN, providerType: "polkadot" },
      wrapper: TestWrapper,
    },
  )

  await waitFor(() => expect(result.current.connected).toHaveLength(2))
  expect(result.current.connectAllSubstrate).toBe(true)
  expect(result.current.availableAddresses).toEqual(
    expect.arrayContaining([ADDRESSES.GAV, ADDRESSES.ALICE, ADDRESSES.TAOSTATS_TEST]),
  )

  // The real store re-emits via chrome.storage.onChanged, which the
  // webextension mock doesn't fire, so assert on the update the hook sends.
  const update = jest.mocked(api.authorizedSiteUpdate)

  await act(async () => result.current.toggleOne(ADDRESSES.GAV))
  expect(update).toHaveBeenLastCalledWith(TAOSTATS_WEB_APP_DOMAIN, {
    addresses: [ADDRESSES.ALICE],
  })

  await act(async () => result.current.toggleOne(ADDRESSES.TAOSTATS_TEST))
  expect(update).toHaveBeenLastCalledWith(TAOSTATS_WEB_APP_DOMAIN, {
    addresses: [ADDRESSES.GAV, ADDRESSES.ALICE, ADDRESSES.TAOSTATS_TEST],
  })

  await act(async () => result.current.toggleAll(false))
  expect(update).toHaveBeenLastCalledWith(TAOSTATS_WEB_APP_DOMAIN, { addresses: [] })

  await act(async () => result.current.toggleAll(true))
  expect(update).toHaveBeenLastCalledWith(TAOSTATS_WEB_APP_DOMAIN, {
    addresses: result.current.availableAddresses,
  })
})
