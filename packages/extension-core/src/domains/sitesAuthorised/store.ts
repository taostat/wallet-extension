import { assert } from "@polkadot/util"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { isInternalHostname } from "extension-shared"

import { SubscribableByIdStorageProvider } from "../../libs/Store"
import { urlToDomain } from "../../util/urlToDomain"
import { AuthorizedSite, AuthorizedSites, ProviderType } from "./types"

const OLD_AUTH_URLS_KEY = "authUrls"

// exported only for test purposes
export class SitesAuthorizedStore extends SubscribableByIdStorageProvider<
  AuthorizedSites,
  "pri(sites.subscribe)",
  "pri(sites.byid.subscribe)"
> {
  constructor(initialData: AuthorizedSites = {}) {
    super("sitesAuthorized", initialData)

    // One time migration to retrieve previously set authorizations and
    // save them to the new SitesAuthorisationStore
    // this code can be removed at some point after Beta launch when we're confident
    // all alpha users have upgraded
    chrome.storage.local.get(OLD_AUTH_URLS_KEY).then(async (result) => {
      // test if migration required
      if (!result) return
      if (Object.keys(await this.get()).length !== 0) return

      // migrate
      const previousData = JSON.parse(result[OLD_AUTH_URLS_KEY] ? result[OLD_AUTH_URLS_KEY] : "{}")
      this.set(previousData)

      // clear data from previous store
      chrome.storage.local.remove(OLD_AUTH_URLS_KEY)
    })
  }

  getSiteFromUrl(url: string): Promise<AuthorizedSite> {
    const { val, err } = urlToDomain(url)
    if (err) throw new Error(val)

    return this.get(val)
  }

  public async ensureUrlAuthorized(
    url: string,
    ethereum: boolean,
    address?: string,
  ): Promise<boolean> {
    const entry = await this.getSiteFromUrl(url)
    const addresses = entry?.addresses
    assert(addresses, `Site ${url} has not been authorised for Talisman yet`)
    assert(addresses.length, `No Taostats wallet accounts are authorised to connect to ${url}`)

    // check the supplied address is authorised to interact with this URL
    if (address)
      assert(
        addresses.some((addr) => isAddressEqual(addr, address)),
        `The source ${url} is not allowed to interact with this account.`,
      )
    return true
  }

  async forgetSite(id: string, _type: ProviderType) {
    await this.delete(id)
  }

  // called after removing an account from keyring, for cleanup purposes
  async forgetAccount(address: string) {
    await this.mutate((sites) => {
      for (const [key, { addresses }] of Object.entries(sites)) {
        sites[key].addresses = addresses?.filter((a) => a !== address)
      }
      return sites
    })
  }

  async updateSite(id: string, props: Partial<AuthorizedSite>) {
    await this.mutate((sites) => {
      sites[id] = {
        ...sites[id],
        ...props,
      }
      return sites
    })
  }

  async forgetAllSites(type: ProviderType) {
    await this.mutate((sites) => {
      for (const host of Object.keys(sites)) {
        if (type === "polkadot" && !isInternalHostname(host)) {
          delete sites[host].addresses
          delete sites[host].connectAllSubstrate
        }
      }
      return sites
    })
  }

  async disconnectAllSites(type: ProviderType) {
    await this.mutate((sites) => {
      for (const host of Object.keys(sites)) {
        // disconnect all accounts
        if (type === "polkadot" && sites[host].addresses && !isInternalHostname(host)) {
          sites[host].addresses = []
        }
      }
      return sites
    })
  }
}
const sitesAuthorisedStore = new SitesAuthorizedStore()
export default sitesAuthorisedStore
