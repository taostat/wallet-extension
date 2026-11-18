import type {
  Account,
  AuthorizedSite,
  AuthorizedSites,
  BalanceSubscriptionResponse,
  ProviderType,
} from "extension-core"
import { Network, subNativeTokenId, Token } from "@taostats-wallet/chaindata-provider"
import { TokenRatesStorage } from "@taostats-wallet/token-rates"
import { AnalyticsCaptureRequest, SitesAuthorizedStore, Trees } from "extension-core"
import { TAOSTATS_WEB_APP_DOMAIN } from "extension-shared"

import { ADDRESSES } from "../constants"

const authorisedSites = {
  [TAOSTATS_WEB_APP_DOMAIN]: {
    addresses: [ADDRESSES.GAV, ADDRESSES.ALICE],
    connectAllSubstrate: true,
    id: TAOSTATS_WEB_APP_DOMAIN,
    origin: "Taostats",
    url: `https://${TAOSTATS_WEB_APP_DOMAIN}`,
  },
  "app.example.com": {
    addresses: [ADDRESSES.TAOSTATS_TEST],
    id: "app.example.com",
    origin: "Example",
    url: "https://app.example.com",
  },
}

const sitesStore = new SitesAuthorizedStore(authorisedSites)

const mockedApiMethods = {
  analyticsCapture: jest
    .fn()
    .mockImplementation(
      (_request: AnalyticsCaptureRequest) => new Promise((resolve) => resolve(true)),
    ),
  accountsSubscribe: jest.fn().mockImplementation((cb: (accounts: Account[]) => void) => {
    cb([
      {
        type: "keypair",
        address: ADDRESSES.GAV,
        name: "Gav",
        curve: "sr25519",
        createdAt: 1739192645517,
      },
      {
        type: "ledger-polkadot",
        address: ADDRESSES.ALICE,
        curve: "ed25519",
        name: "Substrate Ledger",
        app: "polkadot",
        accountIndex: 0,
        addressOffset: 0,
        genesisHash: "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03",
        createdAt: 1739192646517,
      },
      {
        type: "keypair",
        address: ADDRESSES.TAOSTATS_TEST,
        name: "Taostats Test",
        curve: "sr25519",
        createdAt: 1739192647517,
      },
    ])
    return () => undefined
  }),
  accountsCatalogSubscribe: jest.fn().mockImplementation((cb: (accounts: Trees) => void) => {
    cb({
      portfolio: [
        { address: ADDRESSES.GAV, type: "account" },
        { address: ADDRESSES.ALICE, type: "account" },
        { address: ADDRESSES.TAOSTATS_TEST, type: "account" },
      ],
      watched: [],
    })
    return () => undefined
  }),
  authorizedSitesSubscribe: jest.fn().mockImplementation((cb: (site: AuthorizedSites) => void) => {
    const sub = sitesStore.observable.subscribe(cb)
    return () => sub.unsubscribe()
  }),
  authorizedSiteUpdate: jest
    .fn()
    .mockImplementation((id: string, update: Partial<AuthorizedSite>) =>
      sitesStore.updateSite(id, update),
    ),
  authorizedSiteForget: jest
    .fn()
    .mockImplementation((id: string, type: ProviderType) => sitesStore.forgetSite(id, type)),
  balances: jest.fn().mockImplementation((cb: (balances: BalanceSubscriptionResponse) => void) => {
    cb({
      status: "initialising",
      balances: [],
      failedBalanceIds: [],
    })

    return () => {}
  }),
  networks: jest.fn().mockImplementation((cb: (chains: Network[]) => void) => {
    cb(networks)
  }),
  tokens: jest.fn().mockImplementation((cb: (tokens: Token[]) => void) => {
    cb(mockTokens)
  }),
  tokenRates: jest.fn(getMockTokenRates),
}

// Create a proxy to handle the mocking, this enables us to log if a method is being accessed
export const mockedApi = new Proxy(jest.requireActual("@ui/api"), {
  get(target, prop) {
    if (Object.prototype.hasOwnProperty.call(mockedApiMethods, prop)) {
      // Use specific mock if defined
      return mockedApiMethods[prop as keyof typeof mockedApiMethods]
    }
    // Use generic mock for any other property
    // eslint-disable-next-line no-console
    console.log("Attempting to access un-mocked api method: ", prop)
    return target[prop as keyof typeof target]
  },
})

function getMockTokenRates(cb: (rates: TokenRatesStorage) => void) {
  cb({
    tokenRates: {
      [subNativeTokenId("bittensor")]: {
        usd: { price: 412.5, marketCap: 3_500_000_000, change24h: 1.28 },
        tao: { price: 1 },
      },
    },
  })
  return () => undefined
}

const mockTokens: Token[] = [
  {
    id: "bittensor:substrate-native",
    platform: "polkadot",
    networkId: "bittensor",
    type: "substrate-native",
    symbol: "TAO",
    decimals: 9,
    name: "TAO",
    coingeckoId: "bittensor",
    logo: "https://raw.githubusercontent.com/TalismanSociety/chaindata/feat/chaindata-v4/assets/tokens/coingecko/bittensor.webp",
    isDefault: true,
    existentialDeposit: "500",
  },
]

const networks: Network[] = [
  {
    id: "bittensor",
    isDefault: true,
    name: "Bittensor",
    logo: "https://raw.githubusercontent.com/TalismanSociety/chaindata/feat/chaindata-v4/assets/chains/bittensor.svg",
    nativeTokenId: "bittensor:substrate-native",
    nativeCurrency: {
      decimals: 9,
      symbol: "TAO",
      name: "TAO",
      coingeckoId: "bittensor",
      logo: "https://raw.githubusercontent.com/TalismanSociety/chaindata/feat/chaindata-v4/assets/tokens/coingecko/bittensor.webp",
    },
    themeColor: "#242423",
    blockExplorerUrls: [],
    genesisHash: "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03",
    platform: "polkadot",
    chainName: "Bittensor",
    specName: "node-subtensor",
    specVersion: 277,
    account: "*25519",
    chainspecQrUrl: "https://metadata.novasama.io/qr/node-subtensor_specs.png",
    latestMetadataQrUrl: "https://metadata.novasama.io/qr/node-subtensor_metadata_latest.apng",
    prefix: 42,
    rpcs: [
      "wss://entrypoint-finney.opentensor.ai:443",
      "wss://lite.sub.latent.to:443",
      "wss://entrypoint-finney.opentensor.ai:443",
      "wss://lite.sub.latent.to:443",
    ],
    hasCheckMetadataHash: true,
    topology: {
      type: "standalone",
    },
  },
]
