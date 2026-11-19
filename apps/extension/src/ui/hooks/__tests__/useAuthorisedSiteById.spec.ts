import { act, renderHook, waitFor } from "@testing-library/react"
import { AuthorizedSiteId, ProviderType } from "extension-core"
import { TAOSTATS_WEB_APP_DOMAIN } from "extension-shared"
import { expect, test } from "vitest"

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

  // api.authorizedSiteUpdate writes to the real sites store; the hook picks the change up
  // through storage.onChanged
  await act(async () => result.current.toggleOne(ADDRESSES.GAV))
  await waitFor(() => expect(result.current.connected).toEqual([ADDRESSES.ALICE]))

  await act(async () => result.current.toggleOne(ADDRESSES.TAOSTATS_TEST))
  await waitFor(() =>
    expect(result.current.connected).toEqual([ADDRESSES.ALICE, ADDRESSES.TAOSTATS_TEST]),
  )
  expect(api.authorizedSiteUpdate).toHaveBeenLastCalledWith(TAOSTATS_WEB_APP_DOMAIN, {
    addresses: [ADDRESSES.ALICE, ADDRESSES.TAOSTATS_TEST],
  })

  await act(async () => result.current.toggleAll(false))
  await waitFor(() => expect(result.current.connected).toEqual([]))

  await act(async () => result.current.toggleAll(true))
  await waitFor(() =>
    expect(result.current.connected).toEqual(
      expect.arrayContaining([ADDRESSES.GAV, ADDRESSES.ALICE, ADDRESSES.TAOSTATS_TEST]),
    ),
  )
})
