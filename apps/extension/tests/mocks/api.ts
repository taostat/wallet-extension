import type {
  Account,
  AuthorizedSite,
  AuthorizedSites,
  BalanceSubscriptionResponse,
  ProviderType,
} from "extension-core"
import {
  evmErc20TokenId,
  evmNativeTokenId,
  Network,
  subAssetTokenId,
  subNativeTokenId,
  Token,
} from "@taostats-wallet/chaindata-provider"
import { TokenRatesStorage } from "@taostats-wallet/token-rates"
import { AnalyticsCaptureRequest, SitesAuthorizedStore, Trees } from "extension-core"
/* eslint-disable @typescript-eslint/no-unused-vars */
import { TAOSTATS_WEB_APP_DOMAIN } from "extension-shared"

import { ADDRESSES } from "../constants"

const authorisedSites = {
  [TAOSTATS_WEB_APP_DOMAIN]: {
    addresses: Object.entries(ADDRESSES).map(([name, address]) => address),
    connectAllSubstrate: true,
    id: TAOSTATS_WEB_APP_DOMAIN,
    origin: "Taostats",
    url: `https://${TAOSTATS_WEB_APP_DOMAIN}`,
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
        address: ADDRESSES.TAOSTATS_TEST,
        name: "Gav",
        curve: "sr25519",
        createdAt: 1739192645517,
      },
      {
        type: "ledger-polkadot",
        address: ADDRESSES.TAOSTATS_TEST,
        curve: "ed25519",
        name: "Substrate Ledger",
        app: "polkadot",
        accountIndex: 0,
        addressOffset: 0,
        genesisHash: "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3",
        createdAt: 1739192646517,
      },
    ])
    return () => undefined
  }),
  accountsCatalogSubscribe: jest.fn().mockImplementation((cb: (accounts: Trees) => void) => {
    cb({
      portfolio: [{ address: ADDRESSES.TAOSTATS_TEST, type: "account" }],
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
      [evmErc20TokenId("1284", "0xffffffffa922fef94566104a6e5a35a4fcddaa9f")]: {
        btc: {
          price: 9.8376e-7,
          marketCap: 1120.291917858449,
          change24h: -0.6995739004825059,
        },
        eth: {
          price: 0.00002615,
          marketCap: 29771.48035827377,
          change24h: -3.309408176133055,
        },
        tao: null,
        dot: {
          price: 0.01146351,
          marketCap: 13053350.4089089,
          change24h: 1.7226176666370996,
        },
        usd: {
          price: 0.093924,
          marketCap: 106977510.82556757,
          change24h: 1.2827026300241688,
        },
        cny: {
          price: 0.681135,
          marketCap: 775800908.5070157,
          change24h: 1.3700665180188427,
        },
        eur: {
          price: 0.089166,
          marketCap: 101558351.05967677,
          change24h: 0.9894178793142621,
        },
        gbp: {
          price: 0.074262,
          marketCap: 84583480.57440819,
          change24h: 0.8703754861087402,
        },
        cad: {
          price: 0.131739,
          marketCap: 150048796.23415765,
          change24h: 1.0912043411544499,
        },
        aud: {
          price: 0.144875,
          marketCap: 165009815.0781347,
          change24h: 1.4041268258911828,
        },
        nzd: {
          price: 0.159614,
          marketCap: 181797260.96443695,
          change24h: 1.3370862865171955,
        },
        jpy: {
          price: 14.25,
          marketCap: 16232553537.649935,
          change24h: 1.1933386777987982,
        },
        rub: {
          price: 10.4,
          marketCap: 11847593615.767365,
          change24h: 6.321813624674142,
        },
        krw: {
          price: 131.09,
          marketCap: 149308654567.2437,
          change24h: 1.2979167540541081,
        },
        idr: {
          price: 1490.26,
          marketCap: 1697383312755.538,
          change24h: 1.2339330636094297,
        },
        php: {
          price: 5.52,
          marketCap: 6281612993.054057,
          change24h: 5.710493732541172,
        },
        thb: {
          price: 3.24,
          marketCap: 3688584573.265565,
          change24h: 0.819249871767915,
        },
        vnd: {
          price: 2380.53,
          marketCap: 2711380719469.433,
          change24h: 1.0516686450883532,
        },
        inr: {
          price: 7.94,
          marketCap: 9039499319.855299,
          change24h: 1.3648414521559307,
        },
        try: {
          price: 3.25,
          marketCap: 3706321658.5154734,
          change24h: 1.231727082952439,
        },
        sgd: {
          price: 0.12622,
          marketCap: 143762797.6980469,
          change24h: 1.2578376244311116,
        },
      },
      [evmErc20TokenId("137", "0xd6df932a45c0f255f85145f286ea0b292b21c90b")]: {
        btc: {
          price: 0.00212008,
          marketCap: 31775.19704539381,
          change24h: 3.0416906531575365,
        },
        eth: {
          price: 0.05634936,
          marketCap: 844268.3967884398,
          change24h: 0.3147547196030105,
        },
        tao: null,
        dot: {
          price: 24.704724,
          marketCap: 370137151.7035932,
          change24h: 5.494559000037312,
        },
        usd: {
          price: 202.41,
          marketCap: 3036386874.996101,
          change24h: 5.128124801622068,
        },
        cny: {
          price: 1467.9,
          marketCap: 22020484894.84674,
          change24h: 5.218805653157145,
        },
        eur: {
          price: 192.16,
          marketCap: 2882150567.2938,
          change24h: 4.823704845653175,
        },
        gbp: {
          price: 160.04,
          marketCap: 2400367061.838167,
          change24h: 4.700142744281283,
        },
        cad: {
          price: 283.91,
          marketCap: 4258010333.639529,
          change24h: 4.929355855999569,
        },
        aud: {
          price: 312.22,
          marketCap: 4682081233.762118,
          change24h: 5.254159136070262,
        },
        nzd: {
          price: 343.98,
          marketCap: 5159009556.604628,
          change24h: 5.184573254107144,
        },
        jpy: {
          price: 30714,
          marketCap: 460539930759.3232,
          change24h: 5.035367948987518,
        },
        rub: {
          price: 22417,
          marketCap: 336255467255.5981,
          change24h: 10.3585568080618,
        },
        krw: {
          price: 282508,
          marketCap: 4237382417747.995,
          change24h: 5.143916563573157,
        },
        idr: {
          price: 3211630,
          marketCap: 48177928566733.72,
          change24h: 5.0775035905821575,
        },
        php: {
          price: 11885.48,
          marketCap: 178282979631.60733,
          change24h: 9.724026801999118,
        },
        thb: {
          price: 6979.19,
          marketCap: 104641482679.55305,
          change24h: 4.64707603273604,
        },
        vnd: {
          price: 5130221,
          marketCap: 76958238850205.73,
          change24h: 4.888319099650895,
        },
        inr: {
          price: 17103.7,
          marketCap: 256555270206.718,
          change24h: 5.21338220609387,
        },
        try: {
          price: 7012.76,
          marketCap: 105201999696.67741,
          change24h: 5.075213854982348,
        },
        sgd: {
          price: 272.01,
          marketCap: 4079191437.797253,
          change24h: 5.10231574100985,
        },
      },
      [evmErc20TokenId("592", "0xfcde4a87b8b6fa58326bb462882f1778158b02f1")]: {
        btc: {
          price: 0.00212008,
          marketCap: 31775.19704539381,
          change24h: 3.0416906531575365,
        },
        eth: {
          price: 0.05634936,
          marketCap: 844268.3967884398,
          change24h: 0.3147547196030105,
        },
        tao: null,
        dot: {
          price: 24.704724,
          marketCap: 370137151.7035932,
          change24h: 5.494559000037312,
        },
        usd: {
          price: 202.41,
          marketCap: 3036386874.996101,
          change24h: 5.128124801622068,
        },
        cny: {
          price: 1467.9,
          marketCap: 22020484894.84674,
          change24h: 5.218805653157145,
        },
        eur: {
          price: 192.16,
          marketCap: 2882150567.2938,
          change24h: 4.823704845653175,
        },
        gbp: {
          price: 160.04,
          marketCap: 2400367061.838167,
          change24h: 4.700142744281283,
        },
        cad: {
          price: 283.91,
          marketCap: 4258010333.639529,
          change24h: 4.929355855999569,
        },
        aud: {
          price: 312.22,
          marketCap: 4682081233.762118,
          change24h: 5.254159136070262,
        },
        nzd: {
          price: 343.98,
          marketCap: 5159009556.604628,
          change24h: 5.184573254107144,
        },
        jpy: {
          price: 30714,
          marketCap: 460539930759.3232,
          change24h: 5.035367948987518,
        },
        rub: {
          price: 22417,
          marketCap: 336255467255.5981,
          change24h: 10.3585568080618,
        },
        krw: {
          price: 282508,
          marketCap: 4237382417747.995,
          change24h: 5.143916563573157,
        },
        idr: {
          price: 3211630,
          marketCap: 48177928566733.72,
          change24h: 5.0775035905821575,
        },
        php: {
          price: 11885.48,
          marketCap: 178282979631.60733,
          change24h: 9.724026801999118,
        },
        thb: {
          price: 6979.19,
          marketCap: 104641482679.55305,
          change24h: 4.64707603273604,
        },
        vnd: {
          price: 5130221,
          marketCap: 76958238850205.73,
          change24h: 4.888319099650895,
        },
        inr: {
          price: 17103.7,
          marketCap: 256555270206.718,
          change24h: 5.21338220609387,
        },
        try: {
          price: 7012.76,
          marketCap: 105201999696.67741,
          change24h: 5.075213854982348,
        },
        sgd: {
          price: 272.01,
          marketCap: 4079191437.797253,
          change24h: 5.10231574100985,
        },
      },
      [evmNativeTokenId("787")]: {
        btc: {
          price: 9.8376e-7,
          marketCap: 1120.291917858449,
          change24h: -0.6995739004825059,
        },
        eth: {
          price: 0.00002615,
          marketCap: 29771.48035827377,
          change24h: -3.309408176133055,
        },
        tao: null,
        dot: {
          price: 0.01146351,
          marketCap: 13053350.4089089,
          change24h: 1.7226176666370996,
        },
        usd: {
          price: 0.093924,
          marketCap: 106977510.82556757,
          change24h: 1.2827026300241688,
        },
        cny: {
          price: 0.681135,
          marketCap: 775800908.5070157,
          change24h: 1.3700665180188427,
        },
        eur: {
          price: 0.089166,
          marketCap: 101558351.05967677,
          change24h: 0.9894178793142621,
        },
        gbp: {
          price: 0.074262,
          marketCap: 84583480.57440819,
          change24h: 0.8703754861087402,
        },
        cad: {
          price: 0.131739,
          marketCap: 150048796.23415765,
          change24h: 1.0912043411544499,
        },
        aud: {
          price: 0.144875,
          marketCap: 165009815.0781347,
          change24h: 1.4041268258911828,
        },
        nzd: {
          price: 0.159614,
          marketCap: 181797260.96443695,
          change24h: 1.3370862865171955,
        },
        jpy: {
          price: 14.25,
          marketCap: 16232553537.649935,
          change24h: 1.1933386777987982,
        },
        rub: {
          price: 10.4,
          marketCap: 11847593615.767365,
          change24h: 6.321813624674142,
        },
        krw: {
          price: 131.09,
          marketCap: 149308654567.2437,
          change24h: 1.2979167540541081,
        },
        idr: {
          price: 1490.26,
          marketCap: 1697383312755.538,
          change24h: 1.2339330636094297,
        },
        php: {
          price: 5.52,
          marketCap: 6281612993.054057,
          change24h: 5.710493732541172,
        },
        thb: {
          price: 3.24,
          marketCap: 3688584573.265565,
          change24h: 0.819249871767915,
        },
        vnd: {
          price: 2380.53,
          marketCap: 2711380719469.433,
          change24h: 1.0516686450883532,
        },
        inr: {
          price: 7.94,
          marketCap: 9039499319.855299,
          change24h: 1.3648414521559307,
        },
        try: {
          price: 3.25,
          marketCap: 3706321658.5154734,
          change24h: 1.231727082952439,
        },
        sgd: {
          price: 0.12622,
          marketCap: 143762797.6980469,
          change24h: 1.2578376244311116,
        },
      },
      [subNativeTokenId("acala")]: {
        btc: {
          price: 9.8376e-7,
          marketCap: 1120.291917858449,
          change24h: -0.6995739004825059,
        },
        eth: {
          price: 0.00002615,
          marketCap: 29771.48035827377,
          change24h: -3.309408176133055,
        },
        tao: null,
        dot: {
          price: 0.01146351,
          marketCap: 13053350.4089089,
          change24h: 1.7226176666370996,
        },
        usd: {
          price: 0.093924,
          marketCap: 106977510.82556757,
          change24h: 1.2827026300241688,
        },
        cny: {
          price: 0.681135,
          marketCap: 775800908.5070157,
          change24h: 1.3700665180188427,
        },
        eur: {
          price: 0.089166,
          marketCap: 101558351.05967677,
          change24h: 0.9894178793142621,
        },
        gbp: {
          price: 0.074262,
          marketCap: 84583480.57440819,
          change24h: 0.8703754861087402,
        },
        cad: {
          price: 0.131739,
          marketCap: 150048796.23415765,
          change24h: 1.0912043411544499,
        },
        aud: {
          price: 0.144875,
          marketCap: 165009815.0781347,
          change24h: 1.4041268258911828,
        },
        nzd: {
          price: 0.159614,
          marketCap: 181797260.96443695,
          change24h: 1.3370862865171955,
        },
        jpy: {
          price: 14.25,
          marketCap: 16232553537.649935,
          change24h: 1.1933386777987982,
        },
        rub: {
          price: 10.4,
          marketCap: 11847593615.767365,
          change24h: 6.321813624674142,
        },
        krw: {
          price: 131.09,
          marketCap: 149308654567.2437,
          change24h: 1.2979167540541081,
        },
        idr: {
          price: 1490.26,
          marketCap: 1697383312755.538,
          change24h: 1.2339330636094297,
        },
        php: {
          price: 5.52,
          marketCap: 6281612993.054057,
          change24h: 5.710493732541172,
        },
        thb: {
          price: 3.24,
          marketCap: 3688584573.265565,
          change24h: 0.819249871767915,
        },
        vnd: {
          price: 2380.53,
          marketCap: 2711380719469.433,
          change24h: 1.0516686450883532,
        },
        inr: {
          price: 7.94,
          marketCap: 9039499319.855299,
          change24h: 1.3648414521559307,
        },
        try: {
          price: 3.25,
          marketCap: 3706321658.5154734,
          change24h: 1.231727082952439,
        },
        sgd: {
          price: 0.12622,
          marketCap: 143762797.6980469,
          change24h: 1.2578376244311116,
        },
      },
      [subAssetTokenId("astar", "18446744073709551616")]: {
        btc: {
          price: 9.8376e-7,
          marketCap: 1120.291917858449,
          change24h: -0.6995739004825059,
        },
        eth: {
          price: 0.00002615,
          marketCap: 29771.48035827377,
          change24h: -3.309408176133055,
        },
        tao: null,
        dot: {
          price: 0.01146351,
          marketCap: 13053350.4089089,
          change24h: 1.7226176666370996,
        },
        usd: {
          price: 0.093924,
          marketCap: 106977510.82556757,
          change24h: 1.2827026300241688,
        },
        cny: {
          price: 0.681135,
          marketCap: 775800908.5070157,
          change24h: 1.3700665180188427,
        },
        eur: {
          price: 0.089166,
          marketCap: 101558351.05967677,
          change24h: 0.9894178793142621,
        },
        gbp: {
          price: 0.074262,
          marketCap: 84583480.57440819,
          change24h: 0.8703754861087402,
        },
        cad: {
          price: 0.131739,
          marketCap: 150048796.23415765,
          change24h: 1.0912043411544499,
        },
        aud: {
          price: 0.144875,
          marketCap: 165009815.0781347,
          change24h: 1.4041268258911828,
        },
        nzd: {
          price: 0.159614,
          marketCap: 181797260.96443695,
          change24h: 1.3370862865171955,
        },
        jpy: {
          price: 14.25,
          marketCap: 16232553537.649935,
          change24h: 1.1933386777987982,
        },
        rub: {
          price: 10.4,
          marketCap: 11847593615.767365,
          change24h: 6.321813624674142,
        },
        krw: {
          price: 131.09,
          marketCap: 149308654567.2437,
          change24h: 1.2979167540541081,
        },
        idr: {
          price: 1490.26,
          marketCap: 1697383312755.538,
          change24h: 1.2339330636094297,
        },
        php: {
          price: 5.52,
          marketCap: 6281612993.054057,
          change24h: 5.710493732541172,
        },
        thb: {
          price: 3.24,
          marketCap: 3688584573.265565,
          change24h: 0.819249871767915,
        },
        vnd: {
          price: 2380.53,
          marketCap: 2711380719469.433,
          change24h: 1.0516686450883532,
        },
        inr: {
          price: 7.94,
          marketCap: 9039499319.855299,
          change24h: 1.3648414521559307,
        },
        try: {
          price: 3.25,
          marketCap: 3706321658.5154734,
          change24h: 1.231727082952439,
        },
        sgd: {
          price: 0.12622,
          marketCap: 143762797.6980469,
          change24h: 1.2578376244311116,
        },
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
