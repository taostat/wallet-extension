import { isObject, assert, u8aEq, objectSpread, stringToU8a, isHex, hexToU8a, u8aToU8a, u8aConcat, u8aToHex, u8aCmp, hexToNumber as hexToNumber$1, isNumber } from '@polkadot/util';
import { log, IS_FIREFOX, ASSET_DISCOVERY_API_URL, DEBUG, TEST, TAOSTATS_WEB_APP_DOMAIN, TAOSTATS_BASE_PATH, DEFAULT_ETH_CHAIN_ID, isTalismanUrl, isTalismanHostname, PORT_EXTENSION, PORT_CONTENT } from 'extension-shared';
import { d as db, ar as StorageProvider, p as passwordStore, B as activeNetworksStore, y as assetDiscoveryStore, z as activeTokensStore, c as appStore, C as isNetworkActive, s as settingsStore, r as remoteConfigStore, A as isTokenActive, k as isAccountCompatibleWithNetwork, as as filterActiveTokens, at as createSubscription, au as unsubscribe, av as sentry, H as privacyRoundCurrency, ab as LegacyAccountOrigin, o as getDerivationPathForCurve, I as runActionsOnTrees, N as addAccount, O as removeAccount, P as recGetAllAddresses, aw as genericAsyncSubscription, ax as sortAccounts, ay as genericSubscription, ad as ChangePasswordStatusUpdateStatus, an as decodeMetadataRpc, ao as encodeMetadataRpc, aq as getMetadataRpcFromDef, az as createNotification, aA as addEvmTransaction, aB as updateTransactionStatus, aC as getExtrinsicHash, aD as addSubstrateTransaction, aE as getTransactionStatus, v as getHumanReadableErrorMessage, Y as parseTransactionRequest, aF as urlToDomain, aG as sitesAuthorisedStore, af as ETH_NETWORK_ADD_PREFIX, ag as WATCH_ASSET_PREFIX, aH as getPublicAccounts, aI as filterAccountsByAddresses, a5 as isValidAddEthereumRequestParam, a7 as isValidWatchAssetRequestParam, a9 as isValidRequestedPermissions, T as TalismanNotOnboardedError, aJ as getEvmErrorCause, a8 as sanitizeWatchAssetRequestParam, x as getErc20TokenInfo, aK as SubscribableStorageProvider, ap as getMetadataFromDef, F as isJsonPayload, aL as addSolTransaction, aM as dismissTransaction, aN as updateTransactionsRestart, h as errorsStore, ae as ENCRYPT_ENCRYPT_PREFIX, E as ENCRYPT_DECRYPT_PREFIX, ah as METADATA_PREFIX, aO as cleanupEvmErrorMessage, ac as SubstrateLedgerAppType, aP as mnemonicsStore, aQ as MnemonicSource, aR as encryptMnemonic$1, aS as migrateConnectAllSubstrate, b as sessionStore } from '../../dist/helpers-BTUQpWdR.esm.js';
import PromisePool from '@supercharge/promise-pool';
import { erc20BalancesAggregatorAbi, abiMulticall, getBalanceId, BalancesProvider, Balances } from '@taostats-wallet/balances';
import { getCleanToken, getCleanNetwork, CustomChaindataSchema, TokenSchema, ChaindataProvider, evmErc20TokenId, evmNativeTokenId, isTokenEth, networkIdFromTokenId, solSplTokenId, isTokenCustom, isNetworkCustom, isNativeToken, isNetworkOfPlatform, getBlockExplorerUrls, getChaindataDbV3, subForeignAssetTokenId, subNativeTokenId } from '@taostats-wallet/chaindata-provider';
import { isEthereumAddress, isSolanaAddress, normalizeAddress, isAddressEqual, getPublicKeyFromSecret, getAccountPlatformFromAddress, addressFromMnemonic, base64, base58, hex, isValidMnemonic, encodeAnyAddress, ed25519, encryptKemAead, blake2b256, isValidDerivationPath } from '@taostats-wallet/crypto';
import { Keyring, isAccountNotContact, isAccountPlatformEthereum, isAccountPlatformSolana, isAccountOwned, isAccountPortfolio, isAccountPlatformPolkadot } from '@taostats-wallet/keyring';
import { isTruthy, throwAfter, sleep, splitSubject, firstThenDebounce, keepAlive, isNotNil, getSharedObservable, getLoadable$, getQuery$, addTrailingSlash } from '@taostats-wallet/util';
import { isEqual, values, assign, keyBy, uniq, groupBy, sortBy, chunk, fromPairs, toPairs, capitalize } from 'lodash-es';
import { BehaviorSubject, filter, distinctUntilChanged, shareReplay, firstValueFrom, map, debounceTime, ReplaySubject, pairwise, combineLatest, distinct, distinctUntilKeyChanged, skip, switchMap, first, Observable, tap, throttleTime, of, startWith, take } from 'rxjs';
import { erc20Abi, withRetry, bytesToHex, getAddress, toHex, createClient, http, recoverMessageAddress } from 'viem';
import { ChainConnectorEth, ChainConnectorSol, ChainConnectorDot } from '@taostats-wallet/chain-connectors';
import pako from 'pako';
import urlJoin from 'url-join';
import { PublicKey } from '@solana/web3.js';
import { connectionMetaDb } from '@taostats-wallet/connection-meta';
import * as Sentry from '@sentry/browser';
import { captureException } from '@sentry/browser';
import { v4 } from 'uuid';
import groupBy$1 from 'lodash-es/groupBy';
import { fetchTokenRates } from '@taostats-wallet/token-rates';
import debounce from 'lodash-es/debounce';
import keyring from '@polkadot/ui-keyring';
import { AccountsStore } from '@polkadot/extension-base/stores';
import { jsonDecrypt, jsonEncrypt, cryptoWaitReady, naclEncrypt, randomAsU8a, sr25519PairFromSeed, mnemonicToMiniSecret, mnemonicGenerate, hmacSha256AsU8a, sr25519Agreement, pbkdf2Encode, naclDecrypt, xxhashAsHex, isEthereumAddress as isEthereumAddress$1 } from '@polkadot/util-crypto';
import { checkHost } from '@polkadot/phishing';
import { Dexie } from 'dexie';
import metamaskInitialData from 'eth-phishing-detect/src/config.json';
import MetamaskDetector from 'eth-phishing-detect/src/detector';
import { decompressFromUTF16 } from 'lz-string';
import { Err, Ok } from 'ts-results';
import { parseTransactionInfo, deserializeTransaction, getKeypair, isVersionedTransaction } from '@taostats-wallet/solana';
import { sign } from '@polkadot/types/extrinsic/util';
import { getMetadataVersion, getConstantValueFromMetadata, parseMetadataRpc, Binary, FixedSizeBinary, mergeUint8 } from '@taostats-wallet/scale';
import { fetchBestMetadata, MAX_SUPPORTED_METADATA_VERSION } from '@taostats-wallet/sapi';
import { typesBundle } from '@polkadot/apps-config/api';
import { TypeRegistry, Metadata } from '@polkadot/types';
import { getSpecTypes, getSpecAlias } from '@polkadot/types-known/util';
import Keyring$1, { Keyring as Keyring$2 } from '@polkadot/keyring';
import PQueue from 'p-queue';
import { getTalismanOrbDataUrl } from '@taostats-wallet/orb';
import { SolanaSignAndSendTransaction, SolanaSignTransaction, SolanaSignMessage, SolanaSignIn } from '@solana/wallet-standard-features';
import { personalSign, signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { privateKeyToAccount } from 'viem/accounts';
import { Struct, Bytes, str, u8, u16 } from 'scale-ts';
import { getPublicKeySolana } from '@taostats-wallet/crypto/src/derivation/deriveSolana';
import { OnChainId } from '@taostats-wallet/on-chain-id';
import RequestBytesSign from '@polkadot/extension-base/background/RequestBytesSign';
import RequestExtrinsicSign from '@polkadot/extension-base/background/RequestExtrinsicSign';
import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';
import assert$1 from 'assert';
import i18next from 'i18next';
import { hexToNumber, isHex as isHex$1 } from 'viem/utils';
import md5 from 'blueimp-md5';
import { decrypt, encrypt } from '@metamask/browser-passworder';
import 'semver';
import 'bcryptjs';
import 'yup';
import 'lodash-es/merge';
import 'toml';
import 'bignumber.js';

const getBlobStore = id => ({
  set: data => db.blobs.put({
    id,
    data: pako.deflate(JSON.stringify(data))
  }),
  get: async () => {
    try {
      const blob = await db.blobs.get(id);
      if (!blob?.data) return null;
      return JSON.parse(pako.inflate(blob.data, {
        to: "string"
      }));
    } catch (err) {
      log.error("Error parsing blob data", {
        id,
        err
      });
      return null;
    }
  }
});

const LEGACY_SEED_PREFIX = "----";
const decryptLegacyMnemonicObject = ({
  seed
}) => {
  if (!seed.startsWith(LEGACY_SEED_PREFIX)) return Err("Unable to decrypt seed");
  const seedString = seed.split(LEGACY_SEED_PREFIX)[1];
  return Ok(seedString);
};
let MnemonicErrors = /*#__PURE__*/function (MnemonicErrors) {
  MnemonicErrors["IncorrectPassword"] = "Incorrect password";
  MnemonicErrors["UnableToDecrypt"] = "Unable to decrypt mnemonic";
  MnemonicErrors["UnableToEncrypt"] = "Unable to encrypt mnemonic";
  MnemonicErrors["NoMnemonicPresent"] = "No mnemonic present";
  MnemonicErrors["MnemonicNotFound"] = "Mnemonic not found";
  MnemonicErrors["AlreadyExists"] = "Seed already exists in SeedPhraseStore";
  return MnemonicErrors;
}({});
const decryptMnemonic = async (cipher, password) => {
  let mnemonic;
  try {
    mnemonic = await decrypt(password, cipher);
  } catch (e) {
    log.error("Error decrypting mnemonic: ", e);
    return Err(MnemonicErrors.IncorrectPassword);
  }
  try {
    if (isObject(mnemonic)) {
      const unpackResult = decryptLegacyMnemonicObject(mnemonic);
      if (unpackResult.err) throw new Error(unpackResult.val);
      mnemonic = unpackResult.val;
    }
  } catch (e) {
    log.error(e);
    return Err(MnemonicErrors.UnableToDecrypt);
  }
  return Ok(mnemonic);
};

const storageKey = "nursery";
const encryptMnemonic = async (seed, password) => {
  const cipher = await encrypt(password, seed);
  const checkedSeed = await decrypt(password, cipher);
  assert(seed === checkedSeed, "Seed encryption failed");
  return cipher;
};
class SeedPhraseStore extends StorageProvider {
  async add(seed, password, confirmed = false) {
    const storedCipher = await this.get("cipher");
    if (storedCipher) return Err("Seed already exists in SeedPhraseStore");
    const cipher = await encryptMnemonic(seed, password);
    await this.set({
      cipher,
      confirmed
    });
    return Ok(true);
  }
  async setConfirmed(confirmed = false) {
    await this.set({
      confirmed
    });
    return true;
  }
  async getSeed(password) {
    let seed;
    const cipher = await this.get("cipher");
    if (!cipher) return Ok(undefined);
    try {
      // eslint-disable-next-line no-var
      var decryptedSeed = await decrypt(password, cipher);
    } catch (e) {
      log.error(e);
      return Err("Incorrect password");
    }
    try {
      if (isObject(decryptedSeed)) {
        const unpackResult = decryptLegacyMnemonicObject(decryptedSeed);
        if (unpackResult.err) throw new Error(unpackResult.val);
        seed = unpackResult.val;
      } else {
        seed = decryptedSeed;
      }
    } catch (e) {
      log.error(e);
      return Err("Unable to decrypt seed");
    }
    return Ok(seed);
  }
}
const createLegacySeedPhraseStore = () => {
  return new SeedPhraseStore(storageKey);
};
const createLegacyVerifierCertificateMnemonicStore = () => {
  return new SeedPhraseStore("verifierCertificateMnemonic");
};

const subjectIsWalletReady = new BehaviorSubject(false);
const isWalletReady$ = subjectIsWalletReady.asObservable();

// fires only once wallet is ready
const walletReady$ = isWalletReady$.pipe(filter(isReady => isReady), distinctUntilChanged(), shareReplay(1));

// returns a promise that resolves when the wallet is ready
const walletReady = firstValueFrom(walletReady$.pipe(map(() => {})));
const setWalletReady = () => {
  subjectIsWalletReady.next(true);
};

const blobStore$6 = getBlobStore("chaindata");
const loadChaindataPersistedStorage = async () => {
  try {
    return (await blobStore$6.get()) ?? undefined;
  } catch (error) {
    log.error("[chaindata] failed to load chaindata store on startup", error);
    return undefined;
  }
};
const streamChaindataStorageChangesToDisk = storage$ => {
  // persist store to db on changes
  storage$.pipe(debounceTime(2_000), distinctUntilChanged(isEqual)).subscribe(storage => {
    log.debug(`[chaindata] updating db blob with data (networks:${storage.networks.length}, tokens:${storage.tokens.length}, meta:${storage.miniMetadatas.length})`);
    blobStore$6.set(storage);
  });
};

const DEFAULT_DATA$3 = {
  networks: [],
  tokens: []
};
class CustomChaindataStore extends StorageProvider {}
const store = new CustomChaindataStore("customChaindata", DEFAULT_DATA$3);
const upsert = async (networks, tokens) => store.mutate(prev => {
  const next = {
    networks: networks.length ? values(assign(keyBy(prev.networks, "id"), keyBy(networks.map(getCleanNetwork), "id"))) : prev.networks,
    tokens: tokens.length ? values(assign(keyBy(prev.tokens, "id"), keyBy(tokens.map(getCleanToken), "id"))) : prev.tokens
  };
  return CustomChaindataSchema.parse(next);
});
const remove = (networkIds, tokenIds) => store.mutate(prev => {
  const next = {
    networks: networkIds.length ? prev.networks?.filter(({
      id
    }) => !networkIds.includes(id)) ?? [] : prev.networks,
    tokens: tokenIds.length ? prev.tokens.filter(({
      id
    }) => !tokenIds.includes(id)) : prev.tokens
  };
  return CustomChaindataSchema.parse(next);
});
const customChaindataStore = {
  /** data source for wallet's chaindataProvider */
  observable$: store.observable.asObservable(),
  upsert,
  remove,
  upsertToken: token => upsert([], [token]),
  upsertNetwork: (network, nativeToken) => upsert([network], [nativeToken]),
  removeToken: tokenId => remove([], [tokenId]),
  removeNetwork: async networkId => {
    const {
      networks
    } = await store.get();
    const network = networks?.find(({
      id
    }) => id === networkId);
    const tokenIds = network?.nativeTokenId ? [network.nativeTokenId] : [];
    remove([networkId], tokenIds);
  }
};

const blobStore$5 = getBlobStore("dynamic-tokens");
const normalizeDynamicTokens = tokens => {
  if (!tokens) return [];
  return values(keyBy(tokens, t => t.id)).filter(t => TokenSchema.safeParse(t).success).sort((a, b) => a.id.localeCompare(b.id));
};
const getStore = () => {
  const subject = new ReplaySubject(1);

  // load initial data
  blobStore$5.get().then(tokens => {
    subject.next(normalizeDynamicTokens(tokens));
  }).catch(error => {
    log.error("[dynamicTokens] failed to load dynamicTokens store on startup", error);
    subject.next([]);
  });

  // persist changes (this never unsubscribes)
  subject.pipe(debounceTime(500), map(normalizeDynamicTokens), pairwise()).subscribe(([previousTokens, currentTokens]) => {
    // Compare previousTokens with currentTokens
    if (!isEqual(previousTokens, currentTokens)) {
      log.debug(`[dynamicTokens] updating storage previous:${previousTokens.length} new:${currentTokens.length}`);
      blobStore$5.set(currentTokens);
    }
  });
  return subject;
};

// this store is an ReplaySubject so it can be updated by the chaindataProvider when new dynamic tokens are discovered
const dynamicTokensStore$ = getStore();

const chaindataProvider = new ChaindataProvider({
  persistedStorage: loadChaindataPersistedStorage(),
  customChaindata$: customChaindataStore.observable$,
  dynamicTokens$: dynamicTokensStore$
});
streamChaindataStorageChangesToDisk(chaindataProvider.storage$);

const chainConnectorEvm = new ChainConnectorEth(chaindataProvider);

/**
 * Used to check if the current page is a background page.
 *
 * It is useful for preventing the execution of certain code inside or outside of the background page.
 */
const isBackgroundPage = () => {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.extension) {
      return IS_FIREFOX ? chrome.extension.getBackgroundPage() === window : typeof window === "undefined";
    }
  } catch (err) {
    log.error(err);
  }
  return false;
};

const TALISMAN_KEYRING_LOCAL_STORAGE_KEY = "keyring";

/**
 * Keyring with data stored in extension's local storage.
 * Also provides observables for accounts and mnemonics.
 */
class KeyringStore {
  #json$ = new ReplaySubject(1);
  #lock = false;
  #keyring$;
  #accounts$;
  #mnemonics$;
  constructor() {
    if (!isBackgroundPage()) throw new Error("Keyring store should only be accessed from the background thread");
    this.#keyring$ = this.#json$.pipe(map(json => json ? Keyring.load(json) : Keyring.create()), map(keyring => Object.freeze(keyring)), shareReplay(1));
    this.#accounts$ = this.#keyring$.pipe(map(keyring => keyring.getAccounts()), distinctUntilChanged(isEqual), shareReplay(1));
    this.#mnemonics$ = this.#keyring$.pipe(map(keyring => keyring.getMnemonics()), distinctUntilChanged(isEqual), shareReplay(1));
    this.init();
  }
  get accounts$() {
    return this.#accounts$;
  }
  get mnemonics$() {
    return this.#mnemonics$;
  }
  async init() {
    try {
      const storage = await chrome.storage.local.get(TALISMAN_KEYRING_LOCAL_STORAGE_KEY);
      this.#json$.next(storage[TALISMAN_KEYRING_LOCAL_STORAGE_KEY]);
    } catch (cause) {
      throw new Error("Failed to load keyring", {
        cause
      });
    }
  }
  async save(keyring) {
    try {
      const json = keyring.toJson();
      await chrome.storage.local.set({
        [TALISMAN_KEYRING_LOCAL_STORAGE_KEY]: json
      });
      this.#json$.next(json);
    } catch (err) {
      throw new Error("Failed to save keyring", {
        cause: err
      });
    }
  }
  async load() {
    const json = await firstValueFrom(this.#json$);
    return json ? Keyring.load(json) : Keyring.create();
  }
  async withLock(fn) {
    if (this.#lock) throw new Error("Another change is already in progress");
    this.#lock = true;
    try {
      return await fn();
    } finally {
      this.#lock = false;
    }
  }

  /**
   * Wraps an atomic change that requires password to be provided
   * @param change
   * @returns
   */
  async updateWithPassword(change) {
    return this.withLock(async () => {
      const password = await passwordStore.getPassword();
      assert(password, "Not logged in");
      const keyring = await this.load();
      const returnValue = await change(keyring, password);
      await this.save(keyring);
      return returnValue;
    });
  }

  /**
   * Wraps an atomic change that does not require password to be provided
   * @param change
   * @returns
   */
  async updateWithoutPassword(change) {
    return this.withLock(async () => {
      const keyring = await this.load();
      const returnValue = await change(keyring);
      await this.save(keyring);
      return returnValue;
    });
  }
  addMnemonic(options) {
    return this.updateWithPassword((keyring, password) => keyring.addMnemonic(options, password));
  }
  async getMnemonics() {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getMnemonics();
  }
  async getMnemonic(id) {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getMnemonic(id);
  }
  async getMnemonicText(id, password) {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getMnemonicText(id, password);
  }
  async getExistingMnemonicId(mnemonic) {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getExistingMnemonicId(mnemonic);
  }
  updateMnemonic(id, options) {
    return this.updateWithoutPassword(keyring => keyring.updateMnemonic(id, options));
  }
  removeMnemonic(id) {
    return this.updateWithoutPassword(keyring => keyring.removeMnemonic(id));
  }
  async getAccounts() {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getAccounts();
  }
  async getAccount(address) {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getAccount(address);
  }
  updateAccount(id, options) {
    return this.updateWithoutPassword(keyring => keyring.updateAccount(id, options));
  }
  removeAccount(address) {
    return this.updateWithoutPassword(keyring => keyring.removeAccount(address));
  }
  addAccountExternal(options) {
    return this.updateWithoutPassword(keyring => keyring.addAccountExternal(options));
  }
  addAccountExternalMulti(options) {
    return this.updateWithoutPassword(keyring => Promise.all(options.map(acc => keyring.addAccountExternal(acc))));
  }
  addAccountDerive(options) {
    return this.updateWithPassword((keyring, password) => keyring.addAccountDerive(options, password));
  }
  addAccountDeriveMulti(options) {
    return this.updateWithPassword(async (keyring, password) => {
      // create accounts sequentially to prevent adding the same mnemonic multiple times
      const results = [];
      for (const option of options) {
        results.push(await keyring.addAccountDerive(option, password));
      }
      return results;
    });
  }
  addAccountKeypair(options) {
    return this.updateWithPassword((keyring, password) => keyring.addAccountKeypair(options, password));
  }
  addAccountKeypairMulti(options) {
    return this.updateWithPassword((keyring, password) => Promise.all(options.map(acc => keyring.addAccountKeypair(acc, password))));
  }
  async getAccountSecretKey(address, password) {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getAccountSecretKey(address, password);
  }
  async getDerivedAddress(mnemonicId, derivationPath, curve, password) {
    const keyring = await firstValueFrom(this.#keyring$);
    return keyring.getDerivedAddress(mnemonicId, derivationPath, curve, password);
  }
  reset() {
    return this.withLock(() => {
      const emptyKeyring = Keyring.create();
      this.#json$.next(emptyKeyring.toJson());
    });
  }
  async changePassword(oldPassword, newPassword) {
    return this.withLock(async () => {
      const keyring = await this.load();
      const serialized = await keyring.export(oldPassword, newPassword);
      await chrome.storage.local.set({
        [TALISMAN_KEYRING_LOCAL_STORAGE_KEY]: serialized
      });
      this.#json$.next(serialized);
    });
  }
  async backup(password, jsonPassword) {
    return this.withLock(async () => {
      const keyring = await this.load();
      return keyring.export(password, jsonPassword);
    });
  }
  async restore(json, jsonPassword, password) {
    return this.withLock(async () => {
      const keyring = Keyring.load(json);

      // changes all passwords to the local one
      const newJson = await keyring.export(jsonPassword, password);

      // persist new data
      await chrome.storage.local.set({
        [TALISMAN_KEYRING_LOCAL_STORAGE_KEY]: newJson
      });
      this.#json$.next(newJson);
    });
  }

  /**
   * use this method to force keyring storage to be updated
   * this is because keyring updates its schema on load, but doesnt persist changes automatically
   * */
  forceUpdate() {
    return this.updateWithoutPassword(() => {});
  }
}
const keyringStore = new KeyringStore();
keyringStore.accounts$.subscribe(accounts => {
  log.debug("[KeyringStore] accounts$", accounts);
});
keyringStore.mnemonics$.subscribe(mnemonics => {
  log.debug("[KeyringStore] mnemonics$", mnemonics);
});

/**
 *
 * @param addresses
 * @returns list of all token ids that were found
 */
const fetchMissingTokens = async addresses => {
  const stop = log.timer("[AssetDiscovery] fetchMissingTokens");
  const evmAddresses = addresses.map(isEthereumAddress);
  if (!evmAddresses.length) return [];
  const discoveredAssets = await discoverTokensFromApi(addresses);
  if (!discoveredAssets.length) return [];

  // for now, consider only tokens defined in chain data
  const foundTokenIds = await getDiscoveredTokenIds(discoveredAssets);
  stop();
  return foundTokenIds;
};
const discoverTokensFromApi = async addresses => {
  try {
    const url = urlJoin(ASSET_DISCOVERY_API_URL, "discover");
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        addresses
      })
    });
    if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
    return await response.json();
  } catch (err) {
    log.error("[AssetDiscovery] Unable to fetch tokens from Asset Discovery API", {
      err
    });
    return [];
  }
};
const getTokenIdFromAsset = asset => {
  switch (asset.type) {
    case "native":
      return evmNativeTokenId(asset.networkId);
    case "erc20":
      return evmErc20TokenId(asset.networkId, asset.contractAddress);
    default:
      return null;
  }
};
const getDiscoveredTokenIds = async assets => {
  const tokensById = await chaindataProvider.getTokensMapById();
  return assets.map(getTokenIdFromAsset).filter(id => !!id && !!tokensById[id] && !tokensById[id].noDiscovery);
};

// TODO - flag these tokens as ignored from chaindata
const IGNORED_COINGECKO_IDS = ["position-token",
// BSC - POSI
"tangyuan",
// BSC - TangYuan
"malou",
// BSC - NEVER

"outter-finance",
// BSC - OUT (temporary workaround, error breaks scans with Manifest V3)
"peri-finance" // Mainnet - PERI (timeouts on balance reads)
];
const MANUAL_SCAN_MAX_CONCURRENT_NETWORK = 4;
const BALANCES_FETCH_CHUNK_SIZE = 50;
const NETWORK_BALANCES_FETCH_CHUNK_SIZE = {
  "1": 200
};

// native tokens should be processed and displayed first
const getSortableIdentifier = (tokenId, address, tokens) => {
  const token = tokens[tokenId];
  if (!token?.networkId) {
    log.warn("No token or network found for tokenId", tokenId);
    return `${tokenId}::${address}`;
  }
  return `${token.networkId}::${tokens[tokenId].type === "evm-native" ? "t1" : "t2"}::${tokenId}::${address}`;
};
class AssetDiscoveryScanner {
  #isBusy = false;
  #preventAutoStart = false;
  constructor() {
    this.watchNewAccounts();
    this.watchEnabledNetworks();
    this.scanOnUnlock();
    this.resume();
  }
  watchNewAccounts = async () => {
    let prevAllAddresses = null;

    // identify newly added accounts and scan those
    combineLatest({
      isWalletReady: isWalletReady$,
      accounts: keyringStore.accounts$
    }).pipe(filter(({
      isWalletReady
    }) => isWalletReady), map(({
      accounts
    }) => accounts.filter(isAccountNotContact).map(account => account.address).sort()), distinct(addresses => addresses.join(""))).subscribe(async allAddresses => {
      try {
        if (prevAllAddresses && !this.#preventAutoStart) {
          const addresses = allAddresses.filter(k => !prevAllAddresses.includes(k));
          if (addresses.length) {
            const networkIds = await getActiveNetworkIdsToScan();
            log.debug("[AssetDiscovery] New accounts detected, starting scan", {
              addresses,
              networkIds
            });
            await this.startScan({
              networkIds,
              addresses,
              withApi: true
            });
          }
        }
        prevAllAddresses = allAddresses; // update reference
      } catch (err) {
        log.error("[AssetDiscovery] Failed to start scan after account creation", {
          err
        });
      }
    });
  };
  watchEnabledNetworks = () => {
    let prevAllActiveNetworkIds = null;

    // identify newly enabled networks and scan those
    combineLatest({
      isWalletReady: isWalletReady$,
      networksById: chaindataProvider.getNetworksMapById$("ethereum"),
      activeNetworks: activeNetworksStore.observable
    }).pipe(filter(({
      isWalletReady
    }) => !!isWalletReady), map(({
      networksById,
      activeNetworks
    }) => Object.keys(activeNetworks).filter(k => !!activeNetworks[k] && networksById[k]).sort()), distinct(allActiveNetworkIds => allActiveNetworkIds.join(""))).subscribe(async allActiveNetworkIds => {
      try {
        if (prevAllActiveNetworkIds && !this.#preventAutoStart) {
          const networkIds = allActiveNetworkIds.filter(k => !prevAllActiveNetworkIds.includes(k));
          if (networkIds.length) {
            const accounts = await keyringStore.getAccounts();
            const addresses = accounts.filter(isAccountNotContact).map(acc => acc.address);
            log.debug("[AssetDiscovery] New enabled networks detected, starting scan", {
              addresses,
              networkIds
            });

            // `withApi: false` because api always scans all networks, we dont need to call it again
            await this.startScan({
              networkIds,
              addresses,
              withApi: false
            });
          }
        }
        prevAllActiveNetworkIds = allActiveNetworkIds;
      } catch (err) {
        log.error("[AssetDiscovery] Failed to start scan after active networks list changed", {
          err
        });
      }
    });
  };
  scanOnUnlock = () => {
    isWalletReady$ // true means user has logged in and migrations are complete (it doesnt mean that they succeded though)
    .pipe(filter(isTruthy), debounceTime(10_000)).subscribe(async () => {
      try {
        const accounts = await keyringStore.getAccounts();
        const addresses = accounts.filter(isAccountNotContact).map(acc => acc.address);
        const networkIds = await getNetworkIdsToForceScan();
        if (!addresses.length || !networkIds.length) return;

        // on wallet unlock, scan networks with forceScan:true
        // this helps discovery during growth campagins, where users are incentivized to send tokens from CEXs
        await this.startScan({
          addresses,
          networkIds,
          withApi: true
        });
      } catch (err) {
        log.error("[AssetDiscovery] Failed to start scan on unlock", {
          err
        });
      }
    });
  };
  resume() {
    setTimeout(() => {
      this.executeNextScan();
      // resume after 5 sec to not interfere with other startup routines
      // could be longer but because of MV3 it's better to start asap
    }, 5_000);
  }
  async startScan(scope, dequeue) {
    const evmNetworksMap = await chaindataProvider.getNetworksMapById("ethereum");

    // for now we only support ethereum addresses and networks
    const addresses = scope.addresses.filter(address => isEthereumAddress(address));
    const networkIds = scope.networkIds.filter(id => evmNetworksMap[id]);
    if (!addresses.length || !networkIds.length) return false;
    log.debug("[AssetDiscovery] Enqueue scan", {
      addresses,
      networkIds,
      dequeue
    });

    // add to queue
    await assetDiscoveryStore.mutate(state => ({
      ...state,
      queue: [...(state.queue ?? []), {
        ...scope,
        addresses,
        networkIds
      }]
    }));

    // for front end calls, dequeue as part of this promise to keep UI in sync
    if (dequeue && !this.#isBusy) {
      this.#isBusy = true;
      try {
        await this.dequeue();
      } finally {
        this.#isBusy = false;
      }
    }
    this.executeNextScan();
    return true;
  }
  async stopScan() {
    await assetDiscoveryStore.set({
      currentScanScope: null,
      currentScanProgressPercent: undefined,
      currentScanCursors: undefined,
      currentScanTokensCount: undefined,
      queue: []
    });
    await db.assetDiscovery.clear();
    return true;
  }
  async dequeue() {
    const scope = await assetDiscoveryStore.get("currentScanScope");
    if (!scope) {
      const queue = await assetDiscoveryStore.get("queue");
      if (queue?.length) {
        await this.enableDiscoveredTokens(); // enable pending discovered tokens before flushing the table

        await db.assetDiscovery.clear();
        await assetDiscoveryStore.mutate(prev => {
          // merge queue
          const queue = prev.queue ?? [];
          const mergedScope = {
            addresses: uniq(queue.map(s => s.addresses).flat()),
            networkIds: uniq(queue.map(s => s.networkIds).flat()),
            withApi: queue.some(s => s.withApi)
          };
          const currentScanScope = mergedScope.networkIds.length && mergedScope.addresses.length ? mergedScope : null;
          return {
            ...prev,
            currentScanScope,
            currentScanProgressPercent: 0,
            currentScanTokensCount: 0,
            currentScanCursors: {},
            queue: []
          };
        });
      }
    }
  }

  /** modifies the scope of next scan if necessary */
  async getEffectiveCurrentScanScope() {
    const scope = await assetDiscoveryStore.get("currentScanScope");
    if (!scope) return null;
    if (!scope.withApi) return scope;
    const foundTokenIds = await fetchMissingTokens(scope.addresses);
    const [allTokens, evmNetworks, activeTokens, activeNetworks] = await Promise.all([chaindataProvider.getTokens(), chaindataProvider.getNetworksMapById("ethereum"), activeTokensStore.get(), activeNetworksStore.get()]);
    const tokensMap = Object.fromEntries(allTokens.map(token => [token.id, token]));

    // add all networks that contain an asset that was discovered and whose enabled status is not set yet
    // key idea: dont scan mainnet (8K tokens) unless a new token is found on it
    const additionalNetworkIds = foundTokenIds.map(tokenId => tokensMap[tokenId]).filter(token => {
      if (!token || token.noDiscovery) return false;
      if (activeNetworks[token.networkId ?? ""] === false) return false;
      switch (token.type) {
        case "evm-erc20":
        case "evm-native":
          return activeTokens[token.id] === undefined;
        default:
          return false;
      }
    }).map(t => {
      log.debug("[AssetDiscovery] Forcing scan because of", t.id);
      return t.networkId;
    }).filter(id => !!id);
    const networkIdsToScan = [...new Set([...scope.networkIds, ...additionalNetworkIds])];
    const tokensToScan = allTokens.filter(isTokenEth).filter(t => networkIdsToScan.includes(t.networkId ?? "")).filter(token => {
      const evmNetwork = evmNetworks[token.networkId ?? ""];
      if (!evmNetwork) return false;
      if (!evmNetwork.forceScan && evmNetwork.isTestnet) return false;
      if (token.coingeckoId && IGNORED_COINGECKO_IDS.includes(token.coingeckoId)) return false;
      if (token.noDiscovery) return false;
      // scan only if token has never been enabled or disabled
      return activeTokens[token.id] === undefined;
    });
    await assetDiscoveryStore.mutate(prev => ({
      ...prev,
      currentScanScope: {
        ...(prev.currentScanScope ?? {
          addresses: scope.addresses
        }),
        networkIds: networkIdsToScan,
        withApi: false // dot not call api again if scan is stopped then resumed
      },
      currentScanTokensCount: tokensToScan.length
    }));

    // refresh scope and return
    return await assetDiscoveryStore.get("currentScanScope");
  }
  async executeNextScan() {
    if (this.#isBusy) return;
    this.#isBusy = true;
    const abortController = new AbortController();
    try {
      await this.dequeue();
      const scope = await this.getEffectiveCurrentScanScope();
      if (!scope) return;
      log.debug("[AssetDiscovery] Scanner proceeding with scan", scope);
      const {
        currentScanCursors: cursors
      } = await assetDiscoveryStore.get();
      const [allTokens, evmNetworks, activeTokens] = await Promise.all([chaindataProvider.getTokens(), chaindataProvider.getNetworksMapById("ethereum"), activeTokensStore.get(), activeNetworksStore.get()]);
      const tokensMap = Object.fromEntries(allTokens.map(token => [token.id, token]));
      const tokensToScan = allTokens.filter(isTokenEth).filter(t => scope.networkIds.includes(t.networkId ?? "")).filter(token => {
        const evmNetwork = evmNetworks[token.networkId ?? ""];
        if (!evmNetwork) return false;
        if (!evmNetwork.forceScan && evmNetwork.isTestnet) return false;
        if (token.coingeckoId && IGNORED_COINGECKO_IDS.includes(token.coingeckoId)) return false;
        if (token.noDiscovery) return false;
        // scan only if token has never been enabled or disabled
        return activeTokens[token.id] === undefined;
      });
      const tokensByNetwork = groupBy(tokensToScan, t => t.networkId);
      const totalChecks = tokensToScan.length * scope.addresses.length;
      const totalTokens = tokensToScan.length;
      log.debug("[AssetDiscovery] Starting scan: %d tokens, %d total checks", totalTokens, totalChecks, {
        networkIds: scope.networkIds
      });
      const subScopeChange = assetDiscoveryStore.observable.pipe(distinctUntilKeyChanged("currentScanScope", isEqual), skip(1)).subscribe(() => {
        log.debug("[AssetDiscovery] Scan cancelled due to currentScanScope change");
        subScopeChange.unsubscribe();
        abortController.abort();
      });
      const erc20aggregators = Object.fromEntries(Object.values(evmNetworks).filter(n => n.contracts?.Erc20Aggregator).map(n => [n.id, n.contracts?.Erc20Aggregator]));
      const stop = log.timer("[AssetDiscovery] Scan completed");

      // process multiple networks at a time
      await PromisePool.withConcurrency(MANUAL_SCAN_MAX_CONCURRENT_NETWORK).for(Object.keys(tokensByNetwork).sort((a, b) => Number(a) - Number(b))).process(async networkId => {
        // stop if scan was cancelled
        if (abortController.signal.aborted) return;
        try {
          const client = await chainConnectorEvm.getPublicClientForEvmNetwork(networkId);
          if (!client) return;

          // build the list of token+address to check balances for
          const allChecks = sortBy(tokensByNetwork[networkId].map(t => scope.addresses.map(a => ({
            tokenId: t.id,
            type: t.type,
            address: a
          }))).flat(), c => getSortableIdentifier(c.tokenId, c.address, tokensMap));
          let startIndex = 0;

          // skip checks that were already scanned
          if (cursors[networkId]) {
            const {
              tokenId,
              address
            } = cursors[networkId];
            startIndex = 1 + allChecks.findIndex(c => c.tokenId === tokenId && c.address === address);
          }
          const remainingChecks = allChecks.slice(startIndex);

          //Split into chunks of 50 token+id
          const chunkedChecks = chunk(remainingChecks, NETWORK_BALANCES_FETCH_CHUNK_SIZE[networkId] ?? BALANCES_FETCH_CHUNK_SIZE);
          for (const checks of chunkedChecks) {
            // stop if scan was cancelled
            if (abortController.signal.aborted) return;
            const res = await Promise.race([getEvmTokenBalances(client, checks.map(c => ({
              token: tokensMap[c.tokenId],
              address: c.address
            })), erc20aggregators[networkId]), throwAfter(10_000, "Timeout")]);

            // stop if scan was cancelled
            if (abortController.signal.aborted) return;
            const newBalances = checks.map((check, i) => [check, res[i]]).filter(([, res]) => res !== "0").map(([{
              address,
              tokenId
            }, res]) => ({
              id: getSortableIdentifier(tokenId, address, tokensMap),
              tokenId,
              address,
              balance: res
            }));
            await assetDiscoveryStore.mutate(prev => {
              if (abortController.signal.aborted) return prev;
              const currentScanCursors = {
                ...prev.currentScanCursors,
                [networkId]: {
                  address: checks[checks.length - 1].address,
                  tokenId: checks[checks.length - 1].tokenId,
                  scanned: (prev.currentScanCursors[networkId]?.scanned ?? 0) + checks.length
                }
              };

              // Update progress
              // in case of full scan it takes longer to scan networks
              // in case of active scan it takes longer to scan tokens
              // => use the min of both ratios as current progress
              const totalScanned = Object.values(currentScanCursors).reduce((acc, cur) => acc + cur.scanned, 0);
              const tokensProgress = Math.round(100 * totalScanned / totalChecks);
              const networksProgress = Math.round(100 * Object.keys(currentScanCursors).length / Object.keys(tokensByNetwork).length);
              const currentScanProgressPercent = Math.min(tokensProgress, networksProgress);
              return {
                ...prev,
                currentScanCursors,
                currentScanProgressPercent,
                currentScanTokensCount: totalTokens
              };
            });
            if (abortController.signal.aborted) return;
            if (newBalances.length) {
              await db.assetDiscovery.bulkPut(newBalances);
            }
          }
        } catch (err) {
          log.warn(`[AssetDiscovery] Could not scan network ${networkId}`, {
            err
          });
        }
      });
      await assetDiscoveryStore.mutate(prev => {
        if (abortController.signal.aborted) return prev;
        return {
          ...prev,
          currentScanProgressPercent: 100,
          currentScanScope: null,
          lastScanTimestamp: Date.now(),
          lastScanAccounts: prev.currentScanScope?.addresses ?? [],
          lastScanNetworks: prev.currentScanScope?.networkIds ?? [],
          lastScanTokensCount: prev.currentScanTokensCount
        };
      });
      subScopeChange.unsubscribe();
      stop();
      await this.enableDiscoveredTokens(); // if pending tokens to enable, do it now
    } catch (cause) {
      abortController.abort();
      log.error("Error while scanning", {
        cause
      });
    } finally {
      this.#isBusy = false;
    }

    // proceed with next scan in queue, if any
    this.executeNextScan();
  }

  /** Used bym migrations */
  async startPendingScan() {
    if (!(await firstValueFrom(isWalletReady$))) return;
    const isAssetDiscoveryScanPending = await appStore.get("isAssetDiscoveryScanPending");
    if (!isAssetDiscoveryScanPending) return;

    // addresses of all ethereum accounts
    const accounts = await keyringStore.getAccounts();
    const addresses = accounts.filter(isAccountNotContact).filter(isAccountPlatformEthereum).map(acc => acc.address);

    // all active evm networks
    const [evmNetworks, activeNetworks] = await Promise.all([chaindataProvider.getNetworks("ethereum"), activeNetworksStore.get()]);
    const networkIds = evmNetworks.filter(n => isNetworkActive(n, activeNetworks)).map(n => n.id);
    await appStore.set({
      isAssetDiscoveryScanPending: false
    });

    // enqueue scan
    await this.startScan({
      networkIds,
      addresses,
      withApi: true
    });
  }
  async enableDiscoveredTokens() {
    this.#preventAutoStart = true;
    try {
      const [discoveredBalances] = await Promise.all([db.assetDiscovery.toArray()]);
      const tokenIds = uniq(discoveredBalances.map(entry => entry.tokenId));
      const tokens = (await Promise.all(tokenIds.map(tokenId => chaindataProvider.getTokenById(tokenId)))).filter(isTokenEth);
      await activeTokensStore.set(Object.fromEntries(tokens.map(t => [t.id, true])));
      const evmNetworkIds = uniq(tokens.map(token => token.networkId));
      await activeNetworksStore.set(Object.fromEntries(evmNetworkIds.map(networkId => [networkId, true])));
      await sleep(100); // pause to ensure local storage observables fires before we exit, to prevent unnecessary scans to be triggered (see watchEnabledNetworks up top)
    } catch (err) {
      log.error("[AssetDiscovery] Failed to automatically enable discovered assets", {
        err
      });
    }
    this.#preventAutoStart = false;
  }
}
const getActiveNetworkIdsToScan = async () => {
  const [evmNetworks, activeEvmNetworks] = await Promise.all([chaindataProvider.getNetworks("ethereum"), activeNetworksStore.get()]);
  return evmNetworks.filter(n => n.forceScan || !n.isTestnet && isNetworkActive(n, activeEvmNetworks)) // note: forceScan must also work on testnets
  .map(n => n.id);
};
const getNetworkIdsToForceScan = async () => {
  const [evmNetworks, activeEvmNetworks] = await Promise.all([chaindataProvider.getNetworks("ethereum"), activeNetworksStore.get()]);
  return evmNetworks.filter(n => n.forceScan && activeEvmNetworks[n.id] !== false) // note: forceScan must also work on testnets
  .map(n => n.id);
};
const getEvmTokenBalance = async (client, token, address) => {
  if (token.type === "evm-erc20" || token.type === "evm-uniswapv2") {
    const balance = await client.readContract({
      abi: erc20Abi,
      address: token.contractAddress,
      functionName: "balanceOf",
      args: [address]
    });
    return balance.toString();
  }
  if (token.type === "evm-native") {
    const addressMulticall = client.chain?.contracts?.multicall3?.address;
    if (addressMulticall) {
      // if multicall is available then fetch balance using this contract call,
      // this will allow the client to batch it along with other pending erc20 calls
      const balance = await client.readContract({
        abi: abiMulticall,
        address: addressMulticall,
        functionName: "getEthBalance",
        args: [address]
      });
      return balance.toString();
    }
    const balance = await client.getBalance({
      address
    });
    return balance.toString();
  }
  throw new Error("Unsupported token type");
};
const getEvmTokenBalancesWithoutAggregator = async (client, balanceDefs) => {
  if (balanceDefs.length === 0) return [];
  return await Promise.all(balanceDefs.map(async ({
    token,
    address
  }) => {
    try {
      let retries = 0;
      while (retries < 3) {
        try {
          return await Promise.race([getEvmTokenBalance(client, token, address), throwAfter(20_000, "Timeout")]);
        } catch (err) {
          if (err.message === "Timeout") retries++;else throw err;
        }
      }
      throw new Error(`Failed to scan ${token.id} (Timeout)`);
    } catch (err) {
      log.warn(`[AssetDiscovery] Failed to get balance of ${token.id} for ${address}: `, {
        err
      });
      return "0";
    }
  }));
};
const getEvmTokenBalancesWithAggregator = async (client, balanceDefs, aggregatorAddress) => {
  if (balanceDefs.length === 0) return [];

  // keep track of index so we can split queries and rebuild the original order afterwards
  const indexedBalanceDefs = balanceDefs.map((bd, index) => ({
    ...bd,
    index
  }));
  const erc20BalanceDefs = indexedBalanceDefs.filter(b => b.token.type === "evm-erc20" || b.token.type === "evm-uniswapv2");
  const otherBalanceDefs = indexedBalanceDefs.filter(b => b.token.type !== "evm-erc20" && b.token.type !== "evm-uniswapv2");
  const [erc20Balances, otherBalances] = await Promise.all([client.readContract({
    abi: erc20BalancesAggregatorAbi,
    address: aggregatorAddress,
    functionName: "balances",
    args: [erc20BalanceDefs.map(b => ({
      account: b.address,
      token: b.token.contractAddress
    }))]
  }), getEvmTokenBalancesWithoutAggregator(client, otherBalanceDefs)]);
  const resByIndex = new Map(erc20Balances.map((res, i) => [erc20BalanceDefs[i].index, String(res)]).concat(otherBalances.map((res, i) => [otherBalanceDefs[i].index, String(res)])));
  return balanceDefs.map((_bd, i) => resByIndex.get(i));
};
const getEvmTokenBalances = (client, balanceDefs, aggregatorAddress) => {
  return aggregatorAddress ? getEvmTokenBalancesWithAggregator(client, balanceDefs, aggregatorAddress) : getEvmTokenBalancesWithoutAggregator(client, balanceDefs);
};
const assetDiscoveryScanner = new AssetDiscoveryScanner();

const chainConnectorSol = new ChainConnectorSol(chaindataProvider);

const chainConnector = new ChainConnectorDot(chaindataProvider, connectionMetaDb);

const chainConnectors = {
  substrate: chainConnector,
  evm: chainConnectorEvm,
  solana: chainConnectorSol
};

const blobStore$4 = getBlobStore("balances");
const DEFAULT_DATA$2 = {
  balances: [],
  /**
   * NOTE: these are miniMetadatas needed for e.g. custom or out-of-date chains,
   * they are not the same as the default miniMetadatas in the chaindata blob.
   */
  miniMetadatas: []
};

// balances store
const [setBalances, balancesStore$] = splitSubject(new ReplaySubject(1));
const updateBalancesStore = data => {
  setBalances({
    balances: data.balances.map(function cleanupBalanceForStorage(balance) {
      const {
        networkId,
        address,
        tokenId,
        source,
        useLegacyTransferableCalculation,
        values,
        value
      } = balance;
      return {
        // mark as cache and enforce property ordering for consistency
        status: "cache",
        networkId,
        address,
        tokenId,
        source,
        useLegacyTransferableCalculation,
        values: values,
        value
      };
    })
    // enforce consistent ordering of balances and miniMetadatas to allow for easier change comparison
    .sort((a, b) => getBalanceId(a).localeCompare(getBalanceId(b))),
    miniMetadatas: data.miniMetadatas.concat().sort((a, b) => a.id.localeCompare(b.id))
  });
};

// once wallet is ready, initialize the balances store
walletReady.then(() => {
  // provision store data from db
  Promise.all([blobStore$4.get(), keyringStore.getAccounts()]).then(([blobData, accounts]) => {
    if (!blobData) return setBalances(DEFAULT_DATA$2);
    const addresses = new Set(accounts.filter(isAccountNotContact).map(a => a.address));
    // filter out any balances that do not match a keyring address
    const balances = blobData.balances.filter(b => addresses.has(b.address));
    const miniMetadatas = blobData.miniMetadatas;
    if (balances.length !== blobData.balances.length) log.debug(`[balances] deleting ${blobData.balances.length - balances.length} balances that do not match keyring addresses`);
    setBalances({
      ...DEFAULT_DATA$2,
      balances,
      miniMetadatas
    });
  }).catch(error => {
    log.error("[balances] failed to load balances store on startup", error);
    // need at least one emit on startup as it's a replay subject
    setBalances(DEFAULT_DATA$2);
  });

  // persist data to db when store is updated
  balancesStore$.pipe(skip(1), debounceTime(2_000), distinctUntilChanged(isEqual)).subscribe(storage => {
    log.debug(`[balances] updating db blob with data (bal:${storage.balances.length}, meta:${storage.miniMetadatas.length})`);
    blobStore$4.set(storage);
  });
});

const balancesProvider$ = balancesStore$.pipe(first(), switchMap(storage => new Observable(subscriber => {
  const provider = new BalancesProvider(chaindataProvider, chainConnectors, storage);
  subscriber.next(provider);

  // store state in extension's db so it can be reused on next startup
  return provider.storage$.pipe(skip(1), debounceTime(200)).subscribe(data => updateBalancesStore(data));
})), shareReplay(1));
const balancesProvider = {
  getBalances$: (...args) => {
    return balancesProvider$.pipe(switchMap(provider => provider.getBalances$(...args)));
  },
  fetchBalances: async (...args) => {
    const provider = await firstValueFrom(balancesProvider$);
    return provider.fetchBalances(...args);
  },
  getDetectedTokensId$: address => {
    return balancesProvider$.pipe(switchMap(provider => provider.getDetectedTokensId$(address)));
  }
};

const MAINNET_NETWORK_ID = "solana-mainnet";
const SPL_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const discoverSolanaAssets = async addresses => {
  const activeNetworks = await activeNetworksStore.get();
  if (activeNetworks[MAINNET_NETWORK_ID] === false) return;
  const accounts = await keyringStore.getAccounts();
  addresses = addresses?.filter(isSolanaAddress) ?? accounts.filter(isAccountNotContact).filter(isAccountPlatformSolana).map(acc => acc.address);
  if (!addresses.length) return;
  const connection = await chainConnectorSol.getConnection(MAINNET_NETWORK_ID);
  const knownSplTokenIds = await chaindataProvider.getTokenIds("sol-spl");
  const results = await Promise.all(addresses.map(address => {
    return getSplTokenIdsForOwner(connection, address);
  }));
  const splTokenIds = uniq(results.flat().filter(id => knownSplTokenIds.includes(id)));
  const activeTokens = await activeTokensStore.get();
  const newTokenIds = splTokenIds.filter(id => activeTokens[id] === undefined);
  if (newTokenIds.length) {
    log.debug("[discoverSolanaAssets] discovered new SPL tokens", {
      newTokenIds
    });
    await activeTokensStore.mutate(activeTokens => ({
      ...activeTokens,
      ...Object.fromEntries(newTokenIds.map(id => [id, true]))
    }));
  }
};
const getSplTokenIdsForOwner = async (connection, address) => {
  try {
    // fetch SPL balances for the address
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
      programId: new PublicKey(SPL_PROGRAM_ID) // SPL Token Program ID
    }, "confirmed");
    const mintAddresses = tokenAccounts.value.map(d => d.account.data.parsed.info.mint);
    return mintAddresses.map(mintAddress => solSplTokenId(MAINNET_NETWORK_ID, mintAddress));
  } catch (err) {
    return [];
  }
};
const initialiseSolanaAssetDiscovery = () => {
  // launch a scan when wallet is ready (unlocked and migrations are complete)
  isWalletReady$.pipe(filter(ready => ready), first()).subscribe(() => {
    log.debug("[discoverSolanaAssets] wallet is ready, launching scan");
    discoverSolanaAssets();
  });

  // launch a scan when solana-mainnet is enabled (only if it was not enabled before)
  combineLatest({
    isWalletReady: isWalletReady$,
    activeNetworks: activeNetworksStore.observable
  }).pipe(filter(({
    isWalletReady
  }) => !!isWalletReady), map(({
    activeNetworks
  }) => !!activeNetworks["solana-mainnet"]), distinctUntilChanged(), pairwise(),
  // Emit pairs of [previous, current] enabled state
  filter(([previous, current]) => !previous && current) // Only emit when it changes from false to true
  ).subscribe(() => {
    log.debug("[discoverSolanaAssets] solana-mainnet enabled, launching scan");
    discoverSolanaAssets();
  });

  // launch a scan for newly added solana accounts
  combineLatest({
    isWalletReady: isWalletReady$,
    accounts: keyringStore.accounts$
  }).pipe(filter(({
    isWalletReady
  }) => !!isWalletReady), map(({
    accounts
  }) => accounts.filter(isAccountNotContact).filter(isAccountPlatformSolana).map(acc => acc.address)), distinctUntilChanged(isEqual), pairwise(),
  // Emit pairs of [previous, current] solana addresses
  filter(([previous, current]) => previous.length < current.length), map(([previous, current]) => current.filter(addr => !previous.includes(addr))), filter(newAddresses => !!newAddresses.length)).subscribe(newSolanaAddresses => {
    log.debug("[discoverSolanaAssets] %s new solana accounts found, launching scan", newSolanaAddresses.length);
    discoverSolanaAssets(newSolanaAddresses);
  });

  // enable solana mainnet tokens found by balance modules (no scan needed)
  combineLatest({
    isWalletReady: isWalletReady$,
    accounts: keyringStore.accounts$
  }).pipe(filter(({
    isWalletReady
  }) => !!isWalletReady), map(({
    accounts
  }) => accounts.filter(isAccountNotContact).filter(isAccountPlatformSolana).map(acc => acc.address)), switchMap(addresses => combineLatest([...addresses.map(balancesProvider.getDetectedTokensId$)]).pipe(map(allTokenIds => uniq(allTokenIds.flat()).sort()))), distinctUntilChanged(isEqual)).subscribe(async tokenIds => {
    log.debug("[discoverSolanaAssets] detectedTokens$");
    const [activeTokens, existingTokenIds] = await Promise.all([activeTokensStore.get(), chaindataProvider.getTokenIds()]);
    const tokenIdsToActivate = tokenIds.filter(tokenId => {
      if (activeTokens[tokenId] !== undefined) return false; // already set
      if (networkIdFromTokenId(tokenId) !== MAINNET_NETWORK_ID) return false; // only process solana mainnet tokens
      return existingTokenIds.includes(tokenId); // consider only tokens that talisman knows about
    });
    if (tokenIdsToActivate.length) {
      log.debug("[discoverSolanaAssets] activating detected tokens:", tokenIdsToActivate);
      await activeTokensStore.mutate(prev => {
        const next = {
          ...prev
        };
        for (const tokenId of tokenIdsToActivate) next[tokenId] = true;
        return next;
      });
    }
  });
};

const TALISMAN_PROPERTIES = {
  appVersion: process.env.VERSION,
  appBuild: process.env.BUILD,
  testBuild: DEBUG || ["dev", "qa", "ci"].includes(process.env.BUILD)
};
const DEFAULT_ANALYTICS_STATE = {
  data: []
};
class AnalyticsStore extends StorageProvider {
  // the isReady promise prevents events being added to the queue while the analytics are being sent
  isReady = new Promise(resolve => resolve(true));
  constructor(name) {
    super(name, DEFAULT_ANALYTICS_STATE);
    setInterval(async () => await this.send(), 60_000);
  }
  async getDistinctId() {
    try {
      // Identify the posthog client
      //
      // We have to do this manually, because we don't have access to `localStorage` in the background script,
      // and `localStorage` is the only built-in way for posthog to persist the distinct_id.
      let posthogDistinctId = await this.get("distinctId");

      // if this Talisman instance doesn't already have a persisted distinct_id, randomly generate one
      if (posthogDistinctId === undefined) {
        posthogDistinctId = v4();
        await this.mutate(data => ({
          ...data,
          distinctId: posthogDistinctId
        }));
      }
      return posthogDistinctId;
    } catch (cause) {
      const error = new Error("Failed to identify posthog client", {
        cause
      });
      console.error(error); // eslint-disable-line no-console
      Sentry.captureException(error);
    }
    return;
  }
  async capture(eventName, rawProperties, eventTimestamp) {
    const enabled = await settingsStore.get("useAnalyticsTracking");
    if (IS_FIREFOX || enabled === false) return;
    log.debug("AnalyticsStore.capture", {
      eventName,
      rawProperties,
      eventTimestamp
    });
    const timestamp = eventTimestamp ?? Date.now();
    const distinct_id = await this.getDistinctId();
    if (!distinct_id) return;
    const properties = {
      ...rawProperties,
      ...TALISMAN_PROPERTIES,
      distinct_id
    };
    await this.isReady;
    await this.mutate(({
      data,
      distinctId
    }) => ({
      distinctId,
      data: [...data, {
        event: eventName,
        properties,
        timestamp
      }]
    }));
  }
  captureDelayed(eventName, properties, delaySeconds = 1800) {
    // add a random delay of up to 30 min to avoid deanonymisation of user events
    const timestamp = Date.now() + delaySeconds * 1000 * Math.random();
    this.capture(eventName, properties, timestamp);
  }
  async send() {
    const enabled = await settingsStore.get("useAnalyticsTracking");
    if (!enabled) return;
    log.debug("AnalyticsStore.send");
    await this.isReady;
    const sendInner = async () => {
      if (!process.env.POSTHOG_AUTH_TOKEN) {
        log.warn("POSTHOG_AUTH_TOKEN is not set, not sending analytics");
        return true;
      }
      const {
        data
      } = await this.get();
      const currentTime = Date.now();
      // split the data into two arrays, one for the current time, and to be kept for the future
      const {
        toKeep,
        toSend
      } = data.reduce((result, item) => {
        if (item.timestamp < currentTime) result.toSend.push({
          ...item,
          timestamp: new Date(item.timestamp).toISOString()
        });else result.toKeep.push(item);
        return result;
      }, {
        toSend: [],
        toKeep: []
      });
      if (toSend.length === 0) return true;
      const url = await remoteConfigStore.get("postHogUrl");
      const headers = {
        "Content-Type": "application/json"
      };
      const payload = {
        api_key: process.env.POSTHOG_AUTH_TOKEN,
        historical_migration: false,
        batch: toSend
      };
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
      } catch (error) {
        log.error("Failed to send analytics", {
          error
        }); // eslint-disable-line no-console
        // do not mutate state if sending analytics fails
        return true;
      }
      await this.mutate(({
        distinctId
      }) => ({
        data: toKeep,
        distinctId
      }));
      log.debug("AnalyticsStore.send success: ", toSend.length);
      return true;
    };
    this.isReady = sendInner();
  }
}
const analyticsStore = new AnalyticsStore("analytics");

const walletAddressesByTokenId$ = combineLatest({
  networks: chaindataProvider.networks$,
  tokens: chaindataProvider.tokens$,
  accounts: keyringStore.accounts$,
  activeTokens: activeTokensStore.observable,
  activeNetworks: activeNetworksStore.observable
}).pipe(map(({
  networks,
  tokens,
  accounts,
  activeTokens,
  activeNetworks
}) => {
  const arNetworks = networks.filter(n => isNetworkActive(n, activeNetworks));
  const arTokens = tokens.filter(t => isTokenActive(t, activeTokens));
  return fromPairs(arNetworks.flatMap(network => {
    const networkTokens = arTokens.filter(t => t.networkId === network.id);
    const networkAccounts = accounts.filter(isAccountNotContact).filter(a => isAccountCompatibleWithNetwork(network, a));
    return networkTokens.map(token => [token.id, networkAccounts.map(a => a.address)]);
  }));
}), distinctUntilChanged(isEqual));
const walletBalances$ = walletAddressesByTokenId$.pipe(switchMap(addressesByTokenId => balancesProvider.getBalances$(addressesByTokenId)), firstThenDebounce(500), tap({
  subscribe: () => log.debug("[balances] starting main subscription"),
  unsubscribe: () => {
    log.debug("[balances] stopping main subscription");
    // doing it on unsubscribe ensures we do not restart while subscriptions are active
    chaindataProvider.syncDynamicTokens();
  }
}), shareReplay({
  refCount: true,
  bufferSize: 1
}), keepAlive(3000));

const DEFAULT_DATA$1 = {
  id: "nfts",
  collections: [],
  nfts: [],
  hiddenNftCollectionIds: [],
  favoriteNftIds: []
};
const blobStore$3 = getBlobStore("nfts");

// this must not be exported at the package level
// only backend should have access to it
const subject = new BehaviorSubject(DEFAULT_DATA$1);
walletReady.then(() => {
  // load from db and cleanup
  blobStore$3.get().then(nfts => {
    if (nfts) subject.next({
      ...DEFAULT_DATA$1,
      ...nfts
    });
  });
  subject.pipe(skip(1), debounceTime(1_000)).subscribe(nfts => {
    blobStore$3.set(nfts);
  });
});
const nftsStore$ = subject.asObservable();
const updateNftsStore = ({
  addresses,
  nfts,
  collections
}) => {
  const normalizedAddresses = addresses.map(normalizeAddress);
  const newStoreData = structuredClone(subject.value);
  newStoreData.nfts = newStoreData.nfts.filter(nft => !normalizedAddresses.includes(normalizeAddress(nft.owner))).concat(nfts);

  // consolidate collections
  const newCollectionsMap = keyBy(newStoreData.collections.concat(collections), c => c.id);
  for (const collectionId of Object.keys(newCollectionsMap)) if (!newStoreData.nfts.some(nft => nft.collectionId === collectionId)) delete newCollectionsMap[collectionId];
  newStoreData.collections = Object.values(newCollectionsMap);

  // cleanup orphan nfts
  newStoreData.nfts.filter(nft => newStoreData.collections.some(col => col.id === nft.collectionId));
  if (!isEqual(subject.value, newStoreData)) {
    subject.next(newStoreData);
  }
};
const setHiddenNftCollection = (id, isHidden) => {
  const hiddenNftCollectionIds = subject.value.hiddenNftCollectionIds.filter(cid => cid !== id);
  if (isHidden) hiddenNftCollectionIds.push(id);
  subject.next({
    ...subject.value,
    hiddenNftCollectionIds
  });
};
const setFavoriteNft = (id, isFavorite) => {
  const favoriteNftIds = subject.value.favoriteNftIds.filter(nid => nid !== id);
  if (isFavorite) favoriteNftIds.push(id);
  subject.next({
    ...subject.value,
    favoriteNftIds
  });
};

const blobStore$2 = getBlobStore("tokenRates");
const DEFAULT_TOKEN_RATES = {
  tokenRates: {}
};
const tokenRates$ = new ReplaySubject(1);
// persist changes to disk
tokenRates$.pipe(debounceTime(2_000), distinctUntilChanged(isEqual)).subscribe(storage => {
  log.debug(`[tokenRates] updating db blob with data (tokenRates:${Object.values(storage.tokenRates).length})`);
  blobStore$2.set(storage);
});
// load from disk on startup
blobStore$2.get().then(storage => {
  if (!storage) return tokenRates$.next(DEFAULT_TOKEN_RATES);
  tokenRates$.next({
    ...DEFAULT_TOKEN_RATES,
    ...storage
  });
}, error => {
  log.error("[tokenRates] failed to load tokenRates store on startup", error);
  tokenRates$.next(DEFAULT_TOKEN_RATES);
});

// refresh token rates on subscription start if older than 1 minute
const MIN_REFRESH_INTERVAL = 1 * 60_000;

// refresh token rates while sub is active every 2 minutes
const REFRESH_INTERVAL$2 = 2 * 60_000;
// TODO: Refactor this class to remove all the manual subscription handling, and instead just leverage the wonderful ReplaySubject to magically manage it all for us.
class TokenRatesStore {
  #storage$;
  #lastUpdateKey = "";
  #lastUpdateAt = Date.now(); // will prevent a first empty call if tokens aren't loaded yet
  #subscriptions = new BehaviorSubject({});
  #isWatching = false;
  constructor() {
    this.#storage$ = tokenRates$;
    this.watchSubscriptions();
  }
  get storage$() {
    return this.#storage$.asObservable();
  }

  /**
   * Toggles on & off the price updates, based on if there are any active subscriptions
   */
  watchSubscriptions = () => {
    let pollInterval = null;
    let subTokenList = null;
    this.#subscriptions.subscribe(subscriptions => {
      if (Object.keys(subscriptions).length) {
        // watching state check
        if (this.#isWatching) return;
        this.#isWatching = true;

        // refresh price every minute if observed
        pollInterval = setInterval(() => {
          if (this.#subscriptions.observed) this.hydrateStore();
        }, REFRESH_INTERVAL$2);

        // refresh when token list changes : crucial for first popup load after install or db migration
        const obsTokens = chaindataProvider.getTokensMapById$();
        const obsActiveTokens = activeTokensStore.observable;
        const obsCurrencies = settingsStore.observable.pipe(map(settings => settings.selectableCurrencies));
        subTokenList = combineLatest([obsTokens, obsActiveTokens, obsCurrencies]).subscribe(debounce(async ([tokens, activeTokens, currencies]) => {
          if (this.#subscriptions.observed) {
            const tokensList = filterActiveTokens(tokens, activeTokens);
            await this.updateTokenRates(tokensList, currencies);
          }
        }, 500));
      } else {
        // watching state check
        if (!this.#isWatching) return;
        this.#isWatching = false;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        if (subTokenList) {
          subTokenList.unsubscribe();
          subTokenList = null;
        }
      }
    });
  };
  async hydrateStore() {
    try {
      const [tokens, activeTokens, currencies] = await Promise.all([chaindataProvider.getTokensMapById(), activeTokensStore.get(), settingsStore.get("selectableCurrencies")]);
      const tokensList = filterActiveTokens(tokens, activeTokens);
      await this.updateTokenRates(tokensList, currencies);
      return true;
    } catch (error) {
      log.error(`Failed to fetch tokenRates`, error);
      return false;
    }
  }

  /**
   * WARNING: Make sure the tokens list `tokens` only includes active tokens.
   */
  async updateTokenRates(tokens, currencies) {
    const now = Date.now();
    const updateKey = Object.keys(tokens ?? {}).concat(...currencies).sort().join(",");
    if (now - this.#lastUpdateAt < MIN_REFRESH_INTERVAL && this.#lastUpdateKey === updateKey) return;

    // update lastUpdateAt & lastUpdateTokenIds before fetching to prevent api call bursts
    this.#lastUpdateAt = now;
    this.#lastUpdateKey = updateKey;
    try {
      const coinsApiConfig = await remoteConfigStore.get("coinsApi");

      // force usd to be included, because hide small balances feature requires it
      const effectiveCurrencyIds = uniq([...currencies, "usd"]);
      const tokenRates = await fetchTokenRates(tokens, effectiveCurrencyIds, coinsApiConfig);
      const putTokenRates = {
        tokenRates
      };

      // update external subscriptions
      Object.values(this.#subscriptions.value).map(cb => cb(putTokenRates));
      this.#storage$.next(putTokenRates);
    } catch (err) {
      // reset lastUpdateTokenIds to retry on next call
      this.#lastUpdateKey = "";
      throw err;
    }
  }
  async subscribe(id, port, unsubscribeCallback) {
    const cb = createSubscription(id, port);
    const currentTokenRates = await firstValueFrom(this.#storage$);
    cb(currentTokenRates);
    const currentSubscriptions = this.#subscriptions.value;
    this.#subscriptions.next({
      ...currentSubscriptions,
      [id]: cb
    });
    if (Object.values(currentSubscriptions).length === 0) {
      // if there's no subscriptions, hydrate the store. If there are already subscriptions,
      // the store will be hydrated via the interval anyway
      this.hydrateStore();
    }
    port.onDisconnect.addListener(() => {
      unsubscribe(id);
      const newSubscriptions = {
        ...this.#subscriptions.value
      };
      delete newSubscriptions[id];
      this.#subscriptions.next(newSubscriptions);
      if (unsubscribeCallback) unsubscribeCallback();
    });
    return true;
  }
}
const tokenRatesStore = new TokenRatesStore();

const REPORTING_PERIOD = 24 * 3600 * 1000; // 24 hours

/**
 * This global variable makes sure that we only build one report at a time.
 * If the background script is restarted, this flag will be reset to `false`.
 */
let isBuildingReport = false;

//
// This should get sent at most once per 24 hours, whenever any other events get sent
//
async function withGeneralReport(properties) {
  // if a report has been created but not yet submitted, this function will attach it to the pending event's properties
  const includeExistingReportInProperties = async () => {
    const analyticsReport = await appStore.get("analyticsReport");
    if (!analyticsReport) return;
    await appStore.set({
      analyticsReport: undefined
    });
    properties = {
      ...properties,
      $set: {
        ...(properties?.$set ?? {}),
        ...analyticsReport
      }
    };
  };

  // if a report has already been created, include it in the event properties
  await includeExistingReportInProperties();

  // if it has been at least REPORTING_PERIOD ms since the last report was created, create a new report
  await spawnTaskToCreateNewReport();
  return properties;
}

// If we've not created a report before, or if it has been REPORTING_PERIOD ms since we last created a report,
// this function will spawn an async task to create a new report in the background.
const spawnTaskToCreateNewReport = async ({
  refreshBalances = true,
  waitForReportCreated
} = {}) => {
  const analyticsReportCreatedAt = await appStore.get("analyticsReportCreatedAt");

  // if the wallet has already created a report, do nothing when the time since the last report is less than REPORTING_PERIOD
  const hasCreatedReport = typeof analyticsReportCreatedAt === "number";
  const timeSinceReportCreated = hasCreatedReport ? Date.now() - analyticsReportCreatedAt : 0;
  if (hasCreatedReport && timeSinceReportCreated < REPORTING_PERIOD) return;

  // if we're already creating a report (in response to an event which happened before this one)
  // then don't try to build another one at the same time
  if (isBuildingReport) return;
  isBuildingReport = true;

  // spawn async task (don't wait for it to complete before continuing)
  const reportComplete = (async () => {
    try {
      const analyticsReport = await getGeneralReport({
        refreshBalances
      });

      // don't include general report if user is onboarding/has analytics turned off/other short-circuit conditions
      if (analyticsReport === undefined) return;
      await appStore.set({
        analyticsReportCreatedAt: Date.now(),
        analyticsReport
      });
    } catch (cause) {
      const error = new Error("Failed to build general report", {
        cause
      });
      console.warn(error); // eslint-disable-line no-console
      sentry.captureException(error);
    } finally {
      // set this flag back to false so we don't block the next report
      isBuildingReport = false;
    }
  })();
  if (waitForReportCreated) await reportComplete;
};
async function getGeneralReport({
  refreshBalances = true
} = {}) {
  const [allowTracking, onboarded, isWalletReady] = await Promise.all([settingsStore.get("useAnalyticsTracking"), appStore.getIsOnboarded(), firstValueFrom(isWalletReady$) // general report could be wrong if generated before migrations are complete
  ]);
  if (!allowTracking || !onboarded || IS_FIREFOX || !isWalletReady) return;

  //
  // accounts
  //

  const accounts = await keyringStore.getAccounts();
  const ownedAccounts = accounts.filter(isAccountOwned);
  const ownedAccountsCount = ownedAccounts.length;
  const ownedAddresses = ownedAccounts.map(account => account.address);

  // Don't create report if user doesn't have any accounts.
  // Prevents us from overriding a previous report for users who have upgraded to the latest
  // version of the wallet, but have not yet logged in to run the keyring migration.
  if (ownedAccountsCount < 1) return;
  const watchedAccounts = accounts.filter(acc => !isAccountOwned(acc));
  const watchedAccountsCount = watchedAccounts.length;
  if (refreshBalances) {
    await firstValueFrom(walletBalances$.pipe(filter(({
      status
    }) => status === "live")));
  }

  // account type breakdown
  const accountBreakdown = {
    talisman: 0,
    qr: 0,
    ledger: 0,
    dcent: 0,
    watched: 0,
    signet: 0
  };
  for (const account of accounts) {
    const origin = getLegacyAccountOrigin(account);
    const type = origin?.toLowerCase?.();
    if (type) accountBreakdown[type] = (accountBreakdown[type] ?? 0) + 1;
  }

  //
  // tokens
  //

  // cache chains, evmNetworks, tokens, tokenRates and balances here to prevent lots of fetch calls
  try {
    /* eslint-disable-next-line no-var */
    var [networks, tokens, tokenRates, allBalances] = await Promise.all([chaindataProvider.getNetworksMapById(), chaindataProvider.getTokensMapById(), firstValueFrom(tokenRatesStore.storage$.pipe(map(storage => storage.tokenRates))), firstValueFrom(balancesStore$.pipe(map(store => store.balances)))]);
    const balanceJsons = allBalances.filter(b => ownedAddresses.some(address => isAddressEqual(address, b.address)));
    /* eslint-disable-next-line no-var */
    var balances = new Balances(balanceJsons, {
      networks,
      tokens,
      tokenRates
    });
  } catch (cause) {
    const error = new Error("Failed to access db to build general analyics report", {
      cause
    });
    DEBUG && console.error(error); // eslint-disable-line no-console
    throw error;
  }

  // balances top 100 tokens/networks
  const TOP_BALANCES_COUNT = 100;
  // get balance list per chain/evmNetwork and token
  const balancesPerChainToken = groupBy$1(balances.each.filter(balance => balance && (!balance.token || !isTokenCustom(balance.token)) && (!balance.network || !isNetworkCustom(balance.network))), balance => `${balance.networkId}-${balance.tokenId}`);

  // get fiat sum object for those arrays of balances
  const sortedFiatSumPerChainToken = Object.values(balancesPerChainToken).map(balances => new Balances(balances, {
    networks,
    tokens,
    tokenRates
  })).map(balances => ({
    totalBalance: balances.sum.fiat("usd").total,
    transferableBalance: balances.sum.fiat("usd").transferable,
    unavailableBalance: balances.sum.fiat("usd").unavailable,
    numAccounts: new Set(balances.each.map(b => b.address)).size,
    chainId: balances.sorted[0].networkId,
    tokenId: balances.sorted[0].tokenId,
    symbol: balances.sorted[0].token?.symbol
  })).sort((a, b) => b.totalBalance - a.totalBalance);
  const totalFiatValue = privacyRoundCurrency(balances.sum.fiat("usd").total);
  const transferableFiatValue = privacyRoundCurrency(balances.sum.fiat("usd").transferable);
  const unavailableFiatValue = privacyRoundCurrency(balances.sum.fiat("usd").unavailable);
  const tokensBreakdown = sortedFiatSumPerChainToken.filter((token, index) => token.totalBalance > 1 || index < TOP_BALANCES_COUNT).map(token => ({
    ...token,
    balance: privacyRoundCurrency(token.totalBalance),
    totalBalance: privacyRoundCurrency(token.totalBalance),
    transferableBalance: privacyRoundCurrency(token.transferableBalance),
    unavailableBalance: privacyRoundCurrency(token.unavailableBalance)
  }));
  const unroundedEcosystemBreakdown = sortedFiatSumPerChainToken.filter((token, index) => token.totalBalance > 1 || index < TOP_BALANCES_COUNT).reduce((acc, token) => {
    if (!token.chainId) return acc;
    const network = networks[token.chainId];
    if (!network) return acc;
    const eco = network.platform === "polkadot" ? acc.dot : network.platform === "ethereum" ? acc.eth : null;
    if (!eco) return acc;
    eco.totalBalance += token.totalBalance;
    eco.transferableBalance += token.transferableBalance;
    eco.unavailableBalance += token.unavailableBalance;
    return acc;
  }, {
    dot: {
      totalBalance: 0,
      transferableBalance: 0,
      unavailableBalance: 0
    },
    eth: {
      totalBalance: 0,
      transferableBalance: 0,
      unavailableBalance: 0
    }
  });
  const ecosystemBreakdown = Object.fromEntries(Object.entries(unroundedEcosystemBreakdown).map(([eco, totals]) => [eco, {
    totalBalance: privacyRoundCurrency(totals.totalBalance),
    transferableBalance: privacyRoundCurrency(totals.transferableBalance),
    unavailableBalance: privacyRoundCurrency(totals.unavailableBalance)
  }]));
  const topChainTokens = sortedFiatSumPerChainToken.filter(({
    totalBalance
  }) => totalBalance > 0).map(({
    chainId,
    tokenId
  }) => ({
    chainId,
    tokenId
  })).slice(0, 5);
  const topToken = topChainTokens[0] ? `${topChainTokens[0].chainId}: ${topChainTokens[0].tokenId}` : undefined;
  const numTokens = sortedFiatSumPerChainToken.length;

  //
  // nfts
  //
  const {
    nfts,
    collections
  } = await firstValueFrom(nftsStore$);
  const ownedNfts = nfts.filter(nft => ownedAddresses.some(ownedAddress => isAddressEqual(nft.owner, ownedAddress)));
  const TOP_NFT_COLLECTIONS_COUNT = 20;
  const nftsCount = ownedNfts.length;
  const nftsTotalValue = ownedNfts.reduce((total, nft) => total + (nft.price || 0) * nft.amount, 0);
  const topNftCollections = uniq(nfts.concat().sort((n1, n2) => (n1.price ?? 0) - (n2.price ?? 0)).map(nft => nft.collectionId)).slice(0, TOP_NFT_COLLECTIONS_COUNT).map(cid => collections.find(c => c.id === cid)?.name).filter(isNotNil);
  return {
    // accounts
    accountBreakdown,
    accountsCount: ownedAccountsCount,
    watchedAccountsCount,
    // tokens
    totalFiatValue,
    transferableFiatValue,
    unavailableFiatValue,
    tokens: tokensBreakdown,
    ecosystems: ecosystemBreakdown,
    topChainTokens,
    topToken,
    numTokens,
    // nfts
    nftsCount,
    nftsTotalValue,
    topNftCollections,
    // util
    lastGeneralReport: Math.trunc(Date.now() / 1000)
  };
}
const getLegacyAccountOrigin = account => {
  switch (account.type) {
    case "keypair":
      return LegacyAccountOrigin.Talisman;
    case "ledger-ethereum":
    case "ledger-polkadot":
      return LegacyAccountOrigin.Ledger;
    case "polkadot-vault":
      return LegacyAccountOrigin.Qr;
    case "watch-only":
      return LegacyAccountOrigin.Watched;
    case "signet":
      return LegacyAccountOrigin.Signet;
    default:
      return account.type;
  }
};

class TalismanAnalytics {
  #enabled = !IS_FIREFOX && Boolean(process.env.POSTHOG_AUTH_TOKEN);
  async capture(eventName, properties) {
    if (!this.#enabled) return;
    try {
      // have to put this manual check here because posthog is buggy and will not respect our settings
      // https://github.com/PostHog/posthog-js/issues/336
      const allowTracking = await settingsStore.get("useAnalyticsTracking");
      if (allowTracking === false) return;
      const captureProperties = await withGeneralReport(properties);
      await analyticsStore.capture(eventName, captureProperties);
    } catch (cause) {
      const error = new Error("Failed to capture posthog event", {
        cause
      });
      DEBUG && console.error(error); // eslint-disable-line no-console
    }
  }
  async captureDelayed(eventName, properties, delaySeconds = 900) {
    analyticsStore.captureDelayed(eventName, properties, delaySeconds);
  }
}
const talismanAnalytics = new TalismanAnalytics();

class BaseHandler {
  #stores;
  constructor(stores) {
    this.#stores = stores;
  }
  get stores() {
    return this.#stores;
  }
}
class TabsHandler extends BaseHandler {}
class ExtensionHandler extends BaseHandler {}

// Copyright 2017-2022 @polkadot/keyring authors & contributors
// SPDX-License-Identifier: Apache-2.0
// values picked from polkadot keyring
const PKCS8_DIVIDER = new Uint8Array([161, 35, 3, 33, 0]);
const PKCS8_HEADER = new Uint8Array([48, 83, 2, 1, 1, 48, 5, 6, 3, 43, 101, 112, 4, 34, 4, 32]);
const SEC_LENGTH = 64;
const SEED_LENGTH = 32;
const SEED_OFFSET = PKCS8_HEADER.length;

// Function implementation inspired by these files:
// - https://github.com/polkadot-js/common/blob/8b0f5bf46e3edf2f52001c499ccdd555d5bdf5c2/packages/keyring/src/pair/decode.ts#L13-L56
// - https://github.com/polkadot-js/common/blob/8b0f5bf46e3edf2f52001c499ccdd555d5bdf5c2/packages/util-crypto/src/json/decrypt.ts#L11-L25
// - https://github.com/polkadot-js/common/blob/8b0f5bf46e3edf2f52001c499ccdd555d5bdf5c2/packages/util-crypto/src/json/decryptData.ts#L12-L45
//
// You can compare the output of this function to the output of polkadot-js's implementation using:
// ```ts
// (await import("@polkadot/keyring/cjs/pair/decode")).decodePair(password, jsonDecrypt(json, password), json.encoding.type).secretKey
// ```
//
// NOTE: For ed25519 accounts, this function produces a privateKey of length 64 bytes.
// When using the ed25519 curve to derive a publicKey for this privateKey, we should only take the first 32 bytes:
// - https://github.com/paulmillr/noble-curves/issues/53#issuecomment-1577362759
// - https://github.com/paulmillr/noble-curves/discussions/33#discussioncomment-5685971
// - https://github.com/paulmillr/noble-curves/pull/54
// - https://github.com/paulmillr/noble-curves/issues/88
//
// You will find that we do exactly this inside of `packages/crypto/src/derivation/deriveEd25519.ts`, and upon closer
// inspection you will also find that the publicKey produced by these 32 bytes matches the one generated by polkadot-js.
const getSecretKeyFromPjsJson = (json, password) => {
  const decrypted = jsonDecrypt(json, password);
  const header = decrypted.subarray(0, PKCS8_HEADER.length);
  if (!u8aEq(header, PKCS8_HEADER)) throw new Error("Invalid Pkcs8 header found in body");

  // current format (v3)
  let privateKey = decrypted.subarray(SEED_OFFSET, SEED_OFFSET + SEC_LENGTH);
  let divOffset = SEED_OFFSET + SEC_LENGTH;
  let divider = decrypted.subarray(divOffset, divOffset + PKCS8_DIVIDER.length);

  // legacy formats (v1, v2)
  if (!u8aEq(divider, PKCS8_DIVIDER)) {
    divOffset = SEED_OFFSET + SEED_LENGTH;
    privateKey = decrypted.subarray(SEED_OFFSET, divOffset);
    divider = decrypted.subarray(divOffset, divOffset + PKCS8_DIVIDER.length);
    if (!u8aEq(divider, PKCS8_DIVIDER)) throw new Error("Invalid Pkcs8 divider found in body");
  }
  return privateKey;
};

// @dev: frontend might need this one too

/**
 * Backend restricted
 * @param mnemonicId
 * @param curve
 * @returns
 */
const getNextDerivationPathForMnemonicId = async (mnemonicId, curve) => {
  try {
    const password = await passwordStore.getPassword();
    if (!password) throw new Error("Not logged in");
    const allAccounts = await keyringStore.getAccounts();
    const allAddresses = allAccounts.map(({
      address
    }) => address);

    // for substrate check empty derivation path first, which is how pjs derives accounts
    if (["ecdsa", "ed25519", "sr25519"].includes(curve)) {
      const address = await keyringStore.getDerivedAddress(mnemonicId, "", curve, password);
      if (!allAddresses.includes(address)) return Ok("");
    }
    for (let accountIndex = 0; accountIndex <= 1000; accountIndex += 1) {
      const derivationPath = getDerivationPathForCurve(curve, accountIndex);
      const derivedAddress = await keyringStore.getDerivedAddress(mnemonicId, derivationPath, curve, password);
      if (!allAddresses.includes(derivedAddress)) return Ok(derivationPath);
    }
    return Err("Reached maximum number of derived accounts");
  } catch (error) {
    log.error("Unable to get next derivation path", error);
    captureException(error);
    return Err("Unable to get next derivation path");
  }
};

const pjsKeypairTypeToCurve = type => {
  switch (type) {
    case "ed25519":
    case "sr25519":
    case "ecdsa":
    case "ethereum":
      return type;
  }
};
const curveToPjsKeypairType = curve => {
  switch (curve) {
    case "ed25519":
    case "sr25519":
    case "ecdsa":
    case "ethereum":
      return curve;
    default:
      throw new Error("Unsupported curve");
  }
};

const withPjsKeyringPair = async (address, cb) => {
  // use a PJS in-memory keyring to create the pair
  const keyring = new Keyring$1({
    type: "sr25519"
  });
  let pair = null;
  try {
    try {
      const account = await keyringStore.getAccount(address);
      if (!account) return Err("Account not found");
      if (account.type !== "keypair") return Err("Private key unavailable");
      const password = await passwordStore.getPassword();
      if (!password) return Err("Unauthorised");
      const secretKey = await keyringStore.getAccountSecretKey(address, password);
      const publicKey = getPublicKeyFromSecret(secretKey, account.curve);
      const type = curveToPjsKeypairType(account.curve);
      pair = keyring.addFromPair({
        secretKey,
        publicKey
      }, {
        name: account.name
      }, type);
    } catch (error) {
      passwordStore.clearPassword();
      throw error;
    }
    return Ok(await cb(pair));
  } catch (error) {
    return new Err(error);
  } finally {
    // cleanup
    if (!!pair && !pair.isLocked) pair.lock();
    keyring.removePair(address);
  }
};

const withSecretKey = async (address, cb) => {
  let secretKey = null;
  let curve;
  try {
    try {
      const account = await keyringStore.getAccount(address);
      if (!account) return Err("Account not found");
      if (account.type !== "keypair") return Err("Private key unavailable");
      const password = await passwordStore.getPassword();
      if (!password) return Err("Unauthorised");
      secretKey = await keyringStore.getAccountSecretKey(address, password);
      curve = account.curve;
    } catch (error) {
      passwordStore.clearPassword();
      throw error;
    }
    return Ok(await cb(secretKey, curve));
  } catch (error) {
    return new Err(error);
  } finally {
    // cleanup
    secretKey?.fill(0);
  }
};

const onChainId = new OnChainId({
  chainConnectors
});
const resolveNames = async names => onChainId.resolveNames(names);
const lookupAddresses = async addresses => onChainId.lookupAddresses(addresses);

// AccountsCatalogData is here in case we want to use this to store anything
// else in addition to the two `Tree` objects in the future

class AccountsCatalogStore extends StorageProvider {
  /**
   * This method will modify the store when given some actions to run.
   */
  runActions = async actions => await this.withTrees(trees => runActionsOnTrees(trees, actions));

  /**
   * This method will sort a given array of accounts into the order that they have in the store.
   */
  sortAccountsByCatalogOrder = async accounts => {
    let orderedAddresses = [];
    await this.withTrees(trees => {
      orderedAddresses = [...trees.portfolio, ...trees.watched].reduce((prev, curr) => {
        if (curr.type === "account") prev.push(curr.address);
        if (curr.type === "folder") curr.tree.forEach(item => prev.push(item.address));
        return prev;
      }, []);
    });
    return accounts.sort((a, b) => {
      const aIndex = orderedAddresses.indexOf(a.address);
      const bIndex = orderedAddresses.indexOf(b.address);
      if (aIndex === -1 && bIndex === -1) return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };

  /**
   * This method should be called with the full list of keyring accounts each time the keyring is changed.
   *
   * This will ensure that the catalog and the keyring stay in sync.
   *
   * If all of the given accounts are already in the catalog, this method will noop.
   */
  syncAccounts = async accounts => await this.withTrees(trees => {
    const validAccounts = accounts.filter(isAccountNotContact);

    // add missing accounts
    const hasAdded = validAccounts.map(account => {
      const [addTree, rmTree] = isAccountPortfolio(account) ? [trees.portfolio, trees.watched] : [trees.watched, trees.portfolio];
      const added = addAccount(addTree, account.address);
      const removed = removeAccount(rmTree, account.address);
      return added || removed;
    }).some(status => {
      // if any accounts were added or removed, inform the store that a change was made
      return status === true;
    });

    // remove items that dont match any account
    const validAddresses = validAccounts.map(a => a.address);
    const hasRemoved = [trees.portfolio, trees.watched].map(tree => {
      const treeAddresses = recGetAllAddresses(tree);
      const removeAddresses = treeAddresses.filter(ta => !validAddresses.some(va => isAddressEqual(ta, va)));
      if (!removeAddresses.length) return false;
      removeAddresses.forEach(a => removeAccount(tree, a));
      return true;
    }).some(hasRemoved => hasRemoved);
    return hasAdded || hasRemoved;
  });

  /**
   * A helper method on this store.
   *
   * Intended usage:
   * 1. Call this to get a reference to the store's data inside the callback
   * 2. Read or change the data as much as you like inside the callback
   * 3. Return `true` from the callback if the data was changed, otherwise return `false`
   *
   * By using this helper, the data will always be a valid `Trees` type,
   * even when the underlying localStorage has never been initialized.
   */
  withTrees = async callback => {
    // get the data from localStorage
    const store = await this.get();

    // make sure it is of type `Trees`, and coerce it if not
    const ensureArray = item => Array.isArray(item) ? item : [];
    const trees = {
      portfolio: ensureArray(store.portfolio),
      watched: ensureArray(store.watched).filter(isAccountNotContact)
    };

    // run the callback against the data
    const status = callback(trees);

    // update localStorage, but only if the callback returned `true`
    if (status === true) await this.set(trees);
  };
}
const emptyCatalog = {
  portfolio: [],
  watched: []
};
const accountsCatalogStore = new AccountsCatalogStore("accountsCatalog");

// existing values for the method field, prior to keyring migration

class AccountsHandler extends ExtensionHandler {
  async captureAccountCreateEvent(address, method) {
    let type = "unknown";
    try {
      type = getAccountPlatformFromAddress(address);

      // match with legacy naming
      if (type === "polkadot") type = "substrate";
    } catch (e) {
      log.warn("Unknown encoding for address", address);
    }

    // match with legacy naming
    if (method === "ledger-polkadot") method = "hardware";
    if (method === "ledger-ethereum") method = "hardware";
    if (method === "polkadot-vault") method = "qr";
    if (method === "watch-only") method = "watched";
    talismanAnalytics.capture("account create", {
      type,
      method,
      isOnboarded: await this.stores.app.getIsOnboarded()
    });
  }
  async accountCreateJson({
    unlockedPairs
  }) {
    const password = await this.stores.password.getPassword();
    assert(password, "Not logged in");
    const options = unlockedPairs.map(json => {
      return {
        name: json.meta?.name || "Json Import",
        curve: json.encoding.content[1],
        secretKey: getSecretKeyFromPjsJson(json, "")
      };
    });
    const accounts = await keyringStore.addAccountKeypairMulti(options);
    return accounts.map(a => {
      if (a.type === "keypair") this.captureAccountCreateEvent(a.address, "json");
      return a.address;
    });
  }
  async accountForget({
    address
  }) {
    const account = await keyringStore.getAccount(address);
    assert(account, "Unable to find account");
    talismanAnalytics.capture("account forget", {
      type: account.type,
      curve: account.type === "keypair" ? account.curve : undefined
    });
    await keyringStore.removeAccount(address);

    // remove associated authorizations
    this.stores.sites.forgetAccount(address);

    // remove from accounts catalog store (sorting, folders)
    this.stores.accountsCatalog.syncAccounts(await keyringStore.getAccounts());
    return true;
  }
  async accountExport({
    address,
    password,
    exportPw
  }) {
    await this.stores.password.checkPassword(password);
    const {
      err,
      val
    } = await withPjsKeyringPair(address, async pair => {
      talismanAnalytics.capture("account export", {
        type: pair.type,
        mode: "json"
      });
      return {
        exportedJson: pair.toJson(exportPw)
      };
    });
    if (err) throw new Error(val);
    return val;
  }

  /**
   * Exports all hot accounts to a json file using p.js compatible json format.
   */
  async accountExportAll({
    password,
    exportPw
  }) {
    await this.stores.password.checkPassword(password);
    const accounts = await keyringStore.getAccounts();
    const accountsToExport = accounts.filter(account =>
    // export only keypair accounts, others have metadata that are specific to each wallet
    account.type === "keypair" &&
    // only export pjs compatible accounts to be compatible with pjs json format
    ["sr25519", "ed25519", "ecdsa", "ethereum"].includes(account.curve));
    const jsonAccounts = [];

    // fetch secretKeys sequentially to avoid lock issues
    for (const {
      address
    } of accountsToExport) {
      const {
        err,
        val
      } = await withPjsKeyringPair(address, pair => pair.toJson(exportPw));
      if (err) throw new Error(val);
      jsonAccounts.push(val);
    }

    // export accounts the same way as keyring.backupAccounts() from @polkadot/ui-keyring
    const exportedJson = objectSpread({}, jsonEncrypt(stringToU8a(JSON.stringify(jsonAccounts)), ["batch-pkcs8"], exportPw), {
      accounts: jsonAccounts.map(account => ({
        address: account.address,
        meta: account.meta
      }))
    });
    return {
      exportedJson
    };
  }
  async accountExportPrivateKey({
    address,
    password
  }) {
    await this.stores.password.checkPassword(password);
    const {
      err,
      val
    } = await withSecretKey(address, async (secretKey, curve) => {
      talismanAnalytics.capture("account export", {
        type: curve,
        mode: "pk"
      });
      switch (curve) {
        case "ethereum":
          return hex.encode(secretKey);
        case "solana":
          return base58.encode(new Uint8Array([...secretKey, ...getPublicKeySolana(secretKey)]));
        default:
          throw new Error("Unsupported curve");
      }
    });
    if (err) throw new Error(val);
    return val;
  }
  async accountExternalSetIsPortfolio({
    address,
    isPortfolio
  }) {
    await keyringStore.updateAccount(address, {
      isPortfolio
    });
    return true;
  }
  async accountRename({
    address,
    name
  }) {
    await keyringStore.updateAccount(address, {
      name
    });
    return true;
  }
  accountsSubscribe(id, port) {
    return genericAsyncSubscription(id, port,
    // make sure the sort order is updated when the catalog changes
    combineLatest([keyringStore.accounts$, this.stores.accountsCatalog.observable]), ([accounts]) => sortAccounts(this.stores.accountsCatalog)(accounts));
  }
  accountsCatalogSubscribe(id, port) {
    return genericAsyncSubscription(id, port,
    // make sure the list of accounts in the catalog is updated when the keyring changes
    combineLatest([keyringStore.accounts$, this.stores.accountsCatalog.observable]), async ([, catalog]) =>
    // on first start-up, the store (loaded from localstorage) will be empty
    //
    // when this happens, instead of sending `{}` or `undefined` to the frontend,
    // we'll send an empty catalog of the correct type `AccountsCatalogData`
    Object.keys(catalog).length === 0 ? emptyCatalog : catalog);
  }
  accountsCatalogRunActions(actions) {
    return this.stores.accountsCatalog.runActions(actions);
  }
  async addressLookup(lookup) {
    switch (lookup.type) {
      case "mnemonicId":
        {
          const {
            mnemonicId,
            derivationPath,
            curve
          } = lookup;
          const password = await this.stores.password.getPassword();
          assert(password, "Not logged in");
          const mnemonic = await keyringStore.getMnemonicText(mnemonicId, password);
          return addressFromMnemonic(mnemonic, derivationPath, curve);
        }
      case "mnemonic":
        {
          const {
            mnemonic,
            derivationPath,
            curve
          } = lookup;
          return addressFromMnemonic(mnemonic, derivationPath, curve);
        }
    }
  }
  async getNextDerivationPath({
    mnemonicId,
    curve
  }) {
    const {
      val: derivationPath,
      ok
    } = await getNextDerivationPathForMnemonicId(mnemonicId, curve);
    assert(ok, "Failed to lookup next available derivation path");
    return derivationPath;
  }
  async accountsAddExternal(options) {
    const password = await this.stores.password.getPassword();
    assert(password, "Not logged in");
    const accounts = await keyringStore.addAccountExternalMulti(options);
    for (const account of accounts) this.captureAccountCreateEvent(account.address, account.type);
    return accounts.map(a => a.address);
  }
  async accountsAddDerive(options) {
    const password = await this.stores.password.getPassword();
    assert(password, "Not logged in");
    const accounts = await keyringStore.addAccountDeriveMulti(options);
    for (const account of accounts) this.captureAccountCreateEvent(account.address, account.type);
    return accounts.map(a => a.address);
  }
  async accountsAddKeypair(options) {
    const password = await this.stores.password.getPassword();
    assert(password, "Not logged in");
    const deserializedOptions = options.map(o => ({
      ...o,
      secretKey: base64.decode(o.secretKey)
    }));
    const accounts = await keyringStore.addAccountKeypairMulti(deserializedOptions);
    for (const account of accounts) this.captureAccountCreateEvent(account.address, account.type);
    return accounts.map(a => a.address);
  }
  async updateContact({
    address,
    name,
    genesisHash
  }) {
    const account = await keyringStore.getAccount(address);
    if (account?.type !== "contact") throw new Error("Contact not found");
    await keyringStore.updateAccount(address, {
      name,
      genesisHash
    });
    return true;
  }
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(accounts.add.external)":
        return this.accountsAddExternal(request);
      case "pri(accounts.add.derive)":
        return this.accountsAddDerive(request);
      case "pri(accounts.add.keypair)":
        return this.accountsAddKeypair(request);
      case "pri(accounts.create.json)":
        return this.accountCreateJson(request);
      case "pri(accounts.external.setIsPortfolio)":
        return this.accountExternalSetIsPortfolio(request);
      case "pri(accounts.forget)":
        return this.accountForget(request);
      case "pri(accounts.export)":
        return this.accountExport(request);
      case "pri(accounts.export.all)":
        return this.accountExportAll(request);
      case "pri(accounts.export.pk)":
        return this.accountExportPrivateKey(request);
      case "pri(accounts.rename)":
        return this.accountRename(request);
      case "pri(accounts.update.contact)":
        return this.updateContact(request);
      case "pri(accounts.subscribe)":
        return this.accountsSubscribe(id, port);
      case "pri(accounts.catalog.subscribe)":
        return this.accountsCatalogSubscribe(id, port);
      case "pri(accounts.catalog.runActions)":
        return this.accountsCatalogRunActions(request);
      case "pri(accounts.address.lookup)":
        return this.addressLookup(request);
      case "pri(accounts.derivationPath.next)":
        return this.getNextDerivationPath(request);
      case "pri(accounts.onChainIds.resolveNames)":
        return Object.fromEntries(await resolveNames(request));
      case "pri(accounts.onChainIds.lookupAddresses)":
        return Object.fromEntries(await lookupAddresses(request));
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

const WINDOW_OPTS = {
  type: "popup",
  url: chrome.runtime.getURL("popup.html"),
  width: 400,
  height: 600
};
class WindowManager {
  #windows = [];
  // Prevents opening two onboarding tabs at once
  #onboardingTabOpening = false;
  // Prevents opening two login popups at once
  #isLoginPromptOpen = false;
  waitTabLoaded = tabId => {
    // wait either page to be loaded or a 3 seconds timeout, first to occur wins
    // this is to handle edge cases where page is closed or breaks before loading
    return Promise.race([
    //promise that waits for page to be loaded
    new Promise(resolve => {
      const handler = (id, changeInfo) => {
        if (id !== tabId) return;
        if (changeInfo.status === "complete") {
          // dispose of the listener to prevent a memory leak
          chrome.tabs.onUpdated.removeListener(handler);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(handler);
    }),
    // promise for the timeout
    sleep(3000)]);
  };

  /**
   * Creates a new tab for a url if it isn't already open, or else focuses the existing tab if it is.
   *
   * @param url: The full url including # path or route that should be used to create the tab if it doesn't exist
   * @param baseUrl: Optional, the base url (eg 'chrome-extension://idgkbaeeleekhpeoakcbpbcncikdhboc/dashboard.html') without the # path
   *
   */
  async openTabOnce({
    url,
    baseUrl,
    shouldFocus = true
  }) {
    const queryUrl = baseUrl ?? url;
    let [tab] = await chrome.tabs.query({
      url: queryUrl
    });
    if (tab?.id) {
      const options = {
        active: shouldFocus
      };
      if (url !== tab.url) options.url = url;
      const {
        windowId
      } = await chrome.tabs.update(tab.id, options);
      if (shouldFocus && windowId) {
        const {
          focused
        } = await chrome.windows.get(windowId);
        if (!focused) await chrome.windows.update(windowId, {
          focused: true
        });
      }
    } else {
      tab = await chrome.tabs.create({
        url
      });
    }

    // wait for page to be loaded if it isn't
    if (tab.status === "loading") await this.waitTabLoaded(tab.id);
    return tab;
  }
  async openOnboarding(route) {
    if (this.#onboardingTabOpening) return;
    this.#onboardingTabOpening = true;
    const baseUrl = chrome.runtime.getURL(`onboarding.html`);
    const onboarded = await appStore.getIsOnboarded();
    await this.openTabOnce({
      url: `${baseUrl}${route ? `#${route}` : ""}`,
      baseUrl,
      shouldFocus: onboarded
    });
    this.#onboardingTabOpening = false;
  }
  async openDashboard({
    route
  }) {
    const baseUrl = chrome.runtime.getURL("dashboard.html");
    await this.openTabOnce({
      url: `${baseUrl}#${route}`,
      baseUrl
    });
    return true;
  }
  async popupClose(id) {
    if (id) {
      await chrome.windows.remove(id);
      this.#windows = this.#windows.filter(wid => wid !== id);
    } else {
      await Promise.all(this.#windows.map(wid => chrome.windows.remove(wid)));
      this.#windows = [];
    }
  }
  async popupOpen(argument, onClose) {
    const currWindow = await chrome.windows.getLastFocused();
    const [widthDelta, heightDelta] = await appStore.get("popupSizeDelta");
    const {
      left,
      top
    } = {
      top: 100 + (currWindow?.top ?? 0),
      left: currWindow?.width ? (currWindow.left ?? 0) + currWindow.width - 500 : 500
    };
    const popupCreateArgs = {
      ...WINDOW_OPTS,
      url: chrome.runtime.getURL(`popup.html${argument ?? ""}`),
      top,
      left,
      width: WINDOW_OPTS.width + widthDelta,
      height: WINDOW_OPTS.height + heightDelta
    };
    let popup;
    try {
      popup = await chrome.windows.create(popupCreateArgs);
    } catch (err) {
      log.error("Failed to open popup", err);

      // retry with default size, as an invalid size could be the source of the error
      popup = await chrome.windows.create({
        ...popupCreateArgs,
        width: WINDOW_OPTS.width,
        height: WINDOW_OPTS.height
      });
    }
    if (typeof popup?.id !== "undefined") {
      this.#windows.push(popup.id || 0);
      // firefox compatibility (cannot be set at creation)
      if (IS_FIREFOX && popup.left !== left && popup.state !== "fullscreen") {
        await chrome.windows.update(popup.id, {
          left,
          top
        });
      }
    }
    if (onClose) {
      chrome.windows.onRemoved.addListener(id => {
        if (id === popup.id) {
          this.#windows = this.#windows.filter(wid => wid !== id);
          onClose();
        }
      });
    }

    // popup is undefined when running tests
    return popup?.id;
  }
  async promptLogin() {
    if (this.#isLoginPromptOpen) return false;
    this.#isLoginPromptOpen = true;
    await windowManager.popupOpen(`?closeAfterLogin=true`, () => {
      this.#isLoginPromptOpen = false;
    });
    return true;
  }
}
const windowManager = new WindowManager();

const isRequestOfType = (request, type) => {
  return request.type === type;
};

class RequestCounts {
  #counts;
  constructor(requests) {
    const reqCounts = requests.reduce((counts, request) => {
      if (!counts[request.type]) counts[request.type] = 0;
      counts[request.type] += 1;
      return counts;
    }, {});
    this.#counts = reqCounts;
  }
  get(type) {
    if (type in this.#counts) return this.#counts[type];else return 0;
  }
  all() {
    return Object.values(this.#counts).reduce((sum, each) => sum + each, 0);
  }
}
class RequestStore {
  // `requests` is the primary list of items that need responding to by the user
  requests = {};
  // `observable` is kept up to date with the list of requests, and ensures that the front end
  // can easily set up a subscription to the data, and the state can show the correct message on the icon
  observable = new ReplaySubject(1);
  allRequests(type) {
    if (!type) return Object.values(this.requests).map(req => req.request);

    // get only values with the matching type
    const requestValues = Object.entries(this.requests).filter(([key]) => key.split(".")[0] === type).map(([, value]) => value.request);
    return requestValues;
  }
  clearRequests() {
    Object.keys(this.requests).forEach(key => {
      windowManager.popupClose(this.requests[key].windowId);
      delete this.requests[key];
    });
    this.observable.next(this.getAllRequests());
  }
  createRequest(requestOptions, port) {
    const id = `${requestOptions.type}.${v4()}`;
    return new Promise((resolve, reject) => {
      // reject pending request if user closes the tab that requested it
      if (port?.onDisconnect) port.onDisconnect.addListener(() => {
        if (!this.requests[id]) return;
        delete this.requests[id];
        this.observable.next(this.getAllRequests());
        reject(new Error("Port disconnected"));
      });
      const newRequest = {
        ...requestOptions,
        id
      };
      const request = {
        ...newRequest,
        ...this.onCompleteRequest(id, resolve, reject)
      };
      this.requests[id] = {
        request
      };
      windowManager.popupOpen(`#/${requestOptions.type}/${id}`, () => {
        if (!this.requests[id]) return;
        delete this.requests[id];
        this.observable.next(this.getAllRequests());
        reject(new Error("Cancelled"));
      }).then(windowId => {
        if (windowId === undefined && !TEST) reject(new Error("Failed to open popup"));else {
          this.requests[id].windowId = windowId;
          this.observable.next(this.getAllRequests());
        }
      }).catch(reject);
    });
  }
  subscribe(id, port, types) {
    return genericSubscription(id, port, this.observable.pipe(map(reqs => types ? reqs.filter(req => types.includes(req.type)) : reqs)));
  }
  onCompleteRequest(id, resolve, reject) {
    const complete = () => {
      if (this.requests[id]) windowManager.popupClose(this.requests[id].windowId);
      delete this.requests[id];
      this.observable.next(this.getAllRequests());
    };
    return {
      reject: error => {
        complete();
        reject(error);
      },
      resolve: result => {
        complete();
        resolve(result);
      }
    };
  }
  getCounts() {
    return new RequestCounts(this.allRequests());
  }
  getRequest(id) {
    const {
      request
    } = this.requests[id];
    const requestType = id.split(".")[0];
    if (isRequestOfType(request, requestType)) return request;
    return;
  }
  deleteRequest(id) {
    if (this.requests[id]) windowManager.popupClose(this.requests[id].windowId);
    delete this.requests[id];
    this.observable.next(this.getAllRequests());
    return;
  }
  getAllRequests(requestType) {
    return (requestType ? this.allRequests(requestType) : this.allRequests()).map(this.extractBaseRequest);
  }
  extractBaseRequest(request) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      reject,
      resolve,
      ...data
    } = request;
    return data;
  }
}
const requestStore = new RequestStore();

let isLoaded = false;

/**
 * @deprecated
 * @function awaitKeyringLoaded
 * @description
 * This function is used to wait for the keyring to be loaded. It returns a promise which resolves to true once all accounts have been loaded into the keyring.
 */
const awaitKeyringLoaded = async () => {
  log.warn("[deprecated] awaitKeyringLoaded", new Error().stack);

  // the keyring does funky stuff when we try and access it before this is ready
  // wait for `@polkadot/util-crypto` to be ready (it needs to load some wasm)
  await cryptoWaitReady();
  if (!isLoaded) {
    keyring.loadAll({
      store: new AccountsStore(),
      type: "sr25519",
      filter: json => {
        return typeof json?.address === "string";
      }
    });
    isLoaded = true;
  }

  // wait for in memory accounts count to match expected accounts count
  await new Promise(resolve => {
    const keyringSubscription = keyring.accounts.subject.subscribe(async addresses => {
      const storageKeys = Object.keys(await chrome.storage.local.get(null));
      const loadedAccountsCount = Object.keys(addresses).length;
      const totalAccountsCount = storageKeys.filter(key => key.startsWith("account:0x")).length;
      if (loadedAccountsCount < totalAccountsCount) return;
      keyringSubscription.unsubscribe();
      resolve(true);
    });
  });
};

const LEGACY_ROOT = "ROOT";
const getLegacyAuthenticationAccount = () => {
  const allAccounts = keyring.getAccounts();
  if (allAccounts.length === 0) return;
  const storedSeedAccount = allAccounts.find(({
    meta
  }) => meta.origin === LEGACY_ROOT);
  if (storedSeedAccount) return storedSeedAccount;
  return;
};

// Deprecated login method since v1.19
const authenticateLegacyMethod = async password => {
  await awaitKeyringLoaded();
  // attempt to log in via the legacy method
  const primaryAccount = getLegacyAuthenticationAccount();
  assert(primaryAccount, "No primary account, unable to authorise");

  // fetch keyring pair from address
  const pair = keyring.getPair(primaryAccount.address);

  // attempt unlock the pair
  // a successful unlock means authenticated
  pair.unlock(password);
  pair.lock();
};

const getHostName = url => {
  try {
    const host = new URL(url).hostname;
    return Ok(host);
  } catch (error) {
    log.error(url, error);
    return Err("Unable to get host from url");
  }
};

const METAMASK_REPO = "https://api.github.com/repos/MetaMask/eth-phishing-detect";
const METAMASK_CONTENT_URL = `${METAMASK_REPO}/contents/src/config.json`;
const POLKADOT_REPO = "https://api.github.com/repos/polkadot-js/phishing";
const POLKADOT_CONTENT_URL = "https://polkadot.js.org/phishing/all.json";
const COMMIT_PATH = "/commits/master";
const REFRESH_INTERVAL_MIN = 20;
const DEFAULT_ALLOW = [TAOSTATS_WEB_APP_DOMAIN, TAOSTATS_WEB_APP_DOMAIN.split(".").slice(1).join(".")];

// don't persist Talisman

class ParaverseProtector {
  #initialised;
  #commits = {
    polkadot: "",
    metamask: ""
  };
  lists = {
    talisman: {
      allow: DEFAULT_ALLOW,
      deny: []
    },
    polkadot: {
      allow: [],
      deny: []
    }
  };
  #refreshTimer;
  #metamaskDetector = new MetamaskDetector(metamaskInitialData);
  #persistQueue;
  constructor() {
    this.setRefreshTimer = this.setRefreshTimer.bind(this);
    this.#refreshTimer = setInterval(this.setRefreshTimer, REFRESH_INTERVAL_MIN * 60 * 1000);
    // do the first check once after 30 seconds
    setTimeout(this.setRefreshTimer, 30_000);
    this.#initialised = this.initialise();
  }
  async initialise() {
    // restore persisted data
    return new Promise(resolve => {
      db.on("ready", () => {
        db.phishing.bulkGet(["polkadot", "metamask"]).then(persisted => {
          persisted.filter(isNotNil).forEach(({
            source,
            compressedHostList,
            hostList,
            commitSha
          }) => {
            const fullData = hostList ? hostList : JSON.parse(
            // todo remove decompressFromUTF16 in next release
            compressedHostList && decompressFromUTF16(compressedHostList) || "{}");
            if (!fullData) return;
            this.#commits[source] = commitSha;
            if (source === "metamask") {
              this.#metamaskDetector = new MetamaskDetector(fullData);
            } else this.lists[source] = fullData;
          });
          resolve(true);
        });
      }, false);
    }).catch(err => {
      // in the case of any error, the user should only be unprotected until the first update runs (30 seconds)
      log.error(err);
      return true;
    });
  }
  isInitialised() {
    return this.#initialised;
  }
  async setRefreshTimer() {
    await Promise.all([this.getMetamaskCommit(), this.getPolkadotCommit()]);
    await this.persistAllData();
  }
  async persistAllData() {
    if (this.#persistQueue && Object.values(this.#persistQueue).length > 0) {
      const data = this.#persistQueue;
      this.#persistQueue = {};
      await db.phishing.bulkPut(Object.values(data)).catch(cause => {
        // put it back
        this.#persistQueue = data;
        // we can't do much about DatabaseClosedError errors
        if (!(cause instanceof Dexie.DatabaseClosedError) && !(cause.name !== Dexie.errnames.DatabaseClosed)) {
          const error = new Error("Failed to persist phishing list", {
            cause
          });
          sentry.captureException(error);
        }
      });
    }
  }
  persistData(source, commitSha, data) {
    if (!this.#persistQueue) this.#persistQueue = {};
    this.#persistQueue[source] = {
      source,
      commitSha,
      hostList: data
    };
  }
  async getCommitSha(url) {
    const sha = await fetch(url, {
      headers: [["Accept", "application/vnd.github.VERSION.sha"]]
    });
    return await sha.text();
  }
  async getMetamaskCommit() {
    try {
      const sha = await this.getCommitSha(`${METAMASK_REPO}${COMMIT_PATH}`);
      if (sha !== this.#commits.metamask) {
        const mmConfig = await this.getMetamaskData();
        this.#metamaskDetector = new MetamaskDetector(mmConfig);
        this.#commits.metamask = sha;
        this.persistData("metamask", sha, mmConfig);
      }
    } catch (error) {
      log.error("Error getting metamask phishing commit and data", {
        error
      });
    }
  }
  async getPolkadotCommit() {
    try {
      const sha = await this.getCommitSha(`${POLKADOT_REPO}${COMMIT_PATH}`);
      if (sha !== this.#commits.polkadot) {
        this.lists.polkadot = await this.getPolkadotData();
        this.#commits.polkadot = sha;
        this.persistData("polkadot", sha, this.lists.polkadot);
      }
    } catch (error) {
      log.error("Error getting polkadot phishing commit and data", {
        error
      });
    }
  }
  async getPolkadotData() {
    return await this.getData(POLKADOT_CONTENT_URL);
  }
  async getData(url) {
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Error fetching data from ${url}`);
  }
  async getMetamaskData() {
    const json = await this.getData(METAMASK_CONTENT_URL);
    if (json.content === "" && json.download_url) return await this.getData(json.download_url);
    if (!json.content) throw new Error("Unable to get content for Metamask phishing list");
    return JSON.parse(Buffer.from(json.content, "base64").toString());
  }
  async isPhishingSite(url) {
    await this.isInitialised();
    const {
      val: host,
      ok
    } = getHostName(url);
    if (!ok) return false;

    // first check our lists
    if (this.lists.talisman.allow.includes(host)) return false;
    if (this.lists.talisman.deny.includes(host)) return true;

    // then check polkadot, phishFort, and metamask lists
    const pdResult = checkHost(this.lists.polkadot.deny, host);
    if (pdResult) {
      log.warn(`Phishing site listed on Polkadot list: ${host}`);
      return true;
    }
    const {
      result: mmResult
    } = this.#metamaskDetector.check(host);
    if (mmResult) {
      log.warn(`Phishing site listed on MetaMask list: ${host}`);
      return true;
    }
    return false;
  }
  addException(url) {
    const {
      val: host,
      ok
    } = getHostName(url);
    if (!ok) return false;
    this.lists.talisman.allow.push(host);
    return true;
  }
}

const protector = new ParaverseProtector();

class AppHandler extends ExtensionHandler {
  async createPassword({
    pass,
    passConfirm
  }) {
    if (!(DEBUG || TEST)) await sleep(1000);
    assert(pass, "Password cannot be empty");
    assert(passConfirm, "Password confirm cannot be empty");
    assert(pass === passConfirm, "Passwords do not match");
    const accounts = await keyringStore.getAccounts();
    assert(!accounts.length, "Accounts already exist");

    // Before any accounts are created, we want to add talisman.xyz as an authorised site with connectAllSubstrate
    this.stores.sites.set({
      [TAOSTATS_WEB_APP_DOMAIN]: {
        addresses: [],
        connectAllSubstrate: true,
        id: TAOSTATS_WEB_APP_DOMAIN,
        origin: "Taostats",
        url: `https://${TAOSTATS_WEB_APP_DOMAIN}`
      }
    });
    const {
      password: transformedPw,
      salt,
      secret,
      check
    } = await this.stores.password.createPassword(pass);
    assert(transformedPw, "Password creation failed");
    this.stores.password.setPassword(transformedPw);
    await this.stores.password.set({
      isTrimmed: false,
      isHashed: true,
      salt,
      secret,
      check
    });
    talismanAnalytics.capture("password created");
    return true;
  }
  async authenticate({
    pass
  }) {
    if (!(DEBUG || TEST)) await sleep(1000);
    try {
      const {
        secret,
        check
      } = await this.stores.password.get();
      if (!secret || !check) {
        const transformedPassword = await this.stores.password.transformPassword(pass);

        // attempt to log in via the legacy method
        authenticateLegacyMethod(transformedPassword);

        // we can now set up the auth secret
        this.stores.password.setPassword(transformedPassword);
        await this.stores.password.setupAuthSecret(transformedPassword);
        talismanAnalytics.capture("authenticate", {
          method: "legacy"
        });
      } else {
        await this.stores.password.authenticate(pass);
        talismanAnalytics.capture("authenticate", {
          method: "new"
        });
      }
      // start the autolock timer
      this.stores.settings.get().then(({
        autoLockMinutes
      }) => this.stores.password.resetAutolockTimer(autoLockMinutes));
      return true;
    } catch (e) {
      this.stores.password.clearPassword();
      return false;
    }
  }
  authStatus() {
    return this.stores.password.isLoggedIn.value;
  }
  lock() {
    this.stores.password.clearPassword();
    return this.authStatus();
  }
  async changePassword(id, port, {
    currentPw,
    newPw,
    newPwConfirm
  }) {
    const progressObservable = new BehaviorSubject({
      status: ChangePasswordStatusUpdateStatus.VALIDATING
    });
    const updateProgress = (val, message) => progressObservable.next({
      status: val,
      message
    });
    genericSubscription(id, port, progressObservable);
    try {
      // only allow users who have confirmed backing up their recovery phrase to change PW
      const mnemonics = await keyringStore.getMnemonics();
      const mnemonicsUnconfirmed = mnemonics.some(m => !m.confirmed);
      assert(!mnemonicsUnconfirmed, "Please backup all recovery phrases before attempting to change your password.");

      // check given PW
      await this.stores.password.checkPassword(currentPw);

      // test if the two inputs of the new password are the same
      assert(newPw === newPwConfirm, "New password and new password confirmation must match");
      updateProgress(ChangePasswordStatusUpdateStatus.PREPARING);
      const isHashedAlready = await this.stores.password.get("isHashed");
      let hashedNewPw, newSalt;
      if (isHashedAlready) hashedNewPw = await this.stores.password.getHashedPassword(newPw);else {
        // need to create a new password and salt
        const {
          salt,
          password
        } = await this.stores.password.createPassword(newPw);
        hashedNewPw = password;
        newSalt = salt;
      }

      // compute new keyring password
      const transformedPw = await this.stores.password.transformPassword(currentPw);

      // precompute password check data so we dont attempt to change keyring password if this fails
      const secretResult = await this.stores.password.createAuthSecret(hashedNewPw);

      // the change is atomic: if this breaks then local storage wont be updated, we dont need to bother with a backup/restore mechanism
      updateProgress(ChangePasswordStatusUpdateStatus.KEYPAIRS);
      await keyringStore.changePassword(transformedPw, hashedNewPw);

      // update password storage
      updateProgress(ChangePasswordStatusUpdateStatus.AUTH);
      const pwStoreData = {
        ...secretResult,
        isTrimmed: false,
        isHashed: true
      };
      if (newSalt) {
        pwStoreData.salt = newSalt;
      }
      await this.stores.password.set(pwStoreData);
      await this.stores.password.setPlaintextPassword(newPw);
      updateProgress(ChangePasswordStatusUpdateStatus.DONE);
      return true;
    } catch (error) {
      updateProgress(ChangePasswordStatusUpdateStatus.ERROR, error.message);
      return false;
    }
  }
  async checkPassword({
    password
  }) {
    await this.stores.password.checkPassword(password);
    return true;
  }
  async resetWallet() {
    this.stores.app.set({
      onboarded: "FALSE"
    });
    await this.stores.password.reset();
    await keyringStore.reset();
    await windowManager.openOnboarding("/import?resetWallet=true");
    // since all accounts are being wiped, all sites need to be reset - so they may as well be wiped.
    await this.stores.sites.clear();
    // since all accounts are being wiped, account catalog also needs to be wiped.
    await this.stores.accountsCatalog.clear();
    return true;
  }
  async dashboardOpen({
    route
  }) {
    if (!(await this.stores.app.getIsOnboarded())) return this.onboardOpen();
    windowManager.openDashboard({
      route
    });
    return true;
  }
  async openSendFunds({
    from,
    tokenId,
    tokenSymbol,
    to
  }) {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (tokenId) params.append("tokenId", tokenId);
    // tokenId takes precedence over tokenSymbol
    if (!tokenId && tokenSymbol) params.append("tokenSymbol", tokenSymbol);
    if (to) params.append("to", to);
    await windowManager.popupOpen(`#/send?${params.toString()}`);
    return true;
  }
  onboardOpen() {
    windowManager.openOnboarding();
    return true;
  }
  popupOpen(argument) {
    windowManager.popupOpen(argument);
    return true;
  }
  promptLogin() {
    return windowManager.promptLogin();
  }
  async handle(id, type, request, port) {
    switch (type) {
      // --------------------------------------------------------------------
      // app handlers -------------------------------------------------------
      // --------------------------------------------------------------------
      case "pri(app.onboardCreatePassword)":
        return this.createPassword(request);
      case "pri(app.authenticate)":
        return this.authenticate(request);
      case "pri(app.authStatus)":
        return this.authStatus();
      case "pri(app.authStatus.subscribe)":
        return genericSubscription(id, port, this.stores.password.isLoggedIn);
      case "pri(app.lock)":
        return this.lock();
      case "pri(app.changePassword)":
      case "pri(app.changePassword.subscribe)":
        return await this.changePassword(id, port, request);
      case "pri(app.checkPassword)":
        return await this.checkPassword(request);
      case "pri(app.dashboardOpen)":
        return await this.dashboardOpen(request);
      case "pri(app.onboardOpen)":
        return this.onboardOpen();
      case "pri(app.popupOpen)":
        return this.popupOpen(request);
      case "pri(app.promptLogin)":
        return this.promptLogin();
      case "pri(app.sendFunds.open)":
        return this.openSendFunds(request);
      case "pri(app.analyticsCapture)":
        {
          const {
            eventName,
            options
          } = request;
          talismanAnalytics.capture(eventName, options);
          return true;
        }
      case "pri(app.phishing.addException)":
        {
          return protector.addException(request.url);
        }
      case "pri(app.resetWallet)":
        return this.resetWallet();
      case "pri(app.requests)":
        return requestStore.subscribe(id, port);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

/**
 * watches balances of owned accounts and as soon as one is found, hides the get started screen
 * @returns
 */
const hideGetStartedOnceFunded = async () => {
  const hideGetStarted = await appStore.get("hideGetStarted");
  if (hideGetStarted) return;
  const sub = combineLatest([settingsStore.observable, keyringStore.accounts$, chaindataProvider.getTokensMapById(), chaindataProvider.getNetworksMapById$(), balancesStore$.pipe(map(store => store.balances)), tokenRatesStore.storage$.pipe(map(storage => storage.tokenRates))]).pipe(throttleTime(1_000, undefined, {
    trailing: true
  })).subscribe(async ([settings, accounts, tokens, networksById, balances, tokenRates]) => {
    try {
      const mapOwnedAccounts = Object.fromEntries(accounts.filter(isAccountOwned).map(account => [account.address, account]));
      if (!Object.keys(mapOwnedAccounts).length) return;
      const balancesByAddress = Object.values(balances).reduce((acc, balance) => {
        const address = normalizeAddress(balance.address);
        const account = mapOwnedAccounts[address];
        if (!account) return acc;
        if (!acc[address]) acc[address] = [];
        const network = networksById[balance.networkId];
        if (network && isAccountCompatibleWithNetwork(network, account)) acc[address].push(balance);
        return acc;
      }, {});
      for (const address of Object.keys(mapOwnedAccounts)) {
        const accBalances = new Balances(balancesByAddress[address] ?? [], {
          tokens,
          tokenRates
        });
        if (accBalances.sum.fiat(settings.selectedCurrency).total > 0) {
          await appStore.set({
            hideGetStarted: true
          });
          sub.unsubscribe();
          break;
        }
      }
    } catch (err) {
      log.error("hideGetStartedOnceFunded", {
        err
      });
    }
  });
};

class AssetDiscoveryHandler extends ExtensionHandler {
  async handle(id, type, request) {
    switch (type) {
      case "pri(assetDiscovery.scan.start)":
        return assetDiscoveryScanner.startScan(request, true);
      case "pri(assetDiscovery.scan.stop)":
        return assetDiscoveryScanner.stopScan();
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class BalancesHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      // --------------------------------------------------------------------
      // balances handlers -----------------------------------------------------
      // --------------------------------------------------------------------
      case "pri(balances.get)":
        return getBalance(request);
      case "pri(balances.subscribe)":
        return genericSubscription(id, port, walletBalances$);

      // TODO: Replace this call with something internal to the balances store
      // i.e. refactor the balances store to allow us to subscribe to arbitrary balances here,
      // instead of being limited to the accounts which are in the wallet's keystore
      case "pri(balances.byparams.subscribe)":
        return genericSubscription(id, port, getBalancesByParams$(request));
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
const getBalance = ({
  address,
  tokenId
}) => {
  return firstValueFrom(balancesProvider.getBalances$({
    [tokenId]: [address]
  }).pipe(filter(res => res.status === "live"), map(res => res.balances[0] ?? null)));
};
const getBalancesByParams$ = params => {
  return getSharedObservable("getBalancesByParams$", params, () => {
    const {
      addressesAndTokens
    } = params;

    // if no addresses, return early
    if (!addressesAndTokens.addresses.length || !addressesAndTokens.tokenIds.length) return of({
      balances: [],
      status: "live",
      failedBalanceIds: []
    });
    const addressesByTokenId = fromPairs(addressesAndTokens.tokenIds.map(tokenId => [tokenId, addressesAndTokens.addresses]));
    return balancesProvider.getBalances$(addressesByTokenId);
  });
};

const blobStore$1 = getBlobStore("bittensor-validators");
const MAX_PAGE_SIZE = 100;
const REFRESH_INTERVAL$1 = 600_000; // 10 mins

let lastUpdatedAt = 0;
const fetchBittensorValidatorsPage = async (page = 1, signal) => {
  const res = await fetch(`${TAOSTATS_BASE_PATH}/api/dtao/validator/latest/v1?page=${page}&limit=${MAX_PAGE_SIZE}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    signal
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
};
const fetchAllBittensorValidators = async signal => {
  const allValidators = [];
  let nextPage = 1;
  while (nextPage !== null) {
    const pageData = await fetchBittensorValidatorsPage(nextPage, signal);
    allValidators.push(...pageData.data);
    nextPage = pageData.pagination.next_page;
  }
  return allValidators;
};
const bittensorValidators$ = new Observable(subscriber => {
  const controller = new AbortController();
  subscriber.add(() => controller.abort());
  let timeout = null;
  subscriber.add(() => timeout && clearTimeout(timeout));
  let data = [];
  const refresh = async () => {
    try {
      const delay = Math.max(0, lastUpdatedAt + REFRESH_INTERVAL$1 - Date.now());
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      if (controller.signal.aborted) return;
      log.debug("Refreshing bittensor validators");
      subscriber.next({
        status: "loading",
        data
      });
      data = await fetchAllBittensorValidators(controller.signal);
      lastUpdatedAt = Date.now();
      subscriber.next({
        status: "success",
        data
      });
      blobStore$1.set(data);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      log.error("Failed to fetch bittensor validators", error);
      if (!subscriber.closed) subscriber.error(error);
    } finally {
      if (!controller.signal.aborted) timeout = setTimeout(refresh, REFRESH_INTERVAL$1);
    }
  };

  // init loop: fetch from github every 10 mins
  refresh();

  // init from storage
  blobStore$1.get().then(blob => {
    subscriber.next({
      status: "success",
      data: blob || []
    });
  });
}).pipe(startWith({
  status: "loading",
  data: []
}), shareReplay({
  bufferSize: 1,
  refCount: true
}), keepAlive(2_000) // prevents rapid re-fetching on unsubscriptions
);

class BittensorHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(bittensor.validators.subscribe)":
        return genericSubscription(id, port, bittensorValidators$);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class ChaindataHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(chaindata.networks.subscribe)":
        {
          return genericSubscription(id, port, chaindataProvider.getNetworks$());
        }
      case "pri(chaindata.tokens.subscribe)":
        {
          return genericSubscription(id, port, chaindataProvider.tokens$);
        }
      case "pri(chaindata.networks.upsert)":
        {
          const {
            platform,
            network,
            nativeToken
          } = request;

          // better safe than sorry
          if (!isNativeToken(nativeToken, platform)) throw new Error("Provided native token is not a valid native token for the platform");
          if (!isNetworkOfPlatform(network, platform)) throw new Error("Provided network is not a valid network for the platform");
          if (network.nativeTokenId !== nativeToken.id) throw new Error("Network native token ID does not match the provided native token ID");
          await customChaindataStore.upsert([network], [nativeToken]);
          await clearRpcProviderCache(network.id);
          return true;
        }
      case "pri(chaindata.networks.remove)":
        {
          const {
            id
          } = request;
          await customChaindataStore.removeNetwork(id);
          await clearRpcProviderCache(id);
          return true;
        }
      case "pri(chaindata.tokens.upsert)":
        {
          const token = request;
          try {
            await customChaindataStore.upsertToken(token);
          } catch (err) {
            throw new Error(`Failed to upsert token: ${err}`);
          }
          return true;
        }
      case "pri(chaindata.tokens.remove)":
        {
          const {
            id
          } = request;
          await customChaindataStore.removeToken(id);
          return true;
        }
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
const clearRpcProviderCache = async networkId => {
  chainConnectorEvm.clearRpcProvidersCache(networkId);
  await chainConnector.reset(networkId);
};

// chain genesisHash => is updating metadata

class MetadataUpdatesStore {
  metadataUpdates = new BehaviorSubject({});
  get(genesisHash) {
    return this.metadataUpdates.value[genesisHash];
  }
  set(genesisHash, updating) {
    this.metadataUpdates.next({
      ...this.metadataUpdates.value,
      [genesisHash]: updating
    });
  }
  subscribe(id, port, genesisHash) {
    const cb = createSubscription(id, port);
    let value = undefined;
    const subscription = this.metadataUpdates.subscribe(metadataUpdates => {
      const isUpdating = metadataUpdates[genesisHash];
      if (isUpdating !== value) {
        value = isUpdating;
        cb({
          isUpdating
        });
      }
    });
    port.onDisconnect.addListener(() => {
      unsubscribe(id);
      subscription?.unsubscribe();
    });
  }
}
const metadataUpdatesStore = new MetadataUpdatesStore();

// properly typed on the few fields that matter to us

const getRuntimeVersion = chainId => {
  return withRetry(() => chainConnector.send(chainId, "state_getRuntimeVersion", [], true));
};

const CACHE_RESULTS = new Map();
const CACHE_PROMISES = new Map();
const getResultCacheKey = (genesisHash, specVersion) => !specVersion || !genesisHash ? null : `${genesisHash}-${specVersion}`;
const getPromiseCacheKey = (chainIdOrHash, specVersion) => [chainIdOrHash, specVersion ?? ""].join("-");

/**
 *
 * @param chainIdOrHash chainId or genesisHash
 * @param specVersion
 * @returns
 */
const getMetadataDef = async (chainIdOrHash, specVersion) => {
  const cacheKey = getPromiseCacheKey(chainIdOrHash, specVersion);

  // prevent concurrent calls that would fetch the same data
  if (!CACHE_PROMISES.has(cacheKey)) CACHE_PROMISES.set(cacheKey, getMetadataDefInner(chainIdOrHash, specVersion).finally(() => {
    CACHE_PROMISES.delete(cacheKey);
  }));
  return CACHE_PROMISES.get(cacheKey);
};
const getMetadataDefInner = async (chainIdOrHash, specVersion) => {
  const [chain, genesisHash] = await getChainAndGenesisHashFromIdOrHash(chainIdOrHash);
  const cacheKey = getResultCacheKey(genesisHash, specVersion);
  if (cacheKey && CACHE_RESULTS.has(cacheKey)) return CACHE_RESULTS.get(cacheKey);
  try {
    // eslint-disable-next-line no-var
    var storeMetadata = await db.metadata.get(genesisHash);

    // having a metadataRpc on expected specVersion is ideal scenario, don't go further
    if (storeMetadata?.metadataRpc && specVersion === storeMetadata.specVersion) if (
    // TODO remove this check once PAPI handles metadata hash for v16
    getMetadataVersion(decodeMetadataRpc(storeMetadata.metadataRpc)) <= MAX_SUPPORTED_METADATA_VERSION) return storeMetadata;
  } catch (cause) {
    const message = `Failed to load chain metadata from the db for chain ${genesisHash}`;
    const error = new Error(message, {
      cause
    });
    log.error(error);
    throw error;
  }

  // TODO remove this block once PAPI handles metadata hash for v16
  if (storeMetadata?.metadataRpc && getMetadataVersion(decodeMetadataRpc(storeMetadata.metadataRpc)) > MAX_SUPPORTED_METADATA_VERSION) storeMetadata = undefined;
  if (!chain) {
    log.warn(`Metadata for unknown chain isn't up to date`, storeMetadata?.chain ?? genesisHash);
    return storeMetadata;
  }
  try {
    const {
      specVersion: runtimeSpecVersion
    } = await getRuntimeVersion(chain.id);
    assert(!specVersion || specVersion === runtimeSpecVersion, "specVersion mismatch");

    // if specVersion wasn't specified, but store version is up to date, look no further
    if (storeMetadata?.metadataRpc && runtimeSpecVersion === storeMetadata.specVersion) return storeMetadata;

    // check cache using runtimeSpecVersion
    const cacheKey = getResultCacheKey(genesisHash, runtimeSpecVersion);
    if (CACHE_RESULTS.has(cacheKey)) return CACHE_RESULTS.get(cacheKey);

    // mark as updating in database (can be picked up by frontend via subscription)
    metadataUpdatesStore.set(genesisHash, true);

    // developer helpers to test all states, uncomment as needed
    // if (DEBUG) await sleep(5_000)
    // if (DEBUG) throw new Error("Failed to update metadata (debugging)")

    // fetch the metadataDef from the chain
    const newData = await withRetry(() => fetchMetadataDefFromChain(chain, genesisHash, runtimeSpecVersion));
    if (!newData) return; // unable to get data from rpc, return nothing

    // save in cache
    CACHE_RESULTS.set(cacheKey, newData);
    metadataUpdatesStore.set(genesisHash, false);

    // if requested version is outdated, cache it and return it without updating store
    if (storeMetadata && runtimeSpecVersion < storeMetadata.specVersion) return newData;

    // persist in store
    await db.metadata.put(newData);
    return newData;
  } catch (cause) {
    if (cause.message !== "RPC connect timeout reached") {
      const error = new Error("Failed to update metadata", {
        cause
      });
      log.error(error);
      sentry.captureException(error, {
        extra: {
          genesisHash,
          chainId: chain?.id ?? "UNKNOWN"
        }
      });
    }
    metadataUpdatesStore.set(genesisHash, false);
  }
  return storeMetadata;
};
const getChainAndGenesisHashFromIdOrHash = async chainIdOrGenesisHash => {
  const chainId = !isHex(chainIdOrGenesisHash) ? chainIdOrGenesisHash : null;
  const hash = isHex(chainIdOrGenesisHash) ? chainIdOrGenesisHash : null;
  const chain = chainId ? await chaindataProvider.getNetworkById(chainId, "polkadot") : hash ? await chaindataProvider.getNetworkByGenesisHash(hash) : null;
  const genesisHash = hash ?? chain?.genesisHash;
  // throw if neither a known chainId or genesisHash
  assert(genesisHash, `Unknown chain: ${chainIdOrGenesisHash}`);
  return [chain, genesisHash];
};
const fetchMetadataDefFromChain = async (chain, genesisHash, runtimeSpecVersion, /** defaults to `getLatestMetadataRpc`, but can be overridden */
fetchMethod = getLatestMetadataRpc) => {
  const [metadataRpc, chainProperties] = await Promise.all([fetchMethod(chain.id), chainConnector.send(chain.id, "system_properties", [], true)]).catch(rpcError => {
    // not a useful error, do not log to sentry
    if (rpcError.message === "RPC connect timeout reached") {
      log.error(rpcError);
      metadataUpdatesStore.set(genesisHash, false);
      return [undefined, undefined];
    }
    // otherwise allow wrapping try/catch to handle
    throw rpcError;
  });

  // unable to get data from rpc, return nothing
  if (!metadataRpc || !chainProperties) return;
  const {
    spec_version
  } = getConstantValueFromMetadata(metadataRpc, "System", "Version");
  if (runtimeSpecVersion !== undefined && spec_version !== runtimeSpecVersion) throw new Error(`specVersion mismatch: expected ${runtimeSpecVersion}, metadata got ${spec_version}`);
  return {
    genesisHash,
    chain: chain.name,
    specVersion: spec_version,
    ss58Format: chainProperties.ss58Format,
    tokenSymbol: Array.isArray(chainProperties.tokenSymbol) ? chainProperties.tokenSymbol[0] : chainProperties.tokenSymbol,
    tokenDecimals: Array.isArray(chainProperties.tokenDecimals) ? chainProperties.tokenDecimals[0] : chainProperties.tokenDecimals,
    metaCalls: undefined,
    // won't be used anymore, yeet
    metadataRpc: encodeMetadataRpc(metadataRpc)
  };
};

// useful for developer when testing updates
if (DEBUG) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostObj = globalThis;
  hostObj.clearMetadata = async () => {
    await db.metadata.clear();
    CACHE_RESULTS.clear();
  };
  hostObj.makeOldMetadata = async () => {
    const allMetadata = await db.metadata.toArray();
    await db.metadata.bulkPut(allMetadata.map(m => ({
      ...m,
      specVersion: 1
    })));
    CACHE_RESULTS.clear();
  };
}
const getLatestMetadataRpc = chainId => fetchBestMetadata((method, params, isCacheable) => chainConnector.send(chainId, method, params, isCacheable, {
  expectErrors: true
}));
const getLegacyMetadataRpc = chainId => chainConnector.send(chainId, "state_getMetadata", [], true);

const $networkSpecs = Struct({
  base58prefix: u16,
  color: str,
  decimals: u8,
  encryption: u8,
  // Ed25519=0, Sr25519=1, Ecdsa=2, ethereum=3
  genesis_hash: Bytes(32),
  logo: str,
  name: str,
  path_id: str,
  secondary_color: str,
  title: str,
  unit: str
});
const $addNetworkSpecsPayload = Struct({
  specs: Bytes(undefined)
});
const $updateNetworkMetadataPayload = Struct({
  meta: Bytes(undefined),
  genesis_hash: Bytes(32)
});

const getEncryptionForChain = chain => {
  // Ed25519=0, Sr25519=1, Ecdsa=2, ethereum=3
  switch (chain.account) {
    case "secp256k1":
      return 3;
    default:
      return 1;
  }
};
const getVerifierMnemonic = async () => {
  const pw = await passwordStore.getPassword();
  assert(pw, "Unauthorised");
  const mnemonicId = await appStore.get("vaultVerifierCertificateMnemonicId");
  assert(mnemonicId !== undefined, "Verifier mnemonic not found");
  assert(mnemonicId !== null, "Talisman configured to not use verifier mnemonic");
  return keyringStore.getMnemonicText(mnemonicId, pw);
};
const signWithVerifierCertMnemonic = async unsigned => {
  try {
    const mnemonic = await getVerifierMnemonic();
    const keyring = new Keyring$2();
    const signingPair = keyring.createFromUri(mnemonic, {}, "sr25519");

    // For network specs, sign the specs (not the entire payload)
    const {
      type,
      publicKey
    } = signingPair;
    return {
      type,
      publicKey,
      signature: signingPair.sign(unsigned)
    };
  } catch (error) {
    throw new Error("Failed to sign : " + error.message);
  }
};

/**
 * Useful resources :
 * https://paritytech.github.io/parity-signer/rustdocs/generate_message/index.html
 * https://github.com/varovainen/parity-signer/blob/2022-05-25-uos/docs/src/development/UOS.md
 */

const generateQrAddNetworkSpecs = async genesisHash => {
  const chain = await chaindataProvider.getNetworkByGenesisHash(genesisHash);
  assert(chain, "Chain not found");
  const systemProperties = await chainConnector.send(chain.id, "system_properties", []);
  const decimals = Array.isArray(systemProperties?.tokenDecimals) ? systemProperties?.tokenDecimals[0] : systemProperties?.tokenDecimals;
  const unit = Array.isArray(systemProperties?.tokenSymbol) ? systemProperties?.tokenSymbol[0] : systemProperties?.tokenSymbol;
  const specs = $networkSpecs.enc({
    base58prefix: chain.prefix ?? 42,
    decimals,
    encryption: getEncryptionForChain(chain),
    genesis_hash: hexToU8a(genesisHash),
    name: chain.specName ?? chain.name ?? chain.id,
    unit,
    title: chain.name ?? chain.id,
    path_id: `//${(chain.name ?? chain.id)?.toLowerCase()}`,
    // TODO logo should match one of the resources defined in https://github.com/paritytech/parity-signer/tree/master/ios/PolkadotVault/Resources/ChainIcons.xcassets
    // We may need an additional property in chaindata to control this
    logo: chain.specName ?? "logo",
    color: chain.themeColor ?? "#000000",
    secondary_color: "#000000"
  });
  const payload = u8aToU8a($addNetworkSpecsPayload.enc({
    specs
  }));
  try {
    // eslint-disable-next-line no-var
    var {
      publicKey,
      signature
    } = await signWithVerifierCertMnemonic(specs);
  } catch (e) {
    log.error("Failed to sign network specs", e);
    throw new Error("Failed to sign network specs");
  }
  return u8aToU8a(u8aConcat(new Uint8Array([0x53]),
  // 53 = update
  // our root account signs using sr25519
  new Uint8Array([0x01]),
  // 0x00 Ed25519, 0x01 Sr25519, 0x02 Ecdsa, 0xff unsigned
  new Uint8Array([0xc1]),
  // c1 = add_specs
  publicKey, payload, signature));
};

/**
 * Network Metadata
 */

const generateQrUpdateNetworkMetadata = async (chainIdOrHash, specVersion) => {
  const [chain, genesisHash] = await getChainAndGenesisHashFromIdOrHash(chainIdOrHash);
  if (!chain) return;
  const {
    specVersion: runtimeSpecVersion
  } = await getRuntimeVersion(chain.id);
  assert(!specVersion || specVersion === runtimeSpecVersion, "specVersion mismatch");
  const metadataDef = await fetchMetadataDefFromChain(chain, genesisHash, runtimeSpecVersion, getLegacyMetadataRpc);
  assert(metadataDef, "Failed to fetch metadata");
  const metadataRpc = getMetadataRpcFromDef(metadataDef);
  assert(metadataRpc, "Failed to fetch metadata");
  const payload = $updateNetworkMetadataPayload.enc({
    meta: hexToU8a(metadataRpc),
    genesis_hash: hexToU8a(genesisHash)
  });
  try {
    // eslint-disable-next-line no-var
    var {
      publicKey,
      signature
    } = await signWithVerifierCertMnemonic(payload);
  } catch (e) {
    log.error("Failed to sign network metadata", e);
    throw new Error("Failed to sign network metadata");
  }
  return u8aToU8a(u8aConcat(new Uint8Array([0x53]),
  // 0x53 = update
  // our root account signs using sr25519
  new Uint8Array([0x01]),
  // 0x00 Ed25519, 0x01 Sr25519, 0x02 Ecdsa, 0xff unsigned
  new Uint8Array([0x80]),
  // 0x80 = load_metadata
  publicKey, payload, signature));
};

class ChainsHandler extends ExtensionHandler {
  async validateVaultVerifierCertificateMnemonic() {
    const vaultMnemoicId = await this.stores.app.get("vaultVerifierCertificateMnemonicId");
    assert(vaultMnemoicId, "No Polkadot Vault Verifier Certificate Mnemonic set");
    const vaultCipher = await keyringStore.getMnemonic(vaultMnemoicId);
    assert(vaultCipher, "No Polkadot Vault Verifier Certificate Mnemonic found");
    return true;
  }
  async handle(id, type, request) {
    switch (type) {
      case "pri(chains.generateQr.addNetworkSpecs)":
        {
          await this.validateVaultVerifierCertificateMnemonic();
          const {
            genesisHash
          } = request;
          const data = await generateQrAddNetworkSpecs(genesisHash);
          // serialize as hex for transfer
          return u8aToHex(data);
        }
      case "pri(chains.generateQr.updateNetworkMetadata)":
        {
          await this.validateVaultVerifierCertificateMnemonic();
          const {
            genesisHash,
            specVersion
          } = request;
          const data = await generateQrUpdateNetworkMetadata(genesisHash, specVersion);
          // serialize as hex for transfer
          return u8aToHex(data);
        }
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

const blobStore = getBlobStore("defi-positions");
const DEFAULT_DATA = [];
const subjectDefiPositionsStore$ = new ReplaySubject(1);
walletReady.then(async () => {
  try {
    const data = await blobStore.get();
    subjectDefiPositionsStore$.next(data ? data.positions : DEFAULT_DATA);
  } catch (error) {
    log.error("Error fetching defi positions:", error);
    subjectDefiPositionsStore$.next(DEFAULT_DATA);
  }
});

// persist to db when store is updated
subjectDefiPositionsStore$.pipe(skip(1), debounceTime(2_000), distinctUntilChanged(isEqual)).subscribe(positions => {
  blobStore.set({
    positions
  });
});
const getPositionId = position => `${position.networkId}-${position.address}-${position.defiId}`;
const defiPositionsStore$ = subjectDefiPositionsStore$.asObservable();
const updateDefiPositionsStore = positions => {
  subjectDefiPositionsStore$.next(
  // consistent ordering ensures we can compare changes easily
  positions.concat().sort((a, b) => getPositionId(a).localeCompare(getPositionId(b))));
};

const REFRESH_INTERVAL = 20_000; // refresh every 20 seconds, though data is cached on api side

const defiPositions$ = walletReady$.pipe(switchMap(() => accountAddresses$), switchMap(addresses => {
  return defiPositionsStore$.pipe(take(1),
  // we only want an initial value, changes to the store should not re-emit
  switchMap(storage => getDefiPositions$(addresses, storage)));
}), tap({
  subscribe: () => log.debug("[DeFi] starting main subscription"),
  unsubscribe: () => log.debug("[DeFi] stopping main subscription"),
  next: loadable => {
    log.debug("[DeFi] subscription emit", loadable);
    if (loadable.status === "success") updateDefiPositionsStore(loadable.data);
  }
}), shareReplay({
  refCount: true,
  bufferSize: 1
}), keepAlive(3000));
const accountAddresses$ = keyringStore.accounts$.pipe(map(accounts => accounts.filter(isAccountNotContact).map(account => account.address)));
const filterDefiPositions = (addresses, positions) => {
  // keep only positions that match any of the provided addresses
  return positions.filter(position => addresses.some(addr => isAddressEqual(addr, position.address)));
};
const fetchDefiPositions = async addresses => {
  const url = urlJoin(ASSET_DISCOVERY_API_URL, "defi");
  log.debug("[DeFi] Fetching defi positions for addresses", {
    addresses,
    url
  });
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      addresses
    })
  });
  if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
  return await response.json();
};
const getDefiPositions$ = (addresses, storage) => getSharedObservable("defi-positions", {
  addresses,
  REFRESH_INTERVAL
}, () => getLoadable$(() => fetchDefiPositions(addresses), {
  refreshInterval: REFRESH_INTERVAL
})).pipe(map(loadable => ({
  ...loadable,
  // fallback to storage
  data: loadable.data ?? filterDefiPositions(addresses, storage)
})), distinctUntilChanged(isEqual));

class DefiHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(defi.positions.subscribe)":
        return genericSubscription(id, port, defiPositions$);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

// Code in this file is heavily derived from the approach outlined in this PR:
// https://github.com/polkadot-js/common/pull/1331

const encryptionKeySize = 32;
const macKeySize = 32;
const derivationKeyRounds = 2048;
const keyDerivationSaltSize = 32;
const nonceSize = 24;

/**
 * @name sr25519Encrypt
 * @description Returns encrypted message of `message`, using the supplied pair
 */
function sr25519Encrypt(message, receiverPublicKey, senderKeyPair) {
  const messageKeyPair = senderKeyPair || generateEphemeralKeypair();
  const {
    encryptionKey,
    keyDerivationSalt,
    macKey
  } = generateEncryptionKey(messageKeyPair, receiverPublicKey);
  const {
    encrypted,
    nonce
  } = naclEncrypt(u8aToU8a(message), encryptionKey, randomAsU8a(nonceSize));
  const macValue = macData(nonce, encrypted, messageKeyPair.publicKey, macKey);
  return u8aConcat(nonce, keyDerivationSalt, messageKeyPair.publicKey, macValue, encrypted);
}
function generateEphemeralKeypair() {
  return sr25519PairFromSeed(mnemonicToMiniSecret(mnemonicGenerate()));
}
function generateEncryptionKey(senderKeyPair, receiverPublicKey) {
  const {
    encryptionKey,
    keyDerivationSalt,
    macKey
  } = buildSR25519EncryptionKey(receiverPublicKey, senderKeyPair.secretKey, senderKeyPair.publicKey);
  return {
    encryptionKey,
    keyDerivationSalt,
    macKey
  };
}
function buildSR25519EncryptionKey(publicKey, secretKey, encryptedMessagePairPublicKey, salt = randomAsU8a(keyDerivationSaltSize)) {
  const agreementKey = sr25519Agreement(secretKey, publicKey);
  const masterSecret = u8aConcat(encryptedMessagePairPublicKey, agreementKey);
  return deriveKey(masterSecret, salt);
}
function deriveKey(masterSecret, salt) {
  const {
    password
  } = pbkdf2Encode(masterSecret, salt, derivationKeyRounds);
  assert(password.byteLength >= macKeySize + encryptionKeySize, "Wrong derived key length");
  return {
    encryptionKey: password.slice(macKeySize, macKeySize + encryptionKeySize),
    keyDerivationSalt: salt,
    macKey: password.slice(0, macKeySize)
  };
}
function macData(nonce, encryptedMessage, encryptedMessagePairPublicKey, macKey) {
  return hmacSha256AsU8a(macKey, u8aConcat(nonce, encryptedMessagePairPublicKey, encryptedMessage));
}

// Code in this file is heavily derived from the approach outlined in this PR:
// https://github.com/polkadot-js/common/pull/1331

const publicKeySize = 32;
const macValueSize = 32;
/**
 * @name sr25519Decrypt
 * @description Returns decrypted message of `encryptedMessage`, using the supplied pair
 */
function sr25519Decrypt(encryptedMessage, {
  secretKey
}) {
  const {
    ephemeralPublicKey,
    keyDerivationSalt,
    macValue,
    nonce,
    sealed
  } = sr25519DecapsulateEncryptedMessage(u8aToU8a(encryptedMessage));
  const {
    encryptionKey,
    macKey
  } = buildSR25519EncryptionKey(ephemeralPublicKey, u8aToU8a(secretKey), ephemeralPublicKey, keyDerivationSalt);
  const decryptedMacValue = macData(nonce, sealed, ephemeralPublicKey, macKey);
  assert(u8aCmp(decryptedMacValue, macValue) === 0, "Mac values don't match");
  return naclDecrypt(sealed, nonce, encryptionKey);
}

/**
 * @name sr25519DecapsulateEncryptedMessage
 * @description Split raw encrypted message
 */
function sr25519DecapsulateEncryptedMessage(encryptedMessage) {
  assert(encryptedMessage.byteLength > nonceSize + keyDerivationSaltSize + publicKeySize + macValueSize, "Wrong encrypted message length");
  return {
    ephemeralPublicKey: encryptedMessage.slice(nonceSize + keyDerivationSaltSize, nonceSize + keyDerivationSaltSize + publicKeySize),
    keyDerivationSalt: encryptedMessage.slice(nonceSize, nonceSize + keyDerivationSaltSize),
    macValue: encryptedMessage.slice(nonceSize + keyDerivationSaltSize + publicKeySize, nonceSize + keyDerivationSaltSize + publicKeySize + macValueSize),
    nonce: encryptedMessage.slice(0, nonceSize),
    sealed: encryptedMessage.slice(nonceSize + keyDerivationSaltSize + publicKeySize + macValueSize)
  };
}

class EncryptHandler extends ExtensionHandler {
  async encryptApprove({
    id
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      request,
      resolve
    } = queued;
    const result = await withSecretKey(queued.account.address, async (secretKey, curve) => {
      const {
        payload
      } = request;
      const kp = {
        publicKey: getPublicKeyFromSecret(secretKey, curve),
        secretKey
      };
      assert(kp.secretKey.length === 64, "Talisman secretKey is incorrect length");

      // get encrypted result as integer array
      const encryptResult = sr25519Encrypt(u8aToU8a(payload.message), u8aToU8a(payload.recipient), kp);
      talismanAnalytics.capture("encrypt message approve");
      resolve({
        id,
        result: u8aToHex(encryptResult)
      });
    });
    if (result.ok) return true;
    log.log(result.val);
    sentry.captureException(result.val);
    throw new Error("Unable to encrypt message.");
  }
  async decryptApprove({
    id
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      request,
      resolve
    } = queued;
    const result = await withSecretKey(queued.account.address, async (secretKey, curve) => {
      const {
        payload
      } = request;
      assert(curve === "sr25519", "Unsupported curve");
      assert(secretKey.length === 64, "Talisman secretKey is incorrect length");

      // get decrypted response as integer array
      const decryptResult = sr25519Decrypt(u8aToU8a(payload.message), {
        secretKey
      });
      talismanAnalytics.capture("decrypt message approve");
      resolve({
        id,
        result: u8aToHex(decryptResult)
      });
    });
    if (result.ok) return true;
    log.log(result.val);
    sentry.captureException(result.val);
    throw new Error("Unable to decrypt message.");
  }
  encryptCancel({
    id
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    talismanAnalytics.capture("encrypt/decrypt message reject");
    queued.reject(new Error("Cancelled"));
    return true;
  }
  async handle(id, type, request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  port) {
    switch (type) {
      case "pri(encrypt.approveEncrypt)":
        return await this.encryptApprove(request);
      case "pri(encrypt.approveDecrypt)":
        return await this.decryptApprove(request);
      case "pri(encrypt.cancel)":
        return this.encryptCancel(request);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

const dicTransactionCount = new Map();
const getKey = (address, evmNetworkId) => `${address}-${evmNetworkId}`.toLowerCase();

/*
  To be called to set a valid nonce for a transaction
*/
const getTransactionCount = async (address, evmNetworkId) => {
  const key = getKey(address, evmNetworkId);
  const provider = await chainConnectorEvm.getPublicClientForEvmNetwork(evmNetworkId);
  if (!provider) throw new Error(`Could not find provider for EVM chain ${evmNetworkId}`);
  const transactionCount = await provider.getTransactionCount({
    address
  });
  if (!dicTransactionCount.has(key)) {
    // initial value
    dicTransactionCount.set(key, transactionCount);
  } else {
    // dictionary may be "late" is same address is used on 2 browsers or computers
    const current = dicTransactionCount.get(key);
    if (transactionCount > current) dicTransactionCount.set(key, transactionCount);
  }
  return dicTransactionCount.get(key);
};

/*
  To be called each time a transaction is submitted to blockchain
*/
const incrementTransactionCount = (address, evmNetworkId) => {
  const key = getKey(address, evmNetworkId);
  const count = dicTransactionCount.get(key);
  if (count === undefined) throw new Error(`Missing transaction count for ${address} on network ${evmNetworkId}`);
  dicTransactionCount.set(key, count + 1);
};
const resetTransactionCount = (address, evmNetworkId) => {
  const key = getKey(address, evmNetworkId);
  dicTransactionCount.delete(key);
};

const watchEthereumTransaction = async (evmNetworkId, hash, unsigned, options = {}) => {
  try {
    const {
      siteUrl,
      notifications,
      txInfo
    } = options;
    const withNotifications = !!(notifications && (await settingsStore.get("allowNotifications")));
    const ethereumNetwork = await chaindataProvider.getNetworkById(evmNetworkId, "ethereum");
    if (!ethereumNetwork) throw new Error(`Could not find ethereum network ${evmNetworkId}`);
    const client = await chainConnectorEvm.getPublicClientForEvmNetwork(evmNetworkId);
    if (!client) throw new Error(`No client for network ${evmNetworkId} (${ethereumNetwork.name})`);
    const networkName = ethereumNetwork.name ?? "unknown network";
    const blockExplorerUrls = getBlockExplorerUrls(ethereumNetwork, {
      type: "transaction",
      id: hash
    });
    const txUrl = blockExplorerUrls[0] ?? chrome.runtime.getURL("dashboard.html#/tx-history");

    // PENDING
    if (withNotifications) await createNotification("submitted", networkName, txUrl);
    try {
      await addEvmTransaction(evmNetworkId, hash, unsigned, {
        siteUrl,
        txInfo
      });

      // Observed on polygon network (tried multiple rpcs) that waitForTransactionReceipt throws TransactionNotFoundError & BlockNotFoundError randomly
      // so we retry as long as we don't get a receipt, with a timeout on our side
      const getTransactionReceipt = async hash => {
        try {
          return await client.waitForTransactionReceipt({
            hash,
            confirmations: 0
          });
        } catch (err) {
          await sleep(4000);
          return getTransactionReceipt(hash);
        }
      };
      const receipt = await Promise.race([getTransactionReceipt(hash), throwAfter(5 * 60_000, "Transaction not found")]);
      assert(receipt, "Transaction not found");
      // check hash which may be incorrect for cancelled tx, in which case receipt includes the replacement tx hash
      if (receipt.transactionHash === hash) {
        // to test failing transactions, swap on busy AMM pools with a 0.05% slippage limit
        updateTransactionStatus(hash, receipt.status === "success" ? "success" : "error", receipt.blockNumber);
      }
      if (withNotifications) await createNotification(receipt.status === "success" ? "success" : "error", networkName, txUrl);

      // wait 2 confirmations before marking as confirmed
      if (receipt.status === "success") {
        const receipt = await client.waitForTransactionReceipt({
          hash,
          confirmations: 2
        });
        if (receipt.status === "success") updateTransactionStatus(hash, receipt.status === "success" ? "success" : "error", receipt.blockNumber, true);

        // if tx orignates from a dapp, in case it's a swap for a new token, launch an asset discovery scan
        if (!!siteUrl && !!unsigned.from) assetDiscoveryScanner.startScan({
          networkIds: [evmNetworkId],
          addresses: [unsigned.from],
          withApi: false
        });
      }
    } catch (err) {
      const isNotFound = err instanceof Error && (err.message === "Transaction not found" || err.name === "WaitForTransactionReceiptTimeoutError");

      // if not found, mark tx as unknown so user can still cancel/speed-up if necessary
      updateTransactionStatus(hash, isNotFound ? "unknown" : "error");

      // observed on polygon, some submitted transactions are not found, in which case we must reset the nonce counter to avoid being stuck
      if (unsigned.from) resetTransactionCount(unsigned.from, evmNetworkId);
      if (withNotifications) await createNotification(isNotFound ? "not_found" : "error", networkName, txUrl, err);
      // eslint-disable-next-line no-console
      else console.error("Failed to watch transaction", {
        err
      });
    }
  } catch (err) {
    sentry.captureException(err, {
      tags: {
        ethChainId: evmNetworkId
      }
    });
  }
};

const TX_WATCH_TIMEOUT = 90_000; // 90 seconds in milliseconds

const getStorageKeyHash = (...names) => {
  return `0x${names.map(name => xxhashAsHex(name, 128).slice(2)).join("")}`;
};
const getExtrinsincResult = async (registry, blockHash, chainId, extrinsicHash) => {
  try {
    const blockData = await chainConnector.send(chainId, "chain_getBlock", [blockHash]);
    const block = registry.createType("SignedBlock", blockData);
    const eventsStorageKey = getStorageKeyHash("System", "Events");
    const response = await chainConnector.send(chainId, "state_queryStorageAt", [[eventsStorageKey], blockHash]);
    const eventsFrame = response[0]?.changes[0][1] || [];
    const events = (() => {
      try {
        return registry.createType("Vec<FrameSystemEventRecord>", eventsFrame);
      } catch (error) {
        log.warn("Failed to decode events as `FrameSystemEventRecord`, trying again as just `EventRecord` for old (pre metadata v14) chains");
        return registry.createType("Vec<EventRecord>", eventsFrame);
      }
    })();
    for (const [txIndex, x] of block.block.extrinsics.entries()) {
      if (x.hash.eq(extrinsicHash)) {
        const relevantEvent = events.find(({
          phase,
          event
        }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(txIndex) && ["ExtrinsicSuccess", "ExtrinsicFailed"].includes(event.method));
        if (relevantEvent) if (relevantEvent?.event.method === "ExtrinsicSuccess") {
          // we don't need associated data (whether if a fee has been paid or not, and extrinsic weight)
          // const info = relevantEvent?.event.data[0] as DispatchInfo
          return Ok({
            result: "success",
            blockNumber: block.block.header.number.toNumber(),
            extIndex: txIndex
          });
        } else if (relevantEvent?.event.method === "ExtrinsicFailed") {
          // from our tests this DispatchError object doesn't provide any relevant information for a user
          // const error = relevantEvent?.event.data[0] as DispatchError
          // const info = relevantEvent?.event.data[1] as DispatchInfo
          return Ok({
            result: "error",
            blockNumber: block.block.header.number.toNumber(),
            extIndex: txIndex
          });
        }
      }
    }
  } catch (error) {
    // errors commonly arise here due to misconfigured metadata
    // this is difficult to debug and may not be solvable at our end, so we are no longer logging them to Sentry
    // eg https://sentry.io/share/issue/6762fac9d55e4df9be29a25f108f075e/
    log.error(error);
  }
  return Err("Unable to get result");
};
const watchExtrinsicStatus = async (chainId, registry, extrinsicHash, cb) => {
  let foundInBlockHash;
  let timeout = null;

  // keep track of subscriptions state because it raises errors when calling unsubscribe multiple times
  const subscriptions = {
    finalizedHeads: true,
    allHeads: true
  };
  const unsubscribe = async (key, unsubscribeHandler) => {
    if (!subscriptions[key]) return;
    subscriptions[key] = false;
    unsubscribeHandler();
  };

  // watch for finalized blocks, this is the source of truth for successfull transactions
  const unsubscribeFinalizedHeads = await chainConnector.subscribe(chainId, "chain_subscribeFinalizedHeads", "chain_finalizedHead", [], async (error, data) => {
    if (error) {
      const err = new Error("Failed to watch extrinsic status (chain_subscribeFinalizedHeads)", {
        cause: error
      });
      log.error(err);
      sentry.captureException(err, {
        extra: {
          chainId
        }
      });
      return;
    }
    try {
      const {
        hash: blockHash
      } = registry.createType("Header", data);
      const {
        val: extResult,
        err
      } = await getExtrinsincResult(registry, blockHash, chainId, extrinsicHash);
      if (err) return; // err is true if extrinsic is not found in this block

      const {
        result,
        blockNumber,
        extIndex
      } = extResult;
      cb(result, blockNumber, extIndex, true);
      await unsubscribe("finalizedHeads", () => unsubscribeFinalizedHeads("chain_subscribeFinalizedHeads"));
      if (timeout !== null) clearTimeout(timeout);
    } catch (error) {
      sentry.captureException(error, {
        extra: {
          chainId
        }
      });
    }
  });

  // watch for new blocks, a successfull extrinsic here only means it's included in a block
  // => need to wait for block to be finalized before considering it a success
  const unsubscribeAllHeads = await chainConnector.subscribe(chainId, "chain_subscribeAllHeads", "chain_allHead", [], async (error, data) => {
    if (error) {
      const err = new Error("Failed to watch extrinsic status (chain_subscribeAllHeads)", {
        cause: error
      });
      log.error(err);
      sentry.captureException(err, {
        extra: {
          chainId
        }
      });
      return;
    }
    try {
      const {
        hash: blockHash
      } = registry.createType("Header", data);
      const {
        val: extResult,
        err
      } = await getExtrinsincResult(registry, blockHash, chainId, extrinsicHash);
      if (err) return; // err is true if extrinsic is not found in this block

      const {
        result,
        blockNumber,
        extIndex
      } = extResult;
      if (result === "success") foundInBlockHash = blockHash;
      cb(result, blockNumber, extIndex, false);
      await unsubscribe("allHeads", () => unsubscribeAllHeads("chain_subscribeAllHeads"));

      // if error, no need to wait for a confirmation
      if (result === "error") {
        await unsubscribe("finalizedHeads", () => unsubscribeFinalizedHeads("chain_subscribeFinalizedHeads"));
        if (timeout !== null) clearTimeout(timeout);
      }
    } catch (error) {
      sentry.captureException(error, {
        extra: {
          chainId
        }
      });
    }
  });

  // the transaction may never be submitted by the dapp, so we stop watching after {TX_WATCH_TIMEOUT}
  timeout = setTimeout(async () => {
    await unsubscribe("allHeads", () => unsubscribeAllHeads("chain_subscribeAllHeads"));
    if (subscriptions.finalizedHeads) {
      await unsubscribe("finalizedHeads", () => unsubscribeFinalizedHeads("chain_subscribeFinalizedHeads"));
      // sometimes the finalized is not received, better check explicitely here
      if (foundInBlockHash) {
        const {
          val: extResult,
          err
        } = await getExtrinsincResult(registry, foundInBlockHash, chainId, extrinsicHash);
        if (!err) {
          const {
            result,
            blockNumber,
            extIndex
          } = extResult;
          cb(result, blockNumber, extIndex, true);
        }
      }
    }

    //if still pending after subscription timeout, mark as unknown
    const status = await getTransactionStatus(extrinsicHash);
    if (status === "pending") await updateTransactionStatus(extrinsicHash, "unknown");
  }, TX_WATCH_TIMEOUT);
};
const watchSubstrateTransaction = async (chain, registry, payload, signature, options = {}) => {
  const {
    siteUrl,
    notifications,
    txInfo
  } = options;
  const withNotifications = !!(notifications && (await settingsStore.get("allowNotifications")));
  assert(chain.genesisHash === payload.genesisHash, "Genesis hash mismatch");
  try {
    const hash = getExtrinsicHash(registry, payload, signature);
    await addSubstrateTransaction(chain.id, hash, payload, {
      siteUrl,
      txInfo
    });
    await watchExtrinsicStatus(chain.id, registry, hash, async (result, blockNumber, extIndex, finalized) => {
      const type = result === "included" ? "submitted" : result;
      const blockExplorerUrls = getBlockExplorerUrls(chain, {
        type: "transaction",
        id: hash
      });
      const txUrl = blockExplorerUrls[0] ?? chrome.runtime.getURL("dashboard.html#/tx-history");
      if (withNotifications) createNotification(type, chain.name ?? "chain", txUrl);
      if (result !== "included") await updateTransactionStatus(hash, result, blockNumber, finalized);
    });
    return hash;
  } catch (cause) {
    const error = new Error("Failed to watch extrinsic", {
      cause
    });
    console.warn(error); // eslint-disable-line no-console
    sentry.captureException(error, {
      extra: {
        chainId: chain.id,
        chainName: chain.name
      }
    });
    return;
  }
};

// 4001	User Rejected Request	The user rejected the request.
// 4100	Unauthorized	        The requested method and/or account has not been authorized by the user.
// 4200	Unsupported Method	    The Provider does not support the requested method.
// 4900	Disconnected	        The Provider is disconnected from all chains.
// 4901	Chain Disconnected	    The Provider is not connected to the requested chain.
//
// 4900 is intended to indicate that the Provider is disconnected from all chains, while 4901 is intended to indicate that the Provider is disconnected from a specific chain only.
// In other words, 4901 implies that the Provider is connected to other chains, just not the requested one.

// https://eips.ethereum.org/EIPS/eip-1193#provider-errors
const ETH_ERROR_EIP1993_USER_REJECTED = 4001;
const ETH_ERROR_EIP1993_UNAUTHORIZED = 4100;
const ETH_ERROR_EIP1993_DISCONNECTED = 4900;
const ETH_ERROR_EIP1993_CHAIN_DISCONNECTED = 4901;
const ETH_ERROR_EIP1474_INVALID_PARAMS = -32602;
const ETH_ERROR_EIP1474_INTERNAL_ERROR = -32603;
const ETH_ERROR_EIP1474_INVALID_INPUT = -32e3;
const ETH_ERROR_EIP1474_RESOURCE_UNAVAILABLE = -32002;
const ETH_ERROR_UNKNOWN_CHAIN_NOT_CONFIGURED = 4902;
class EthProviderRpcError extends Error {
  //hex encoded error or underlying error object

  constructor(message, code, data) {
    super(message);
    this.code = code;
    this.message = message;
    this.data = data;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, EthProviderRpcError.prototype);
  }
}

class EthHandler extends ExtensionHandler {
  signAndSendApproveHardware = async ({
    id,
    unsigned,
    signedPayload
  }) => {
    try {
      const queued = requestStore.getRequest(id);
      assert(queued, "Unable to find request");
      const {
        method,
        resolve,
        ethChainId
      } = queued;
      const client = await chainConnectorEvm.getPublicClientForEvmNetwork(ethChainId);
      assert(client, "Unable to find client for chain " + ethChainId);
      const hash = await client.sendRawTransaction({
        serializedTransaction: signedPayload
      });
      watchEthereumTransaction(ethChainId, hash, unsigned, {
        siteUrl: queued.url,
        notifications: true
      });
      if (unsigned.from) incrementTransactionCount(unsigned.from, ethChainId);
      resolve(hash);
      const {
        val: host,
        ok
      } = getHostName(queued.url);
      talismanAnalytics.captureDelayed("sign transaction approve", {
        method,
        hostName: ok ? host : null,
        dapp: queued.url,
        chain: Number(ethChainId),
        networkType: "ethereum",
        hardwareType: "ledger" // atm ledger is the only type of hardware account that we support for evm
      });
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      DEBUG && console.error("signAndSendApproveHardware", {
        err
      });
      throw new Error(getHumanReadableErrorMessage(err) ?? "Failed to send transaction");
    }
  };
  signAndSendApprove = async ({
    id,
    transaction
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      resolve,
      reject,
      ethChainId,
      account,
      url
    } = queued;
    assert(isEthereumAddress(account.address), "Invalid ethereum address");
    const tx = parseTransactionRequest(transaction);
    if (tx.nonce === undefined) tx.nonce = await getTransactionCount(account.address, ethChainId);
    const result = await withSecretKey(account.address, async secretKey => {
      const client = await chainConnectorEvm.getWalletClientForEvmNetwork(ethChainId);
      assert(client, "Missing client for chain " + ethChainId);
      const privateKey = bytesToHex(secretKey);
      const account = privateKeyToAccount(privateKey);
      return await client.sendTransaction({
        chain: client.chain,
        account,
        ...tx
      });
    });
    if (result.ok) {
      watchEthereumTransaction(ethChainId, result.val, transaction, {
        siteUrl: queued.url,
        notifications: true
      });
      incrementTransactionCount(account.address, ethChainId);
      resolve(result.val);
      const {
        val: host,
        ok
      } = getHostName(url);
      talismanAnalytics.captureDelayed("sign transaction approve", {
        type: "evm sign and send",
        hostName: ok ? host : null,
        dapp: url,
        chain: Number(ethChainId),
        networkType: "ethereum"
      });
      return true;
    } else {
      if (result.val === "Unauthorised") {
        reject(Error(result.val));
      } else {
        throw new Error(getHumanReadableErrorMessage(result.val) ?? "Failed to send transaction");
      }
      return false;
    }
  };
  sendSigned = async ({
    evmNetworkId,
    unsigned,
    signed,
    txInfo
  }) => {
    assert(evmNetworkId, "chainId is not defined");
    const client = await chainConnectorEvm.getWalletClientForEvmNetwork(evmNetworkId);
    assert(client, "Missing client for chain " + evmNetworkId);
    try {
      const hash = await client.sendRawTransaction({
        serializedTransaction: signed
      });
      watchEthereumTransaction(evmNetworkId, hash, unsigned, {
        notifications: true,
        txInfo
      });
      talismanAnalytics.captureDelayed("send transaction", {
        type: "evm send signed",
        chain: Number(evmNetworkId),
        networkType: "ethereum"
      });
      return hash;
    } catch (err) {
      throw new Error(getHumanReadableErrorMessage(err) ?? "Failed to send transaction");
    }
  };
  signAndSend = async ({
    evmNetworkId,
    unsigned,
    txInfo
  }) => {
    assert(evmNetworkId, "chainId is not defined");
    assert(unsigned.from, "from is not defined");
    const result = await withSecretKey(unsigned.from, async secretKey => {
      const client = await chainConnectorEvm.getWalletClientForEvmNetwork(evmNetworkId);
      assert(client, "Missing client for chain " + evmNetworkId);
      const privateKey = bytesToHex(secretKey);
      const account = privateKeyToAccount(privateKey);
      const tx = parseTransactionRequest(unsigned);
      return await client.sendTransaction({
        chain: client.chain,
        account,
        ...tx
      });
    });
    if (result.ok) {
      watchEthereumTransaction(evmNetworkId, result.val, unsigned, {
        notifications: true,
        txInfo
      });
      talismanAnalytics.captureDelayed("send transaction", {
        type: "evm sign and send",
        chain: Number(evmNetworkId),
        networkType: "ethereum"
      });
      return result.val; // hash
    } else {
      if (result.val === "Unauthorised") {
        throw new Error("Unauthorized");
      } else {
        throw new Error(getHumanReadableErrorMessage(result.val) ?? "Failed to send transaction");
      }
    }
  };
  signApproveHardware = ({
    id,
    signedPayload
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      method,
      resolve,
      url
    } = queued;
    resolve(signedPayload);
    const {
      ok,
      val: host
    } = getHostName(url);
    talismanAnalytics.captureDelayed("sign approve", {
      method,
      isHardware: true,
      hostName: ok ? host : null,
      dapp: url,
      chain: Number(queued.ethChainId),
      networkType: "ethereum",
      hardwareType: "ledger"
    });
    return true;
  };
  signApprove = async ({
    id
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      method,
      request,
      reject,
      resolve,
      url
    } = queued;
    const {
      val,
      ok
    } = await withSecretKey(queued.account.address, async secretKey => {
      const pw = await this.stores.password.getPassword();
      assert(pw, "Unauthorised");
      const privateKey = Buffer.from(secretKey);
      let signature;
      if (method === "personal_sign") {
        signature = personalSign({
          privateKey,
          data: request
        });
      } else if (["eth_signTypedData", "eth_signTypedData_v1"].includes(method)) {
        signature = signTypedData({
          privateKey,
          data: JSON.parse(request),
          version: SignTypedDataVersion.V1
        });
      } else if (method === "eth_signTypedData_v3") {
        signature = signTypedData({
          privateKey,
          data: JSON.parse(request),
          version: SignTypedDataVersion.V3
        });
      } else if (method === "eth_signTypedData_v4") {
        signature = signTypedData({
          privateKey,
          data: JSON.parse(request),
          version: SignTypedDataVersion.V4
        });
      } else {
        throw new Error(`Unsupported method : ${method}`);
      }
      resolve(signature);
      const {
        ok,
        val: host
      } = getHostName(url);
      talismanAnalytics.captureDelayed("sign approve", {
        method,
        isHardware: true,
        hostName: ok ? host : null,
        dapp: queued.url,
        chain: Number(queued.ethChainId),
        networkType: "ethereum"
      });
      return true;
    });
    if (ok) return val;
    if (val === "Unauthorised") {
      reject(Error(val));
    } else {
      const msg = getHumanReadableErrorMessage(val);
      if (msg) throw new Error(msg);else throw new Error("Unable to complete transaction");
    }
    return false;
  };
  signingCancel = ({
    id
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      reject
    } = queued;
    reject(new EthProviderRpcError("Cancelled", ETH_ERROR_EIP1993_USER_REJECTED));
    talismanAnalytics.captureDelayed("sign reject", {
      method: queued.method,
      dapp: queued.url,
      chain: Number(queued.ethChainId)
    });
    return true;
  };
  ethNetworkAddCancel = ({
    id
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      reject
    } = queued;
    reject(new EthProviderRpcError("Rejected", ETH_ERROR_EIP1993_USER_REJECTED));
    return true;
  };
  ethNetworkAddApprove = async ({
    id
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      url,
      network,
      nativeToken,
      resolve
    } = queued;
    const known = await chaindataProvider.getNetworkById(network.id, "ethereum");
    if (!known) {
      await customChaindataStore.upsertNetwork(network, nativeToken);
      talismanAnalytics.captureDelayed("add network evm", {
        network: network.name,
        isCustom: true
      });
    }
    await activeTokensStore.setActive(network.nativeTokenId, true);
    await activeNetworksStore.setActive(network.id, true);

    // associate the network with the dapp that requested it
    const {
      err,
      val
    } = urlToDomain(url);
    if (err) throw new Error(val);
    await this.stores.sites.updateSite(val, {
      ethChainId: Number(network.id)
    });
    resolve(null);
    return true;
  };
  ethWatchAssetRequestCancel = ({
    id
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      reject
    } = queued;
    reject(new EthProviderRpcError("Rejected", ETH_ERROR_EIP1993_USER_REJECTED));
    return true;
  };
  ethWatchAssetRequestApprove = async ({
    id
  }) => {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      resolve,
      token
    } = queued;
    const knownToken = await chaindataProvider.getTokenById(token.id);
    if (!knownToken) await customChaindataStore.upsertToken(token);
    await activeTokensStore.setActive(token.id, true);
    talismanAnalytics.captureDelayed("add asset evm", {
      contractAddress: token.contractAddress,
      symbol: token.symbol,
      network: token.networkId,
      isCustom: !knownToken
    });
    resolve(true);
    return true;
  };
  ethRequest = async ({
    chainId,
    method,
    params
  }) => {
    const client = await chainConnectorEvm.getPublicClientForEvmNetwork(chainId);
    assert(client, `No client for chain ${chainId}`);
    return client.request({
      method: method,
      params: params
    });
  };
  async handle(id, type, request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  port) {
    switch (type) {
      // --------------------------------------------------------------------
      // ethereum signing requests handlers -----------------------------
      // --------------------------------------------------------------------
      case "pri(eth.signing.signAndSend)":
        return this.signAndSend(request);
      case "pri(eth.signing.sendSigned)":
        return this.sendSigned(request);
      case "pri(eth.signing.approveSignAndSend)":
        return this.signAndSendApprove(request);
      case "pri(eth.signing.approveSign)":
        return this.signApprove(request);
      case "pri(eth.signing.approveSignHardware)":
        return this.signApproveHardware(request);
      case "pri(eth.signing.approveSignAndSendHardware)":
        return this.signAndSendApproveHardware(request);
      case "pri(eth.signing.cancel)":
        return this.signingCancel(request);

      // --------------------------------------------------------------------
      // ethereum watch asset requests handlers -----------------------------
      // --------------------------------------------------------------------
      case "pri(eth.watchasset.requests.cancel)":
        return this.ethWatchAssetRequestCancel(request);
      case "pri(eth.watchasset.requests.approve)":
        return this.ethWatchAssetRequestApprove(request);

      // --------------------------------------------------------------------
      // ethereum network handlers ------------------------------------------
      // --------------------------------------------------------------------
      case "pri(eth.networks.add.cancel)":
        return this.ethNetworkAddCancel(request);
      case "pri(eth.networks.add.approve)":
        return this.ethNetworkAddApprove(request);

      // --------------------------------------------------------------------
      // ethereum other handlers ------------------------------------------
      // --------------------------------------------------------------------
      case "pri(eth.transactions.count)":
        {
          const {
            address,
            evmNetworkId
          } = request;
          return getTransactionCount(address, evmNetworkId);
        }
      case "pri(eth.request)":
        return this.ethRequest(request);
    }
    throw new Error(`Unable to handle message of type ${type}`);
  }
}

const signAndSendEth = (url, request, ethChainId, account, port) => {
  return requestStore.createRequest({
    url,
    ethChainId,
    account,
    request,
    type: "eth-send",
    method: "eth_sendTransaction"
  }, port);
};
const signEth = (url, method, params, request, ethChainId, account, port) => {
  return requestStore.createRequest({
    url,
    ethChainId,
    account,
    type: "eth-sign",
    method,
    params,
    request
  }, port);
};
const signSubstrate = (url, request, account, port) => {
  return requestStore.createRequest({
    type: "substrate-sign",
    url,
    request,
    account
  }, port);
};
const signSolana = (url, port, account, request) => {
  return requestStore.createRequest({
    type: "sol-sign",
    url,
    request,
    account
  }, port);
};

const SOLANA_WALLET_STANDARD_FEATURES = [
//...READONLY_FEATURES,
SolanaSignAndSendTransaction, SolanaSignTransaction, SolanaSignMessage, SolanaSignIn];
const SOLANA_WALLET_CHAINS = ["solana:mainnet", "solana:testnet", "solana:devnet", "solana:localnet"];

const ERROR_DUPLICATE_AUTH_REQUEST_MESSAGE = "Pending authorisation request already exists for this site. Please accept or reject the request.";
class AuthError extends Error {}
const requestAuthoriseSite = async (url, request, port) => {
  const {
    err,
    val: domain
  } = urlToDomain(url);
  if (err) throw new AuthError(domain);

  // Do not enqueue duplicate authorization requests.
  const isDuplicate = requestStore.getAllRequests("auth").some(req => req.idStr === domain && req.request.provider === request.provider);
  if (isDuplicate) {
    throw new AuthError(ERROR_DUPLICATE_AUTH_REQUEST_MESSAGE);
  }
  return requestStore.createRequest({
    url,
    idStr: domain,
    request,
    type: "auth"
  }, port).then(async response => {
    const {
      addresses = []
    } = response;
    const {
      origin,
      provider
    } = request;

    // we have already validated the url here, so no need to try/catch
    const siteAuth = (await sitesAuthorisedStore.getSiteFromUrl(url)) ?? {};
    siteAuth.id = domain;
    siteAuth.origin = origin;
    siteAuth.url = url;
    switch (provider) {
      case "polkadot":
        {
          siteAuth.addresses = addresses;
          break;
        }
      case "ethereum":
        {
          siteAuth.ethAddresses = addresses;

          // set a default value for ethChainId only if empty
          // some sites switch the network before requesting auth, ex nova.arbiscan.io
          if (!siteAuth.ethChainId) siteAuth.ethChainId = DEFAULT_ETH_CHAIN_ID;
          break;
        }
      case "solana":
        {
          siteAuth.solAddresses = addresses;
          break;
        }
    }
    await sitesAuthorisedStore.set({
      [domain]: siteAuth
    });
  });
};
const ignoreRequest = ({
  id
}) => {
  const request = requestStore.getRequest(id);
  assert(request, `Sites Auth Request with id ${id} doesn't exist`);
  requestStore.deleteRequest(id);
  return true;
};
const requestSolanaSignIn = async ({
  input
}, url, port) => {
  const {
    err,
    val: domain
  } = urlToDomain(url);
  if (err) throw new AuthError(domain);

  // Do not enqueue duplicate authorization requests.
  const isDuplicate = requestStore.getAllRequests("auth-sol-signIn").some(req => req.url === url);
  if (isDuplicate) throw new AuthError(ERROR_DUPLICATE_AUTH_REQUEST_MESSAGE);
  const {
    account,
    message,
    signature
  } = await requestStore.createRequest({
    // id will be set automatically by requestStore
    type: "auth-sol-signIn",
    url,
    input
  }, port);
  const siteAuth = (await sitesAuthorisedStore.getSiteFromUrl(url)) ?? {};
  siteAuth.id = domain;
  siteAuth.origin = "";
  siteAuth.url = url;
  siteAuth.solAddresses = [account.address];
  await sitesAuthorisedStore.set({
    [domain]: siteAuth
  });
  const output = {
    account: {
      address: account.address,
      label: account.name,
      chains: SOLANA_WALLET_CHAINS,
      // TODO extract from chaindata
      features: SOLANA_WALLET_STANDARD_FEATURES,
      icon: getTalismanOrbDataUrl(account.address)
    },
    signature,
    signedMessage: base58.encode(new TextEncoder().encode(message)),
    // plaintext to base58
    signatureType: "ed25519"
  };
  return output;
};

class AddNetworkError extends Error {}
const requestAddNetwork = async (url, network, nativeToken, port) => {
  const {
    err,
    val: urlVal
  } = urlToDomain(url);
  if (err) throw new AddNetworkError(urlVal);

  // Do not enqueue duplicate requests from the same app
  const isDuplicate = requestStore.getAllRequests(ETH_NETWORK_ADD_PREFIX).some(request => request.idStr === urlVal);
  if (isDuplicate) {
    throw new AddNetworkError("Pending add network already exists for this site. Please accept or reject the request.");
  }
  await requestStore.createRequest({
    url,
    network,
    nativeToken,
    idStr: urlVal,
    type: ETH_NETWORK_ADD_PREFIX
  }, port);
};
class WatchAssetError extends Error {}
const requestWatchAsset = async (url, request, token, warnings, port) => {
  const address = request.options.address;
  const isDuplicate = requestStore.getAllRequests(WATCH_ASSET_PREFIX).some(({
    request
  }) => request.options.address === address);
  if (isDuplicate) {
    throw new WatchAssetError("Pending watch asset request already exists. Please accept or reject the request.");
  }
  await requestStore.createRequest({
    type: WATCH_ASSET_PREFIX,
    url,
    request,
    token,
    warnings
  }, port);
  return true;
};

class EthTabsHandler extends TabsHandler {
  async checkAccountAuthorised(url, address) {
    try {
      await this.stores.sites.ensureUrlAuthorized(url, true, address);
    } catch (err) {
      throw new EthProviderRpcError("Unauthorized", ETH_ERROR_EIP1993_UNAUTHORIZED);
    }
  }
  async getSiteDetails(url, authorisedAddress) {
    let site;
    try {
      site = await this.stores.sites.getSiteFromUrl(url);
    } catch (err) {
      // no-op, will throw below
    }
    if (!site || !site.ethChainId || authorisedAddress && !site.ethAddresses?.includes(normalizeAddress(authorisedAddress))) throw new EthProviderRpcError("Unauthorized", ETH_ERROR_EIP1993_UNAUTHORIZED);
    return site;
  }
  async getPublicClient(url, authorisedAddress) {
    const site = await this.getSiteDetails(url, authorisedAddress);
    const ethereumNetwork = await chaindataProvider.getNetworkById(site.ethChainId.toString(), "ethereum");
    if (!ethereumNetwork) throw new EthProviderRpcError("Network not supported", ETH_ERROR_EIP1993_CHAIN_DISCONNECTED);
    const provider = await chainConnectorEvm.getPublicClientForEvmNetwork(ethereumNetwork.id);
    if (!provider) throw new EthProviderRpcError(`No provider for network ${ethereumNetwork.id} (${ethereumNetwork.name})`, ETH_ERROR_EIP1993_CHAIN_DISCONNECTED);
    return provider;
  }
  async authoriseEth(url, request, port) {
    let siteFromUrl;
    try {
      siteFromUrl = await this.stores.sites.getSiteFromUrl(url);
    } catch (err) {
      return false;
    }
    if (siteFromUrl?.ethAddresses) {
      if (siteFromUrl.ethAddresses.length) return true; //already authorized
      else throw new EthProviderRpcError("Unauthorized", ETH_ERROR_EIP1993_UNAUTHORIZED); //already rejected : 4100	Unauthorized
    }
    try {
      await requestAuthoriseSite(url, request, port);
      return true;
    } catch (err) {
      // throw specific error in case of duplicate auth request
      const error = err;
      if (error.message === ERROR_DUPLICATE_AUTH_REQUEST_MESSAGE) throw new EthProviderRpcError(error.message, ETH_ERROR_EIP1474_RESOURCE_UNAVAILABLE);

      // 4001	User Rejected Request	The user rejected the request.
      throw new EthProviderRpcError("User Rejected Request", ETH_ERROR_EIP1993_USER_REJECTED);
    }
  }
  async accountsList(url) {
    let site;
    try {
      site = await this.stores.sites.getSiteFromUrl(url);
      if (!site) return [];
    } catch (err) {
      return [];
    }

    // case is used for checksum when validating user input addresses : https://eips.ethereum.org/EIPS/eip-55
    // signature checks methods return lowercase addresses too and are compared to addresses returned by provider
    // => we have to return addresses as lowercase too
    return getPublicAccounts(await keyringStore.getAccounts(), filterAccountsByAddresses(site.ethAddresses), {
      developerMode: await this.stores.settings.get("developerMode"),
      includePortalOnlyInfo: isTalismanUrl(site.url)
    }).filter(({
      type
    }) => type === "ethereum")
    // send as
    .map(({
      address
    }) => getAddress(address).toLowerCase());
  }
  async ethSubscribe(id, url, port) {
    // settings that are specific to a tab
    let siteId;
    let chainId;
    let accounts;
    let connected;
    const sendToClient = message => {
      try {
        port.postMessage({
          id,
          subscription: message
        });
      } catch (e) {
        if (e instanceof Error) {
          if (e.message === "Attempting to use a disconnected port object") {
            // this means that the user has done something like close the tab
            port.disconnect();
            return;
          }
        }
        throw e;
      }
    };

    // TODO use same behavior as in the accountsList method above (observe keyring and settings too, to check accounts still exist, and filter watched accounts based on developerMode setting)

    const init = () => this.stores.sites.getSiteFromUrl(url).then(async site => {
      try {
        if (!site) return;
        siteId = site.id;
        if (site.ethChainId && site.ethAddresses?.length) {
          chainId = site?.ethChainId !== undefined ? toHex(site.ethChainId) : undefined;
          accounts = site.ethAddresses ?? [];

          // check that the network is still registered before broadcasting
          connected = !!accounts.length;
          if (connected) {
            sendToClient({
              type: "accountsChanged",
              data: accounts
            });
            sendToClient({
              type: "connect",
              data: {
                chainId
              }
            });
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to initialize eth subscription", err);
      }
    }).catch(error => {
      // most likely error will be url invalid, no-op for that, re-throw anything else
      if (!["URL protocol unsupported", "Invalid URL"].includes(error.message)) throw error;
    });

    // eager connect, should work for sites already authorized
    // await promise or sites observable handler won't be ready
    await init();
    const {
      unsubscribe
    } = this.stores.sites.observable.subscribe(async sites => {
      const site = sites[siteId];

      // old state for this dapp
      const prevChainId = chainId;
      const prevAccounts = accounts;
      const prevConnected = connected;
      try {
        // new state for this dapp
        chainId = site?.ethChainId !== undefined ? toHex(site.ethChainId) : undefined;
        //TODO check eth addresses still exist
        accounts = site?.ethAddresses ?? [];
        connected = !!accounts.length;
        if (typeof siteId === "undefined") {
          // user may just have authorized, try to reinitialize
          return await init();
        }

        // compare old and new state and emit corresponding events
        if (prevConnected && !connected) sendToClient({
          type: "disconnect",
          data: {
            code: chainId ? ETH_ERROR_EIP1993_CHAIN_DISCONNECTED : ETH_ERROR_EIP1993_DISCONNECTED
          }
        });
        if (!prevConnected && connected) {
          sendToClient({
            type: "connect",
            data: {
              chainId
            }
          });
        } else if (connected && prevChainId !== chainId) {
          sendToClient({
            type: "chainChanged",
            data: chainId
          });
        }
        if (connected && chainId && prevAccounts?.join() !== accounts.join()) {
          sendToClient({
            type: "accountsChanged",
            data: accounts.map(ac => getAddress(ac).toLowerCase())
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("site subscription callback error", {
          err
        });
      }
    });

    // unsubscribe if port disconnects (usually when tab closes)
    const handleDisconnect = () => {
      try {
        // by the time this is called, the subscription may already be closed which will raise an error
        unsubscribe();
      } catch (e) {
        if (!(e instanceof TypeError && e.message === "Cannot read properties of undefined (reading 'closed')")) throw e;
      }
      port.onDisconnect.removeListener(handleDisconnect);
    };
    port.onDisconnect.addListener(handleDisconnect);
    return true;
  }
  addEthereumChain = async (url, request, port) => {
    const {
      params: [ethChain]
    } = request;
    const chainId = parseInt(ethChain.chainId, 16);
    if (isNaN(chainId)) throw new EthProviderRpcError("Invalid chain id", ETH_ERROR_EIP1474_INVALID_PARAMS);
    const networkId = String(chainId);
    const knownNetwork = await chaindataProvider.getNetworkById(chainId.toString(), "ethereum");

    // some dapps (ex app.solarbeam.io) call this method without attempting to call wallet_switchEthereumChain first
    // in case network is already registered, dapp expects that we switch to it
    const activeNetworks = await activeNetworksStore.get();
    if (knownNetwork && isNetworkActive(knownNetwork, activeNetworks)) return this.switchEthereumChain(url, {
      method: "wallet_switchEthereumChain",
      params: [{
        chainId: ethChain.chainId
      }]
    });
    if (knownNetwork) {
      const nativeToken = await chaindataProvider.getTokenById(knownNetwork.nativeTokenId, "evm-native");
      if (nativeToken) {
        await requestAddNetwork(url, knownNetwork, nativeToken, port);
        return null;
      }
    }

    // on some dapps (ex: https://app.pangolin.exchange/), iconUrls is a string instead of an array
    if (typeof ethChain.iconUrls === "string") ethChain.iconUrls = [ethChain.iconUrls];

    // type check payload
    if (!isValidAddEthereumRequestParam(ethChain)) throw new EthProviderRpcError("Invalid parameter", ETH_ERROR_EIP1474_INVALID_PARAMS);

    // check that the RPC exists and has the correct chain id
    if (!ethChain.rpcUrls.length) throw new EthProviderRpcError("Missing rpcUrls", ETH_ERROR_EIP1474_INVALID_PARAMS);
    await Promise.all(ethChain.rpcUrls.map(async rpcUrl => {
      try {
        const client = createClient({
          transport: http(rpcUrl, {
            retryCount: 1
          })
        });
        const rpcChainIdHex = await Promise.race([client.request({
          method: "eth_chainId"
        }), throwAfter(10_000, "timeout") // 10 sec timeout
        ]);
        assert(!!rpcChainIdHex, `No chainId returned for ${rpcUrl}`);
        const rpcChainId = hexToNumber(rpcChainIdHex);
        assert(rpcChainId === chainId, "chainId mismatch");
      } catch (err) {
        log.error({
          err
        });
        throw new EthProviderRpcError("Invalid rpc " + rpcUrl, ETH_ERROR_EIP1474_INVALID_PARAMS);
      }
    }));
    const nativeToken = {
      id: evmNativeTokenId(networkId),
      type: "evm-native",
      networkId,
      platform: "ethereum",
      symbol: ethChain.nativeCurrency.symbol,
      name: ethChain.nativeCurrency.name || ethChain.nativeCurrency.symbol,
      decimals: ethChain.nativeCurrency.decimals || 18,
      isDefault: true
    };
    const network = {
      id: networkId,
      platform: "ethereum",
      name: ethChain.chainName || "Unknown Network",
      rpcs: ethChain.rpcUrls,
      nativeTokenId: nativeToken.id,
      nativeCurrency: {
        decimals: nativeToken.decimals,
        name: nativeToken.name ?? nativeToken.symbol,
        symbol: nativeToken.symbol
      },
      blockExplorerUrls: ethChain.blockExplorerUrls ?? [],
      logo: ethChain.iconUrls?.[0]
    };
    await requestAddNetwork(url, network, nativeToken, port);
    return null;
  };
  switchEthereumChain = async (url, request) => {
    const {
      params: [{
        chainId: hexChainId
      }]
    } = request;
    if (!hexChainId) throw new EthProviderRpcError("Missing chainId", ETH_ERROR_EIP1474_INVALID_PARAMS);
    const ethChainId = parseInt(hexChainId, 16);
    const ethereumNetwork = await chaindataProvider.getNetworkById(ethChainId.toString(), "ethereum");
    const activeNetworks = await activeNetworksStore.get();
    if (!ethereumNetwork || !isNetworkActive(ethereumNetwork, activeNetworks)) throw new EthProviderRpcError(`Unknown network ${ethChainId}, try adding the chain using wallet_addEthereumChain first`, ETH_ERROR_UNKNOWN_CHAIN_NOT_CONFIGURED);
    const provider = await chainConnectorEvm.getPublicClientForEvmNetwork(ethereumNetwork.id);
    if (!provider) throw new EthProviderRpcError(`Failed to connect to network ${ethChainId}`, ETH_ERROR_EIP1993_CHAIN_DISCONNECTED);
    const {
      err,
      val
    } = urlToDomain(url);
    if (err) throw new Error(val);
    this.stores.sites.updateSite(val, {
      ethChainId
    });
    return null;
  };
  getChainId = async url => {
    let site;
    try {
      // url validation carried out inside stores.sites.getSiteFromUrl
      site = await this.stores.sites.getSiteFromUrl(url);
    } catch (error) {
      //no-op
    }
    // TODO what to do if default network is disabled ?
    return site?.ethChainId ?? DEFAULT_ETH_CHAIN_ID;
  };
  async getFallbackRequest(url, request) {
    // obtain the chain id without checking auth.
    // note: this method is only called if method doesn't require auth, or if auth is already checked
    const chainId = await this.getChainId(url);
    const publicClient = await chainConnectorEvm.getPublicClientForEvmNetwork(chainId.toString());
    if (!publicClient) throw new EthProviderRpcError(`Unknown network ${chainId}`, ETH_ERROR_UNKNOWN_CHAIN_NOT_CONFIGURED);
    return publicClient.request({
      method: request.method,
      params: request.params
    });
  }
  signMessage = async (url, {
    params,
    method
  }, port) => {
    // eth_signTypedData requires a non-empty array of parameters, else throw (uniswap will then call v4)
    if (method === "eth_signTypedData") {
      if (!Array.isArray(params[0])) throw new EthProviderRpcError("Invalid parameter", ETH_ERROR_EIP1474_INVALID_PARAMS);
    }
    let isMessageFirst = ["personal_sign", "eth_signTypedData", "eth_signTypedData_v1"].includes(method);
    // on https://astar.network, params are in reverse order
    if (typeof params[0] === "string" && isMessageFirst && isEthereumAddress$1(params[0]) && !isEthereumAddress$1(params[1])) isMessageFirst = false;
    const [uncheckedMessage, from] = isMessageFirst ? [params[0], getAddress(params[1])] : [params[1], getAddress(params[0])];

    // message is either a raw string or a hex string or an object (signTypedData_v1)
    const message = typeof uncheckedMessage === "string" ? uncheckedMessage : JSON.stringify(uncheckedMessage);
    const site = await this.getSiteDetails(url, from);
    const address = site.ethAddresses[0];
    const account = await keyringStore.getAccount(address);
    if (!address || !account || getAddress(address) !== getAddress(from)) {
      throw new EthProviderRpcError(`No account available for ${url}`, ETH_ERROR_EIP1993_UNAUTHORIZED);
    }
    return signEth(url, method, params, message, site.ethChainId.toString(), account, port);
  };
  addWatchAssetRequest = async (url, request, port) => {
    if (!isValidWatchAssetRequestParam(request.params)) throw new EthProviderRpcError("Invalid parameter", ETH_ERROR_EIP1474_INVALID_PARAMS);
    const processRequest = async () => {
      try {
        const {
          options: {
            symbol,
            address,
            decimals,
            image
          }
        } = await sanitizeWatchAssetRequestParam(request.params);
        const ethChainId = await this.getChainId(url);
        if (typeof ethChainId !== "number") throw new EthProviderRpcError("Not connected", ETH_ERROR_EIP1993_CHAIN_DISCONNECTED);
        const tokenId = evmErc20TokenId(ethChainId.toString(), address);
        const existing = await chaindataProvider.getTokenById(tokenId);
        if (existing && isTokenActive(existing, await activeTokensStore.get())) throw new EthProviderRpcError("Asset already exists", ETH_ERROR_EIP1474_INVALID_PARAMS);
        const client = await chainConnectorEvm.getPublicClientForEvmNetwork(ethChainId.toString());
        if (!client) throw new EthProviderRpcError("Network not supported", ETH_ERROR_EIP1993_CHAIN_DISCONNECTED);
        try {
          // eslint-disable-next-line no-var
          var tokenInfo = await getErc20TokenInfo(client, ethChainId.toString(), address);
        } catch (err) {
          throw new EthProviderRpcError("Asset not found", ETH_ERROR_EIP1474_INVALID_PARAMS);
        }
        const allTokens = await chaindataProvider.getTokens();
        const symbolFound = allTokens.some(token => token.type === "evm-erc20" && token.networkId === ethChainId.toString() && token.symbol === symbol && token.contractAddress.toLowerCase() !== address.toLowerCase());
        const warnings = [];
        if (!tokenInfo) {
          warnings.push(i18next.t("Failed to verify the contract information"));
        } else {
          if (tokenInfo.symbol !== symbol) warnings.push(i18next.t("Suggested symbol {{symbol}} is different from the one defined on the contract ({{contractSymbol}})", {
            symbol,
            contractSymbol: tokenInfo.symbol
          }));
          if (!tokenInfo.coingeckoId) warnings.push(i18next.t("This token's address is not registered on CoinGecko"));
        }
        if (symbolFound) warnings.push(i18next.t(`Another {{symbol}} token already exists on this network`, {
          symbol
        }));
        const token = {
          id: tokenId,
          type: "evm-erc20",
          platform: "ethereum",
          symbol: symbol ?? tokenInfo.symbol,
          decimals: decimals ?? tokenInfo.decimals,
          name: tokenInfo.name ?? symbol ?? tokenInfo.symbol,
          logo: image ?? tokenInfo.logo,
          coingeckoId: tokenInfo.coingeckoId,
          contractAddress: address,
          networkId: tokenInfo.networkId
        };
        await requestWatchAsset(url, request.params, token, warnings, port);
      } catch (err) {
        log.error("Failed to add watch asset", {
          err
        });
      }
    };

    // process request asynchronously to prevent dapp from knowing if user accepts or rejects
    // see https://eips.ethereum.org/EIPS/eip-747
    processRequest();
    return true;
  };
  async sendTransaction(url, {
    params: [txRequest]
  }, port) {
    const site = await this.getSiteDetails(url, txRequest.from);
    {
      // eventhough not standard, some transactions specify a chainId in the request
      // throw an error if it's not the current tab's chainId
      let specifiedChainId = txRequest.chainId;

      // ensure chainId isn't an hex (ex: Zerion)
      if (isHex$1(specifiedChainId)) specifiedChainId = hexToNumber(specifiedChainId);

      // checks that the request targets currently selected network
      if (specifiedChainId && Number(site.ethChainId) !== Number(specifiedChainId)) throw new EthProviderRpcError("Wrong network", ETH_ERROR_EIP1474_INVALID_PARAMS);
    }
    try {
      // ensure that we have a valid provider for the current network
      await this.getPublicClient(url, txRequest.from);
    } catch (error) {
      throw new EthProviderRpcError("Network not supported", ETH_ERROR_EIP1993_CHAIN_DISCONNECTED);
    }
    const address = site.ethAddresses[0];

    // allow only the currently selected account in "from" field
    if (txRequest.from?.toLowerCase() !== address.toLowerCase()) throw new EthProviderRpcError("Invalid from account", ETH_ERROR_EIP1474_INVALID_INPUT);
    const account = await keyringStore.getAccount(address);
    if (!address || !account) {
      throw new EthProviderRpcError(`No account available for ${url}`, ETH_ERROR_EIP1993_UNAUTHORIZED);
    }
    return signAndSendEth(url, txRequest, site.ethChainId.toString(), account, port);
  }
  async getPermissions(url) {
    let site;
    try {
      // url validation carried out inside stores.sites.getSiteFromUrl
      site = await this.stores.sites.getSiteFromUrl(url);
    } catch (error) {
      // no-op
    }
    return site?.ethPermissions ? Object.entries(site.ethPermissions).reduce((permissions, [parentCapability, otherProps]) => permissions.concat({
      parentCapability,
      ...otherProps
    }), []) : [];
  }
  async requestPermissions(url, request, port) {
    if (request.params.length !== 1) throw new EthProviderRpcError("This method expects an array with only 1 entry", ETH_ERROR_EIP1474_INVALID_PARAMS);
    const [requestedPerms] = request.params;
    if (!isValidRequestedPermissions(requestedPerms)) throw new EthProviderRpcError("Invalid permissions", ETH_ERROR_EIP1474_INVALID_PARAMS);

    // identify which permissions are currently missing
    let site;
    try {
      // url validation carried out inside stores.sites.getSiteFromUrl
      site = await this.stores.sites.getSiteFromUrl(url);
    } catch (error) {
      return [];
    }
    const existingPerms = site?.ethPermissions ?? {};
    const missingPerms = Object.keys(requestedPerms).map(perm => perm).filter(perm => !existingPerms[perm]);

    // request all missing permissions to the user
    // for now we only support eth_accounts, which we consider granted when user authenticates
    // @dev: cannot proceed with a loop here as order may have some importance, and we may want to group multiple permissions in a single request
    const grantedPermissions = {};
    if (missingPerms.includes("eth_accounts")) {
      await this.authoriseEth(url, {
        origin: "",
        provider: "ethereum"
      }, port);
      grantedPermissions.eth_accounts = {
        date: new Date().getTime()
      };
    }

    // if any, store missing permissions
    if (Object.keys(grantedPermissions).length) {
      // fetch site again as it might have been created/updated while authenticating (eth_accounts permission)
      // no need to handle URL invalid error this time as we know the URL is ok
      const siteAgain = await this.stores.sites.getSiteFromUrl(url);
      if (!siteAgain) throw new EthProviderRpcError("Unauthorised", ETH_ERROR_EIP1993_UNAUTHORIZED);
      const ethPermissions = {
        ...(siteAgain.ethPermissions ?? {}),
        ...grantedPermissions
      };
      await this.stores.sites.updateSite(siteAgain.id, {
        ethPermissions
      });
    }
    return this.getPermissions(url);
  }
  async ethRequest(id, url, request, port) {
    if (!["eth_requestAccounts", "eth_accounts", "eth_chainId",
    // TODO check if necessary ?
    "eth_blockNumber",
    // TODO check if necessary ?
    "net_version",
    // TODO check if necessary ?
    "wallet_switchEthereumChain", "wallet_addEthereumChain", "wallet_watchAsset", "wallet_requestPermissions"].includes(request.method)) await this.checkAccountAuthorised(url);

    // TODO typecheck return types against rpc schema
    switch (request.method) {
      case "eth_requestAccounts":
        await this.requestPermissions(url, {
          method: "wallet_requestPermissions",
          params: [{
            eth_accounts: {}
          }]
        }, port);
        return this.accountsList(url);
      case "eth_accounts":
        // public method, no need to auth (returns empty array if not authorized yet)
        return this.accountsList(url);
      case "eth_coinbase":
        {
          const accounts = await this.accountsList(url);
          return accounts[0] ?? null;
        }
      case "eth_chainId":
        // public method, no need to auth (returns undefined if not authorized yet)
        return toHex(await this.getChainId(url));
      case "net_version":
        // public method, no need to auth (returns undefined if not authorized yet)
        // legacy, but still used by etherscan prior calling eth_watchAsset
        return (await this.getChainId(url)).toString();
      case "personal_sign":
      case "eth_signTypedData":
      case "eth_signTypedData_v1":
      case "eth_signTypedData_v3":
      case "eth_signTypedData_v4":
        {
          return this.signMessage(url, request, port);
        }
      case "personal_ecRecover":
        {
          const {
            params: [message, signature]
          } = request;
          return recoverMessageAddress({
            message,
            signature
          });
        }
      case "eth_sendTransaction":
        return this.sendTransaction(url, request, port);
      case "wallet_watchAsset":
        //auth-less test dapp : rsksmart.github.io/metamask-rsk-custom-network/
        return this.addWatchAssetRequest(url, request, port);
      case "wallet_addEthereumChain":
        //auth-less test dapp : rsksmart.github.io/metamask-rsk-custom-network/
        return this.addEthereumChain(url, request, port);
      case "wallet_switchEthereumChain":
        //auth-less test dapp : rsksmart.github.io/metamask-rsk-custom-network/
        return this.switchEthereumChain(url, request);

      // https://docs.metamask.io/guide/rpc-api.html#wallet-getpermissions
      case "wallet_getPermissions":
        return this.getPermissions(url);

      // https://docs.metamask.io/guide/rpc-api.html#wallet-requestpermissions
      case "wallet_requestPermissions":
        return this.requestPermissions(url, request, port);
      default:
        return this.getFallbackRequest(url, request);
    }
  }
  async handle(id, type, request, port, url) {
    // Always check for onboarding before doing anything else
    // Because of chrome extensions can be synchronised on multiple computers,
    // Talisman may be installed on computers where user do not want to onboard
    // => Do not trigger onboarding, just throw an error
    try {
      await this.stores.app.ensureOnboarded();
    } catch (err) {
      if (err instanceof TalismanNotOnboardedError) throw new EthProviderRpcError(err.message, ETH_ERROR_EIP1993_UNAUTHORIZED);
    }
    switch (type) {
      case "pub(eth.subscribe)":
        return this.ethSubscribe(id, url, port);
      case "pub(eth.request)":
        {
          try {
            return await this.ethRequest(id, url, request, port);
          } catch (err) {
            // error may already be formatted by our handler
            if (err instanceof EthProviderRpcError) throw err;
            const {
              code,
              message,
              shortMessage,
              details
            } = err;
            const cause = getEvmErrorCause(err);
            const myError = new EthProviderRpcError(shortMessage ?? message ?? "Internal error", code ?? ETH_ERROR_EIP1474_INTERNAL_ERROR,
            // assume if data property is present, it's an EVM revert => dapp expects that underlying error object
            cause.data ? cause : details);
            throw myError;
          }
        }
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class MetadataHandler extends ExtensionHandler {
  async metadataApprove({
    id
  }) {
    try {
      const queued = requestStore.getRequest(id);
      assert(queued, "Unable to find request");
      const {
        request,
        resolve
      } = queued;
      await db.metadata.put(request);
      resolve(true);
      return true;
    } catch (err) {
      log.error("Failed to update metadata", {
        err
      });
      throw new Error("Failed to update metadata");
    }
  }
  metadataReject({
    id
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      reject
    } = queued;
    reject(new Error("Rejected"));
    return true;
  }
  async handle(id, type, request, port) {
    // Then try remaining which are present in this class
    switch (type) {
      // --------------------------------------------------------------------
      // metadata handlers --------------------------------------------------
      // --------------------------------------------------------------------
      case "pri(metadata.approve)":
        return await this.metadataApprove(request);
      case "pri(metadata.reject)":
        return this.metadataReject(request);
      case "pri(metadata.updates.subscribe)":
        {
          const {
            id: genesisHash
          } = request;
          return metadataUpdatesStore.subscribe(id, port, genesisHash);
        }
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class MnemonicHandler extends ExtensionHandler {
  async setVerifierCertMnemonic(options) {
    switch (options.type) {
      case "new":
        {
          const {
            mnemonic,
            confirmed
          } = options;
          assert(mnemonic, "Mnemonic should be provided");
          const isValid = isValidMnemonic(mnemonic);
          assert(isValid, "Invalid mnemonic");
          const password = await this.stores.password.getPassword();
          if (!password) throw new Error("Unauthorised");
          const {
            id
          } = await keyringStore.addMnemonic({
            name: "Vault Verifier Certificate Mnemonic",
            mnemonic,
            confirmed
          });
          await this.stores.app.set({
            vaultVerifierCertificateMnemonicId: id
          });
          return true;
        }
      case "existing":
        {
          const {
            mnemonicId
          } = options;
          assert(mnemonicId, "MnemonicId should be provided");
          const mnemonic = await keyringStore.getMnemonic(mnemonicId);
          assert(mnemonic, "Unable to find mnemonic");
          await this.stores.app.set({
            vaultVerifierCertificateMnemonicId: mnemonicId
          });
          return true;
        }
      default:
        throw new Error("Invalid request");
    }
  }
  mnemonicsSubscribe(id, port) {
    return genericAsyncSubscription(id, port, keyringStore.mnemonics$);
  }
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(mnemonics.subscribe)":
        return this.mnemonicsSubscribe(id, port);
      case "pri(mnemonics.unlock)":
        {
          const {
            password,
            mnemonicId
          } = request;
          const transformedPw = await this.stores.password.transformPassword(password);
          assert(transformedPw, "Password error");
          return keyringStore.getMnemonicText(mnemonicId, transformedPw);
        }
      case "pri(mnemonics.confirm)":
        {
          const {
            confirmed,
            mnemonicId
          } = request;
          await keyringStore.updateMnemonic(mnemonicId, {
            confirmed
          });
          return true;
        }
      case "pri(mnemonics.rename)":
        {
          const {
            mnemonicId,
            name
          } = request;
          await keyringStore.updateMnemonic(mnemonicId, {
            name
          });
          return true;
        }
      case "pri(mnemonics.delete)":
        {
          const {
            mnemonicId
          } = request;
          await keyringStore.removeMnemonic(mnemonicId);
          return true;
        }
      case "pri(mnemonics.validateMnemonic)":
        return isValidMnemonic(request);
      case "pri(mnemonics.setVerifierCertMnemonic)":
        return this.setVerifierCertMnemonic(request);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

const fetchEvmAccountNfts = async (address, signal) => {
  const req = await fetch(`${ASSET_DISCOVERY_API_URL}/nfts/${address}`, {
    signal
  });
  if (!req.ok) throw new Error("Failed to fetch nfts");
  return await req.json();
};

const fetchEvmNftRefresh = async id => {
  const req = await fetch(`${ASSET_DISCOVERY_API_URL}/nfts/refresh`, {
    method: "POST",
    body: JSON.stringify({
      id
    })
  });
  if (!req.ok) throw new Error("Failed to refresh metadata");
};

// Talisman ChainId => Subscan chain slug
const NETWORKS = {
  "polkadot-asset-hub": "assethub-polkadot",
  "kusama-asset-hub": "assethub-kusama"
  // "mythos": "mythos", // it works but they all seem like technical collections without name nor image
};

// Use a global promise queue to comply with subscan rate limit of 5 requests per second
// In practice it seems limited at 1 request per second, most likely because we are not using an api key
// The rate limit is global to all of their subdomains
// TODO maybe implement something based on http headers ? https://support.subscan.io/doc-362600
const SUBSCAN_QUEUE = new PQueue({
  interval: 1000,
  intervalCap: 1
});

// Use another promise queue to ensure accounts are processed only one at a time.
// This helps displaying first results faster on the front end
const ACCOUNTS_QUEUE = new PQueue({
  concurrency: 1
});
const fetchDotAccountNfts = async (account, signal) => {
  const result = await ACCOUNTS_QUEUE.add(async () => {
    const activeChains = await activeNetworksStore.get();
    const results = await Promise.all(Object.keys(NETWORKS).map(async networkId => {
      const network = await chaindataProvider.getNetworkById(networkId);
      return network && isAccountCompatibleWithNetwork(network, account) && isNetworkActive(network, activeChains) ? fetchDotAccountChainNfts(account.address, networkId, signal) : null;
    }));
    return results.filter(isNotNil).reduce((acc, item) => {
      acc.nfts.push(...item.nfts);
      for (const col of item.collections) if (!acc.collections.some(c => c.id === col.id)) acc.collections.push(col);
      return acc;
    }, {
      nfts: [],
      collections: []
    });
  }, {
    signal
  });
  if (!result) throw new Error(`Failed to fetch dot nfts for ${account.address}`);
  return result;
};
const postSubscanWithRetry = async (url, body, signal, maxAttempts = 3) => {
  try {
    const result = await SUBSCAN_QUEUE.add(async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Content: "application/json"
        },
        body,
        signal
      });
      if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status} - ${response.statusText})`);
      return response.json();
    }, {
      timeout: 10_000,
      throwOnTimeout: true,
      signal
    });
    if (!result) throw new Error("Failed to fetch");
    return result;
  } catch (err) {
    signal.throwIfAborted();
    if (!maxAttempts) throw new Error("Failed to fetch - max attempts reached");
    return postSubscanWithRetry(url, body, signal, maxAttempts - 1);
  }
};

// assume collections are not changing often, keep them in memory
const CACHE = new Map();
const fetchDotAccountChainNfts = async (address, chainId, signal) => {
  try {
    const allData = [];
    const subscanChainId = NETWORKS[chainId];
    const ITEMS_PER_PAGE = 100;
    const MAX_PAGES = 5;
    let page = 0;
    let resultsCount;
    do {
      signal.throwIfAborted();
      const {
        data
      } = await postSubscanWithRetry(`https://${subscanChainId}.api.subscan.io/api/scan/nfts/info/items`, JSON.stringify({
        owner: address,
        page,
        row: ITEMS_PER_PAGE
      }), signal);
      allData.push(...(data.list ?? []));
      page++;
      resultsCount = data.count;
    } while (allData.length < resultsCount && page < MAX_PAGES);
    const nfts = await Promise.all(allData.map(async nft => {
      const updatedAt = await getUpdatedAt(nft, subscanChainId, signal);
      return itemToOwnedNft(chainId, nft, address, updatedAt);
    }));

    // this clears up duplicates along the way
    const collectionNameById = fromPairs(allData.map(item => [item.collection_id, item.collection_name]));
    const collections = await Promise.all(toPairs(collectionNameById).map(async ([collectionId, name]) => {
      try {
        const cacheKey = `nftCollection:subscan:${chainId}:${collectionId}`;
        const cached = CACHE.get(cacheKey);
        if (cached) return cached;
        const {
          data
        } = await postSubscanWithRetry(`https://${subscanChainId}.api.subscan.io/api/scan/nfts/info`, JSON.stringify({
          collection_id: collectionId
        }), signal);
        const collection = collectionToNftCollection(chainId, collectionId, data);
        CACHE.set(cacheKey, collection);
        return collection;
      } catch (err) {
        signal.throwIfAborted();

        // fallback
        return collectionToNftCollection(chainId, collectionId, {
          collection_id: collectionId,
          data: "",
          owner: {
            address: "",
            people: {}
          },
          total_supply: 0,
          items: 0,
          is_destroyed: false,
          holders: 0,
          unique_id: "",
          attributes: {
            name
          },
          metadata: {}
        });
      }
    }));
    return {
      nfts,
      collections: collections.filter(Boolean)
    };
  } catch (err) {
    signal.throwIfAborted();
    log.error("Failed to fetch Polkadot account NFTs", {
      address,
      chainId,
      error: err
    });
    throw err;
  }
};
const getUpdatedAt = async (nft, subscanChainId, signal) => {
  try {
    const res = await postSubscanWithRetry(`https://${subscanChainId}.api.subscan.io/api/scan/nfts/activities`, JSON.stringify({
      item_id: nft.item_id,
      collection_id: nft.collection_id,
      row: 100,
      page: 0
    }), signal);
    const timestamps = res.data.list?.map(c => c.block_timestamp * 1000) ?? [];
    return timestamps.length ? Math.max(...timestamps) : null;
  } catch (err) {
    signal.throwIfAborted();
    log.error("Failed to fetch Polkadot NFT date", {
      nft,
      error: err
    });
    return null;
  }
};
const itemToOwnedNft = (chainId, nft, address, updatedAt) => ({
  id: `subscan:${chainId}:${nft.collection_id}:${nft.item_id}`,
  collectionId: `subscan:${chainId}:${nft.collection_id}`,
  contract: null,
  nftCollectionId: nft.collection_id,
  tokenId: nft.item_id,
  networkId: chainId,
  name: nft.metadata.name ?? "",
  description: nft.metadata.description,
  type: "Polkadot NFT",
  previewUrl: nft.metadata.thumbnail || nft.metadata.local_image || nft.metadata.image,
  imageUrl: nft.metadata.image,
  videoUrl: null,
  audioUrl: null,
  owner: address,
  amount: 1,
  marketplaceUrls: [`https://${NETWORKS[chainId]}.subscan.io/nft_item/${nft.collection_id}-${nft.item_id}`],
  traits: nft.metadata.attributes ? Object.fromEntries(nft.metadata.attributes.map(a => [a.trait_type, a.value]).filter(([key, value]) => !["name", "description"].includes(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"))) : null,
  price: null,
  updatedAt
});
const collectionToNftCollection = (chainId, collectionId, collection) => ({
  id: `subscan:${chainId}:${collectionId}`,
  name: collection.metadata.name ?? "",
  description: collection.metadata.description ?? "",
  iconUrl: collection.metadata.local_image ?? collection.metadata.image ?? collection.metadata.fallback_image ?? null,
  bannerUrl: collection.metadata.local_image ?? collection.metadata.image ?? collection.metadata.fallback_image ?? null,
  itemsCount: collection.items,
  ownersCount: collection.holders,
  marketplaceUrls: [`https://${NETWORKS[chainId]}.subscan.io/nft_collection/${collectionId}`, collection.metadata.external_url].filter(Boolean)
});

const ONE_MINUTE = 60 * 1000;
const UPDATE_INTERVAL = ONE_MINUTE; // leverage cache on endpoint

const fetchAccountNfts = async (account, signal) => {
  // some accounts may own both substrate and ethereum NFTs (ex: ethereum accounts that also own nfts on mythos)
  const results = await Promise.all([isAccountPlatformEthereum(account) ? fetchEvmAccountNfts(account.address, signal) : null, isAccountPlatformPolkadot(account) ? fetchDotAccountNfts(account, signal) : null].filter(isNotNil));
  return results.reduce((acc, curr) => {
    return {
      nfts: acc.nfts.concat(...curr.nfts),
      collections: acc.collections.concat(...curr.collections)
    };
  }, {
    nfts: [],
    collections: []
  });
};
const nfts$ = new Observable(subscriber => {
  log.log("Opening NFTs subscription");
  const nftsCountByAccount$ = nftsStore$.pipe(map(({
    nfts
  }) => nfts.reduce((acc, nft) => {
    if (!acc[nft.owner]) acc[nft.owner] = 0;
    acc[nft.owner]++;
    return acc;
  }, {})), first() // take only the first value to not retrigger sub if more nfts are added to the store
  );
  const updateData$ = combineLatest([keyringStore.accounts$, nftsCountByAccount$]).pipe(map(([allAccounts, nftsByAccount]) => allAccounts.filter(isAccountNotContact)
  // sort accounts by number of nfts so newly created accounts are prioritised
  .sort((a1, a2) => (nftsByAccount[a1.address] ?? 0) - (nftsByAccount[a2.address] ?? 0))
  // but prioritise evm accounts as they only need 1 request each
  .sort((a1, a2) => (isAccountPlatformEthereum(a2) ? 1 : 0) - (isAccountPlatformEthereum(a1) ? 1 : 0))), switchMap(accounts => combineLatest(accounts.map(account => getQuery$({
    namespace: "nfts",
    args: account,
    queryFn: (account, signal) => fetchAccountNfts(account, signal),
    refreshInterval: UPDATE_INTERVAL
  }).pipe(map(nftsData => ({
    address: account.address,
    nftsData
  })))))), map(accountsQueries => {
    const status = accountsQueries.some(aq => aq.nftsData.status === "error") ? "stale" : accountsQueries.every(aq => aq.nftsData.status === "loaded") ? "loaded" : "loading";
    const loadedAddresses = accountsQueries.filter(aq => aq.nftsData.status === "loaded").map(a => a.address);
    const loadedAccountsData = accountsQueries.reduce((acc, curr) => {
      if (curr.nftsData.status !== "loaded") return acc;
      acc.nfts.push(...curr.nftsData.data.nfts);
      acc.collections.push(...curr.nftsData.data.collections);
      return acc;
    }, {
      nfts: [],
      collections: []
    });
    return {
      status,
      loadedAddresses,
      ...loadedAccountsData
    };
  }), distinctUntilChanged(isEqual));
  const subUpdateStore = updateData$.subscribe(data => {
    updateNftsStore({
      addresses: data.loadedAddresses,
      nfts: data.nfts,
      collections: data.collections
    });
  });
  const subOutput = combineLatest([nftsStore$, updateData$]).pipe(map(([store, update]) => {
    const {
      collections,
      nfts,
      favoriteNftIds,
      hiddenNftCollectionIds
    } = store;
    return {
      status: update.status,
      collections,
      nfts: mergeAccountNfts(nfts),
      favoriteNftIds,
      hiddenNftCollectionIds
    };
  })).subscribe(subscriber);
  return () => {
    log.log("Closing NFTs subscription");
    subOutput.unsubscribe();
    subUpdateStore.unsubscribe();
  };
}).pipe(tap({
  subscribe: () => log.debug("[nfts] starting main subscription"),
  unsubscribe: () => log.debug("[nfts] stopping main subscription")
}), shareReplay({
  refCount: true,
  bufferSize: 1
}), keepAlive(3000));
const mergeAccountNfts = accountNfts => {
  const nfts = [];
  for (const accountNft of accountNfts) {
    const {
      owner,
      amount,
      ...rest
    } = accountNft;
    let nft = nfts.find(n => n.id === accountNft.id);
    if (!nft) {
      nft = {
        ...rest,
        owners: {}
      };
      nfts.push(nft);
    }
    nft.owners[owner] = amount;
  }
  return nfts;
};
const refreshNftMetadata = async id => {
  const store = await firstValueFrom(nftsStore$);
  const nft = store.nfts.find(nft => nft.id === id);
  if (!nft) return;
  if (nft.id.startsWith("subscan")) throw new Error("Polkadot NFTs cant be refreshed");
  return fetchEvmNftRefresh(id);
};

const handleSetHiddenNftCollection = request => {
  const {
    id,
    isHidden
  } = request;
  setHiddenNftCollection(id, isHidden);
  return true;
};
const handleSetFavoriteNft = request => {
  const {
    id,
    isFavorite
  } = request;
  setFavoriteNft(id, isFavorite);
  return true;
};
const handleRefreshNftMetadata = async request => {
  const {
    id
  } = request;
  await refreshNftMetadata(id);
  return true;
};

// TODO cooldown: change handle method arg list to an object so we can use type as discriminant and don't have to cast request & response
class NftsHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(nfts.subscribe)":
        return genericSubscription(id, port, nfts$);
      case "pri(nfts.collection.setHidden)":
        return handleSetHiddenNftCollection(request);
      case "pri(nfts.setFavorite)":
        return handleSetFavoriteNft(request);
      case "pri(nfts.refreshMetadata)":
        return handleRefreshNftMetadata(request);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class ConfirmedAddressesStore extends SubscribableStorageProvider {
  constructor() {
    super("confirmedAddresses", {});
  }
  async addConfirmedAddress(tokenId, address) {
    const normalized = normalizeAddress(address);
    await this.mutate(current => {
      const existingForToken = current[tokenId] ?? [];
      if (existingForToken.some(a => isAddressEqual(a, normalized))) {
        return current;
      }
      return {
        ...current,
        [tokenId]: [...existingForToken, normalized]
      };
    });
  }
}
const confirmedAddressesStore = new ConfirmedAddressesStore();
confirmedAddressesStore.observable;
const addConfirmedAddress = (tokenId, address) => confirmedAddressesStore.addConfirmedAddress(tokenId, address);

class SendFundsHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      case "pri(sendFunds.confirmedAddresses.subscribe)":
        return confirmedAddressesStore.subscribe(id, port);
      case "pri(sendFunds.confirmedAddresses.add)":
        {
          const {
            tokenId,
            address
          } = request;
          await addConfirmedAddress(tokenId, address);
          return true;
        }
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

// metadata may have been added manually to the store, for a chain that Talisman doesn't know about (not in chaindata)
// => use either chainId or genesisHash as identifier

/**
 *
 * @param chainIdOrHash chainId or genesisHash
 * @param specVersion specVersion of the metadata to be loaded (if not defined, will fetch latest)
 * @param blockHash if specVersion isn't specified, this is the blockHash where to fetch the correct metadata from (if not defined, will fetch latest)
 * @param signedExtensions signedExtensions from a transaction payload that has to be decoded or signed
 * @returns substrate type registry
 */
const getTypeRegistry = async (chainIdOrHash, specVersion, signedExtensions) => {
  const registry = new TypeRegistry();

  // TODO remove type override once chaindata-provider is fixed
  const chain = await (isHex(chainIdOrHash) ? chaindataProvider.getNetworkByGenesisHash(chainIdOrHash) : chaindataProvider.getNetworkById(chainIdOrHash, "polkadot"));

  // register typesBundle in registry for legacy (pre metadata v14) chains
  if (typesBundle.spec && chain?.specName && typesBundle.spec[chain.specName]) {
    const chainBundle = chain.chainName && typesBundle.chain?.[chain.chainName] ? {
      chain: {
        [chain.chainName]: typesBundle.chain[chain.chainName]
      }
    } : {};
    const specBundle = chain.specName && typesBundle.spec?.[chain.specName] ? {
      spec: {
        [chain.specName]: typesBundle.spec[chain.specName]
      }
    } : {};
    const legacyTypesBundle = {
      ...chainBundle,
      ...specBundle
    };
    if (legacyTypesBundle) {
      log.debug(`Setting known types for chain ${chain.id}`);
      registry.clearCache();
      registry.setKnownTypes({
        typesBundle: legacyTypesBundle
      });
      if (chain.chainName) {
        registry.register(getSpecTypes(registry, chain.chainName, chain.specName, chain.specVersion));
        registry.knownTypes.typesAlias = getSpecAlias(registry, chain.chainName, chain.specName);
      }
    }
  }
  if (chain?.registryTypes) registry.register(chain.registryTypes);
  const numSpecVersion = typeof specVersion === "string" ? hexToNumber$1(specVersion) : specVersion;
  const metadataDef = await getMetadataDef(chainIdOrHash, numSpecVersion);
  const metadataRpc = metadataDef ? getMetadataRpcFromDef(metadataDef) : undefined;
  if (metadataDef) {
    const metadataValue = getMetadataFromDef(metadataDef);
    if (metadataValue) {
      const metadata = new Metadata(registry, metadataValue);
      registry.setMetadata(metadata);
    }
    if (signedExtensions || metadataDef.userExtensions || chain?.signedExtensions) registry.setSignedExtensions(signedExtensions, {
      ...metadataDef.userExtensions,
      ...chain?.signedExtensions
    });
    if (!metadataDef.metadataRpc && metadataDef.types) registry.register(metadataDef.types);
  } else if (signedExtensions || chain?.signedExtensions) {
    registry.setSignedExtensions(signedExtensions, chain?.signedExtensions);
  }
  return {
    registry,
    metadataRpc
  };
};

/**
 * @name validateHexString
 * @description Checks if a string is a hex string. Required to account for type differences between different polkadot libraries
 * @param {string} str - string to check
 * @returns {HexString} - boolean
 * @example
 * validateHexString("0x1234") // "0x1234"
 * validateHexString("1234") // Error: Expected a hex string
 * validateHexString(1234) // Error: Expected a string
 **/
const validateHexString = str => {
  if (typeof str !== "string") {
    throw new Error("Expected a string");
  }
  if (str.startsWith("0x")) {
    return str;
  }
  throw new Error("Expected a hex string");
};

class SigningHandler extends ExtensionHandler {
  async signingApprove({
    id,
    payload: modifiedPayload
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      reject,
      request,
      resolve,
      url
    } = queued;
    const address = encodeAnyAddress(queued.account.address);
    const result = await withPjsKeyringPair(address, async pair => {
      const {
        payload: originalPayload
      } = request;
      const payload = modifiedPayload || originalPayload;
      const {
        ok,
        val: hostName
      } = getHostName(url);
      const analyticsProperties = {
        dapp: url,
        hostName: ok ? hostName : undefined
      };
      let registry = new TypeRegistry();
      if (isJsonPayload(payload)) {
        const {
          signedExtensions,
          specVersion
        } = payload;
        const genesisHash = validateHexString(payload.genesisHash);
        const {
          registry: fullRegistry
        } = await getTypeRegistry(genesisHash, specVersion, signedExtensions);
        registry = fullRegistry;
        const chain = await chaindataProvider.getNetworkByGenesisHash(genesisHash);
        analyticsProperties.chain = chain?.id ?? genesisHash;
      }
      let signature = undefined;
      let signedTransaction = undefined;

      // notify user about transaction progress
      if (isJsonPayload(payload)) {
        const chain = await chaindataProvider.getNetworkByGenesisHash(payload.genesisHash);

        // create signable extrinsic payload
        const extrinsicPayload = registry.createType("ExtrinsicPayload", payload, {
          version: payload.version
        });
        signature = typeof chain?.hasExtrinsicSignatureTypePrefix !== "boolean" ?
        // use default value of `withType`
        // (auto-detected by whether `ExtrinsicSignature` is an `Enum` or not in the chain metadata)
        extrinsicPayload.sign(pair).signature :
        // use override value of `withType` from chaindata
        u8aToHex(sign(registry, pair, extrinsicPayload.toU8a({
          method: true
        }), {
          // use chaindata override value of `withType`
          withType: chain.hasExtrinsicSignatureTypePrefix
        }));
        if (payload.withSignedTransaction) {
          try {
            const tx = registry.createType("Extrinsic", {
              method: payload.method
            }, {
              version: payload.version
            });

            // apply signature to the modified payload
            tx.addSignature(payload.address, signature, payload);
            signedTransaction = tx.toHex();
          } catch (cause) {
            const error = new Error(`Failed to create signedTransaction`, {
              cause
            });
            sentry.captureException(error, {
              extra: {
                chainId: chain?.id,
                chainName: chain?.name
              }
            });
            throw error;
          }
        }
        if (chain) {
          await watchSubstrateTransaction(chain, registry, payload, signature, {
            siteUrl: queued.url,
            notifications: true
          });
        } else if (!TEST) {
          // eslint-disable-next-line no-console
          console.warn("Unable to find chain for genesis hash, transaction will not be watched", payload.genesisHash);
        }
      } else {
        signature = request.sign(registry, pair).signature;
      }
      talismanAnalytics.captureDelayed(isJsonPayload(payload) ? "sign transaction approve" : "sign approve", {
        ...analyticsProperties,
        networkType: "substrate"
      });
      resolve({
        id,
        signature,
        signedTransaction
      });
    });
    if (!result.ok) {
      if (result.val === "Unauthorised") reject(new Error(result.val));else if (typeof result.val === "string") throw new Error(result.val);else throw result.val;
    }
    return true;
  }
  async signingApproveExternal({
    id,
    signature,
    payload: modifiedPayload
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      request,
      url,
      account
    } = queued;
    const {
      payload: originalPayload
    } = request;
    const payload = modifiedPayload || originalPayload;
    const {
      ok,
      val: hostName
    } = getHostName(url);
    const analyticsProperties = {
      dapp: url,
      hostName: ok ? hostName : undefined
    };
    let signedTransaction = undefined;
    if (isJsonPayload(payload)) {
      const genesisHash = validateHexString(payload.genesisHash);
      const chain = await chaindataProvider.getNetworkByGenesisHash(genesisHash);
      analyticsProperties.chain = chain?.id ?? payload.genesisHash;
      if (chain) {
        const {
          signedExtensions,
          specVersion
        } = payload;
        const genesisHash = validateHexString(payload.genesisHash);
        const {
          registry
        } = await getTypeRegistry(genesisHash, specVersion, signedExtensions);
        if (payload.withSignedTransaction) {
          const tx = registry.createType("Extrinsic", {
            method: payload.method
          }, {
            version: payload.version
          });

          // apply signature to the modified payload
          tx.addSignature(payload.address, signature, payload);
          signedTransaction = tx.toHex();
        }
        await watchSubstrateTransaction(chain, registry, payload, signature, {
          siteUrl: url,
          notifications: true
        });
      } else if (!TEST) {
        // eslint-disable-next-line no-console
        console.warn("Unable to find chain for genesis hash, transaction will not be watched", payload.genesisHash);
      }
    }
    queued.resolve({
      id,
      signature,
      signedTransaction
    });
    const hardwareType = account.type === "ledger-polkadot" ? "ledger" : account.type === "polkadot-vault" ? "qr" : undefined;
    talismanAnalytics.captureDelayed(isJsonPayload(payload) ? "sign transaction approve" : "sign approve", {
      ...analyticsProperties,
      networkType: "substrate",
      hardwareType
    });
    return true;
  }
  async signingCancel({
    id
  }) {
    /*
     * This method used for both Eth and Polkadot requests
     */
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    talismanAnalytics.captureDelayed("sign reject", {
      networkType: "substrate"
    });
    queued.reject(new Error("Cancelled"));
    return true;
  }
  async signingApproveSignet({
    id
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    assert(queued.account.type === "signet", "Invalid Signet account");
    assert(typeof queued.account.url === "string", "Invalid Signet account");
    const {
      request,
      url
    } = queued;
    const params = new URLSearchParams({
      id: queued.id,
      calldata: request.payload.method,
      account: queued.account.address,
      genesisHash: queued.account.genesisHash || "",
      dapp: url
    });

    // close popup so Signet signing page can be open in full screen normal browser
    // users will most likely stay on Signet anyway to review the pending tx
    // so the popup is not needed here and can be closed
    windowManager.popupClose();
    await chrome.tabs.create({
      url: `${addTrailingSlash(queued.account.url)}sign?${params.toString()}`,
      active: true
    });
    return true;
  }
  async handle(id, type, request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  port) {
    switch (type) {
      case "pri(signing.approveSign)":
        return await this.signingApprove(request);
      case "pri(signing.approveSign.hardware)":
        return await this.signingApproveExternal(request);
      case "pri(signing.approveSign.qr)":
        return await this.signingApproveExternal(request);
      case "pri(signing.cancel)":
        return this.signingCancel(request);
      case "pri(signing.approveSign.signet)":
        return this.signingApproveSignet(request);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class SitesAuthorisationHandler extends ExtensionHandler {
  async authorizedForget({
    id,
    type
  }) {
    await this.stores.sites.forgetSite(id, type);
    return true;
  }
  async disconnectAll({
    type
  }) {
    await this.stores.sites.disconnectAllSites(type);
    return true;
  }
  async forgetAll({
    type
  }) {
    await this.stores.sites.forgetAllSites(type);
    return true;
  }
  async authorizedUpdate({
    id,
    authorisedSite
  }) {
    // un-set connectAllSubstrate if the user modifies the addresses for a site
    const updateConnectAll = {};
    if ("addresses" in authorisedSite) updateConnectAll["connectAllSubstrate"] = undefined;
    await this.stores.sites.updateSite(id, {
      ...authorisedSite,
      ...updateConnectAll
    });
    talismanAnalytics.capture("authorised site update addresses", {
      url: id
    });
    return true;
  }
  authorizeApprove({
    id,
    addresses = []
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    talismanAnalytics.capture("authorised site approve", {
      url: queued.idStr,
      authType: queued.request.provider,
      withEthAccounts: queued.request.provider === "ethereum" ? undefined : addresses.some(isEthereumAddress$1)
    });
    const {
      resolve
    } = queued;
    resolve({
      addresses
    });
    return true;
  }
  authorizeReject({
    id
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");
    const {
      reject
    } = queued;
    talismanAnalytics.capture("authorised site reject", {
      url: queued.idStr,
      authType: queued.request.provider
    });
    reject(new Error("Rejected"));
    return true;
  }
  async authorizeApproveSolSignIn({
    id,
    result
  }) {
    const queued = requestStore.getRequest(id);
    assert(queued, "Unable to find request");

    // if this throws, front end will catch it and display an error
    // => all inputs must be validated here
    const {
      account,
      signature
    } = await getSolSignInSignature(result);

    // resolve handler cannot send error back to the frontend
    queued.resolve({
      account,
      message: result.message,
      signature
    });
    return true;
  }
  async handle(id, type, request, port) {
    switch (type) {
      // --------------------------------------------------------------------
      // authorized sites handlers ------------------------------------------
      // --------------------------------------------------------------------
      case "pri(sites.list)":
        return await this.stores.sites.get();
      case "pri(sites.byid)":
        return await this.stores.sites.get(id);
      case "pri(sites.subscribe)":
        return this.stores.sites.subscribe(id, port);
      case "pri(sites.byid.subscribe)":
        return this.stores.sites.subscribeById(id, port, request);
      case "pri(sites.forget)":
        return this.authorizedForget(request);
      case "pri(sites.update)":
        return this.authorizedUpdate(request);
      case "pri(sites.disconnect.all)":
        return this.disconnectAll(request);
      case "pri(sites.forget.all)":
        return this.forgetAll(request);

      // --------------------------------------------------------------------
      // authorised site requests handlers ----------------------------------
      // --------------------------------------------------------------------
      case "pri(sites.requests.approve)":
        return this.authorizeApprove(request);
      case "pri(sites.requests.reject)":
        return this.authorizeReject(request);
      case "pri(sites.requests.ignore)":
        return ignoreRequest(request);
      case "pri(sites.requests.approveSolSignIn)":
        return this.authorizeApproveSolSignIn(request);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
const getSolSignInSignature = async result => {
  const {
    address,
    message,
    signature
  } = result;
  const account = await keyringStore.getAccount(address);
  if (!account) throw new Error("Account not found");
  const signedMessage = new TextEncoder().encode(message);
  if (!signature) {
    const signResult = await withSecretKey(address, async secretKey => {
      return ed25519.sign(signedMessage, secretKey);
    });
    return {
      account,
      signature: base58.encode(signResult.unwrap())
    };
  }

  // verify that the signature supplied by the frontend is valid
  if (!ed25519.verify(base58.decode(signature), signedMessage, base58.decode(address))) throw new Error("Signature verification failed");
  return {
    account,
    signature
  };
};

const watchSolanaTransaction = async (networkId, transaction, options = {}) => {
  try {
    const {
      siteUrl,
      notifications,
      txInfo
    } = options;
    const network = await chaindataProvider.getNetworkById(networkId, "solana");
    if (!network) throw new Error(`Could not find ethereum network ${networkId}`);
    const connection = await chainConnectorSol.getConnection(networkId);
    if (!connection) throw new Error(`No connection for network ${networkId} (${network.name})`);
    const {
      signature
    } = parseTransactionInfo(transaction);
    if (!signature) throw new Error("Transaction does not have a signature");
    const blockExplorerUrls = getBlockExplorerUrls(network, {
      type: "transaction",
      id: signature
    });
    const txUrl = blockExplorerUrls[0] ?? chrome.runtime.getURL("dashboard.html#/tx-history");
    await addSolTransaction(networkId, transaction, {
      siteUrl,
      txInfo
    });
    watchUntilFinalized(connection, signature, network.name, notifications ? txUrl : undefined);
  } catch (err) {
    log.error("Failed to watch Solana transaction (outer)", {
      err,
      networkId,
      transaction
    });
    sentry.captureException(err, {
      tags: {
        networkId
      }
    });
  }
};
// Helper function to poll for transaction confirmation
async function watchUntilFinalized(connection, signature, networkName, notificationTxUrl, maxRetries = 30, intervalMs = 2000) {
  let txStatus = "pending";
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check if transaction is confirmed
      const status = await connection.getSignatureStatus(signature);
      const {
        confirmationStatus,
        err
      } = status?.value ?? {};

      // TODO ideally we should check that the current block height (which is not the slot) is still < lastValidBlockHeight
      // but that would be one additional RPC call per poll

      if (err) {
        txStatus = "error";
        await updateTransactionStatus(signature, txStatus);
        if (notificationTxUrl) await createNotification("error", networkName, notificationTxUrl);
        return; // we re done
      } else if (confirmationStatus === "confirmed" && txStatus !== "success") {
        txStatus = "success";
        const txDetails = await tryGetTransactionDetails(connection, signature);
        await updateTransactionStatus(signature, txStatus, txDetails?.slot);
        if (notificationTxUrl) await createNotification("success", networkName, notificationTxUrl);

        // continue polling until finalized
      } else if (confirmationStatus === "finalized") {
        const txDetails = await tryGetTransactionDetails(connection, signature);
        await updateTransactionStatus(signature, txStatus, txDetails?.slot, true);
        return; // we re done
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      if (i === maxRetries - 1) {
        await updateTransactionStatus(signature, "unknown");
        return;
      }
      // Continue polling on transient errors
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  // timeout
  await updateTransactionStatus(signature, "unknown");
}
const tryGetTransactionDetails = async (connection, signature) => {
  try {
    return await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });
  } catch (error) {
    log.error("Failed to get transaction details", {
      error,
      signature
    });
    return null;
  }
};

class SolanaExtensionHandler extends ExtensionHandler {
  async handle(id, type, request
  // port: Port,
  ) {
    switch (type) {
      // --------------------------------------------------------------------
      // substrate RPC handlers -----------------------------
      // --------------------------------------------------------------------
      case "pri(solana.rpc.send)":
        {
          const {
            networkId,
            request: req
          } = request;
          const connection = await chainConnectorSol.getConnection(networkId);
          return connection._rpcRequest(req.method, req.params);
        }
      case "pri(solana.rpc.submit)":
        {
          const {
            networkId,
            transaction,
            txInfo
          } = request;
          const tx = deserializeTransaction(transaction);
          const {
            address,
            signature
          } = parseTransactionInfo(tx);
          if (!address) throw new Error("Unknown signer");
          const account = await keyringStore.getAccount(address);
          if (!account) throw new Error("Account not found");
          const connection = await chainConnectorSol.getConnection(networkId);
          if (!signature) {
            await withSecretKey(account.address, async secretKey => {
              const keypair = getKeypair(secretKey);
              if (keypair.publicKey.toBase58() !== address) throw new Error("Address mismatch");
              if (isVersionedTransaction(tx)) tx.sign([keypair]);else tx.sign(keypair);
            });
          }
          const sig = await connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: true // as we use public nodes, preflighting signed transactions is not recommended
          });
          watchSolanaTransaction(networkId, tx, {
            txInfo,
            notifications: false
          });
          return {
            signature: sig
          };
        }
      case "pri(solana.sign.approve)":
        {
          const req = request;
          const signRequest = requestStore.getRequest(req.id);
          if (!signRequest) throw new Error("Request not found");
          const dappRequest = signRequest.request;
          switch (dappRequest.type) {
            case "message":
              {
                const {
                  signature
                } = request;
                if (signature) {
                  if (!ed25519.verify(base58.decode(signature), base58.decode(dappRequest.message), base58.decode(signRequest.account.address))) throw new Error("Signature verification failed");

                  // if signature is supplied, we assume it was signed with a hardware device
                  return signRequest.resolve({
                    type: "message",
                    signature
                  });
                }
                const signResult = await withSecretKey(signRequest.account.address, async secretKey => {
                  const payload = base58.decode(dappRequest.message);
                  return ed25519.sign(payload, secretKey);
                });
                return signRequest.resolve({
                  type: "message",
                  signature: base58.encode(signResult.unwrap())
                });
              }
            case "transaction":
              {
                const {
                  transaction,
                  networkId
                } = request;

                // if frontend sent a transaction, it might be already signed by ledger
                const tx = deserializeTransaction(transaction ?? dappRequest.transaction);
                const {
                  signature
                } = parseTransactionInfo(tx);
                if (!signature) {
                  await withSecretKey(signRequest.account.address, async secretKey => {
                    const keypair = getKeypair(secretKey);
                    if (isVersionedTransaction(tx)) tx.sign([keypair]);else tx.sign(keypair);
                  });
                }
                if (dappRequest.send) {
                  if (!networkId) throw new Error("Network ID is required for sending transactions");
                  const connection = await chainConnectorSol.getConnection(networkId);
                  await connection.sendRawTransaction(tx.serialize());
                }
                return signRequest.resolve({
                  type: "transaction",
                  transaction: base58.encode(tx.serialize()),
                  networkId
                });
              }
          }
        }
    }
    throw new Error(`Unable to handle message of type ${type}`);
  }
}

class SubHandler extends ExtensionHandler {
  submit = async ({
    payload,
    signature,
    txInfo
  }) => {
    const chain = await chaindataProvider.getNetworkByGenesisHash(payload.genesisHash);
    if (!chain) throw new Error(`Chain not found for genesis hash ${payload.genesisHash}`);
    const {
      registry
    } = await getTypeRegistry(payload.genesisHash, payload.specVersion, payload.signedExtensions);
    if (!signature) {
      const result = await withPjsKeyringPair(payload.address, async pair => {
        const extrinsicPayload = registry.createType("ExtrinsicPayload", payload, {
          version: payload.version
        });

        // LAOS signing bug workaround
        return typeof chain?.hasExtrinsicSignatureTypePrefix !== "boolean" ?
        // use default value of `withType`
        // (auto-detected by whether `ExtrinsicSignature` is an `Enum` or not in the chain metadata)
        extrinsicPayload.sign(pair).signature :
        // use override value of `withType` from chaindata
        u8aToHex(sign(registry, pair, extrinsicPayload.toU8a({
          method: true
        }), {
          // use chaindata override value of `withType`
          withType: chain.hasExtrinsicSignatureTypePrefix
        }));
      });
      signature = result.unwrap();
    }
    await watchSubstrateTransaction(chain, registry, payload, signature, {
      txInfo
    });
    const tx = registry.createType("Extrinsic", {
      method: payload.method
    }, {
      version: payload.version
    });

    // apply signature to the modified payload
    tx.addSignature(payload.address, signature, payload);
    const hash = tx.hash.toHex();
    try {
      await chainConnector.send(chain.id, "author_submitExtrinsic", [tx.toHex()]);
    } catch (err) {
      if (hash) dismissTransaction(hash);
      throw err;
    }
    return {
      hash
    };
  };
  submitWithBittensorMevShield = async ({
    payload,
    txInfo
  }) => {
    const chain = await chaindataProvider.getNetworkByGenesisHash(payload.genesisHash);
    if (!chain) throw new Error(`Chain not found for genesis hash ${payload.genesisHash}`);
    const {
      registry,
      metadataRpc
    } = await getTypeRegistry(payload.genesisHash, payload.specVersion, payload.signedExtensions);
    if (!metadataRpc) throw new Error("Metadata RPC not found");

    // increment nonce of the inner payload as it will be executed after the wrapper transaction
    const innerPayload = {
      ...payload,
      nonce: toPjsHex(BigInt(payload.nonce) + 1n)
    };
    const innerTxSignature = await withPjsKeyringPair(payload.address, async pair => {
      const extrinsicPayload = registry.createType("ExtrinsicPayload", innerPayload);
      return extrinsicPayload.sign(pair).signature;
    });
    const signatureInner = innerTxSignature.unwrap();
    const innerTx = registry.createType("Extrinsic", {
      method: innerPayload.method
    }, {
      version: innerPayload.version
    });

    // apply signature to the modified payload
    innerTx.addSignature(payload.address, signatureInner, innerPayload);
    const signedInnerHash = innerTx.hash.toHex();

    // fetch MevShield next key from chain storage
    const {
      builder
    } = parseMetadataRpc(metadataRpc);
    const storageCodec = builder.buildStorage("MevShield", "NextKey");
    const stateKey = storageCodec.keys.enc();
    const hexValue = await chainConnector.send(chain.id, "state_getStorage", [stateKey], false);
    if (!hexValue) throw new Error("MevShield NextKey not found");
    const nextKeyBinary = storageCodec.value.dec(hexValue);

    // encrypt the inner tx with next mev shield key
    const ciphertextBytes = await encryptKemAead(nextKeyBinary.asBytes(), innerTx.toU8a());

    // the hash of the inner tx must also be supplied in the outer encrypted call
    const commitment = blake2b256(innerTx.toU8a());

    // craft the encrypted call
    const {
      codec,
      location
    } = builder.buildCall("MevShield", "submit_encrypted");
    const args = {
      commitment: new FixedSizeBinary(commitment),
      ciphertext: new Binary(ciphertextBytes)
    };
    const method = Binary.fromBytes(mergeUint8([new Uint8Array(location), codec.enc(args)]));
    const outerPayload = {
      ...payload,
      method: method.asHex(),
      mode: 0,
      metadataHash: undefined
    };

    // sign the outer tx payload
    const outerTxSignature = await withPjsKeyringPair(payload.address, async pair => {
      const extrinsicPayload = registry.createType("ExtrinsicPayload", outerPayload);
      return extrinsicPayload.sign(pair).signature;
    });
    const signatureOuter = outerTxSignature.unwrap();
    const outerTx = registry.createType("Extrinsic", {
      method: outerPayload.method
    }, {
      version: outerPayload.version
    });

    // apply signature to the modified payload
    outerTx.addSignature(payload.address, signatureOuter, outerPayload);
    const signedOuterHash = outerTx.hash.toHex();

    // watch execution of both transactions (both should appear in tx history)
    await watchSubstrateTransaction(chain, registry, outerPayload, signatureOuter, {
      txInfo
    });
    await watchSubstrateTransaction(chain, registry, innerPayload, signatureInner, {
      txInfo
    });
    try {
      // submit only outer tx
      await chainConnector.send(chain.id, "author_submitExtrinsic", [outerTx.toHex()]);
    } catch (err) {
      if (signedInnerHash) dismissTransaction(signedInnerHash);
      if (signedOuterHash) dismissTransaction(signedOuterHash);
      throw err;
    }
    return {
      hash: signedOuterHash
    };
  };
  send = ({
    chainId,
    method,
    params,
    isCacheable
  }) => {
    return chainConnector.send(chainId, method, params, isCacheable);
  };
  metadata = ({
    genesisHash,
    specVersion
  }) => {
    return getMetadataDef(genesisHash, specVersion);
  };
  async handle(id, type, request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  port) {
    switch (type) {
      // --------------------------------------------------------------------
      // substrate RPC handlers -----------------------------
      // --------------------------------------------------------------------
      case "pri(substrate.rpc.send)":
        return this.send(request);
      case "pri(substrate.rpc.submit)":
        return this.submit(request);
      case "pri(substrate.rpc.submit.withBittensorMevShield)":
        return this.submitWithBittensorMevShield(request);

      // --------------------------------------------------------------------
      // substrate chain metadata -----------------------------
      // --------------------------------------------------------------------
      case "pri(substrate.metadata.get)":
        return this.metadata(request);
    }
    throw new Error(`Unable to handle message of type ${type} (substrate)`);
  }
}
const toPjsHex = (value, minByteLen) => {
  let inner = value.toString(16);
  inner = (inner.length % 2 ? "0" : "") + inner;
  const nPaddedBytes = Math.max(0, (0) - inner.length / 2);
  return "0x" + "00".repeat(nPaddedBytes) + inner;
};

class TokenRatesHandler extends ExtensionHandler {
  async handle(id, type, request, port) {
    switch (type) {
      // --------------------------------------------------------------------
      // tokenRates handlers ------------------------------------------------
      // --------------------------------------------------------------------
      case "pri(tokenRates.subscribe)":
        return this.stores.tokenRates.subscribe(id, port);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

class Extension extends ExtensionHandler {
  #routes = {};
  #autoLockMinutes = 0;
  constructor(stores) {
    super(stores);

    // routing to sub-handlers
    this.#routes = {
      accounts: new AccountsHandler(stores),
      chains: new ChainsHandler(stores),
      chaindata: new ChaindataHandler(stores),
      app: new AppHandler(stores),
      balances: new BalancesHandler(stores),
      defi: new DefiHandler(stores),
      encrypt: new EncryptHandler(stores),
      eth: new EthHandler(stores),
      metadata: new MetadataHandler(stores),
      mnemonics: new MnemonicHandler(stores),
      signing: new SigningHandler(stores),
      sites: new SitesAuthorisationHandler(stores),
      tokenRates: new TokenRatesHandler(stores),
      substrate: new SubHandler(stores),
      solana: new SolanaExtensionHandler(stores),
      assetDiscovery: new AssetDiscoveryHandler(stores),
      nfts: new NftsHandler(stores),
      bittensor: new BittensorHandler(stores),
      sendFunds: new SendFundsHandler(stores)
    };

    // connect auto lock timeout setting to the password store
    this.stores.settings.observable.subscribe(({
      autoLockMinutes
    }) => {
      this.#autoLockMinutes = autoLockMinutes;
      stores.password.resetAutolockTimer(autoLockMinutes);
    });

    // reset the databaseUnavailable and databaseQuotaExceeded flags on start-up
    this.stores.errors.set({
      databaseUnavailable: false,
      databaseQuotaExceeded: false
    });

    // prune old db error logs
    const now = Date.now();
    const pruneLogFilter = timestamp => now - timestamp <= 1_209_600_000; // 14 days in milliseconds
    this.stores.errors.mutate(store => {
      store.StartupLog.push(now);
      store.StartupLog = store.StartupLog.filter(pruneLogFilter);
      store.DexieAbortLog = store.DexieAbortLog.filter(pruneLogFilter);
      store.DexieDatabaseClosedLog = store.DexieDatabaseClosedLog.filter(pruneLogFilter);
      store.DexieQuotaExceededLog = store.DexieQuotaExceededLog.filter(pruneLogFilter);
      return store;
    });
    keyringStore.accounts$.subscribe(async accounts => {
      const sites = await stores.sites.get();
      Object.entries(sites).filter(([, site]) => site.connectAllSubstrate).forEach(async ([url, autoAddSite]) => {
        const existingAddresses = autoAddSite.addresses || [];
        const newAddresses = accounts.filter(acc => isTalismanHostname(autoAddSite.url) || isAccountOwned(acc)).filter(({
          address
        }) => !existingAddresses.includes(address)).map(({
          address
        }) => address);
        autoAddSite.addresses = [...existingAddresses, ...newAddresses];
        await stores.sites.updateSite(url, autoAddSite);
      });
    });
    this.initDb();
    this.cleanup();

    // fetch config from github periodically
    this.stores.remoteConfig.init();

    // hides the get started component has soon as the wallet owns funds
    hideGetStartedOnceFunded();

    // if BUILD is not "dev", submit a "wallet upgraded" event to posthog
    if (process.env.BUILD !== "dev") {
      (async () => {
        // don't send "wallet upgraded" event if analytics is disabled, or wallet is not onboarded
        const allowTracking = await this.stores.settings.get("useAnalyticsTracking");
        const onboarded = await this.stores.app.getIsOnboarded();
        if (!allowTracking || !onboarded || IS_FIREFOX) return;
        const lastWalletUpgradedEvent = await this.stores.app.get("lastWalletUpgradedEvent");

        // short circuit if we've already sent a "wallet upgraded" event for this version
        if (lastWalletUpgradedEvent === process.env.VERSION) return;

        // make sure we create a new report for this version of the wallet, not re-use one we created last version
        await this.stores.app.delete(["analyticsReportCreatedAt", "analyticsReport"]);
        await spawnTaskToCreateNewReport({
          // don't refresh balances in the background, just send the existing db cache
          refreshBalances: false,
          // the primary purpose of the "wallet upgraded" event is to submit the opt-in general report.
          // `waitForReportCreated: true` lets us wait for the report to be created before we submit the event.
          waitForReportCreated: true
        });
        await talismanAnalytics.capture("wallet upgraded");
        await this.stores.app.set({
          lastWalletUpgradedEvent: process.env.VERSION
        });
      })();
    }
  }
  cleanup() {
    // remove legacy entries from localStorage
    return chrome.storage.local.remove(["chains", "ethereumNetworks", "tokens", "balances", "metadata", "transactions"]);
  }
  initDb() {
    // Forces database migrations to run on first start up
    // By accessing db.metadata we can be sure that dexie will:
    //   1. open a connection to the database
    //   2. (if required) run any new db migrations
    //   3. close the database connection only when it is no longer required
    //      (or re-use the connection when it's being accessed elsewhere in our code!)
    db.metadata.toArray();
    db.on("ready", async () => {
      // TODO: Add back this migration logic to delete old data from localStorage/old idb-managed db
      // (We don't store metadata OR chains in here anymore, so we have no idea whether or not its has already been initialised)
      // // if store has no chains yet, consider it's a fresh install or legacy version
      // if ((await db.chains.count()) < 1) {
      //
      //   // delete old idb-managed metadata+metadataRpc db
      //   indexedDB.deleteDatabase("talisman")
      //
      //   // TODO: Add this back again, but as an internal part of the @talismn/chaindata-provider lib
      //   // // initial data provisioning (workaround to wallet beeing installed when subsquid is down)
      // }
    });

    // marks all pending transaction as status unknown
    updateTransactionsRestart();
  }
  async handle(id, type, request, port) {
    // --------------------------------------------------------------------
    // First try to unsubscribe                          ------------------
    // --------------------------------------------------------------------
    if (type === "pri(unsubscribe)") {
      const {
        id: unsubscribeId
      } = request;
      unsubscribe(unsubscribeId);
      return null;
    }
    // --------------------------------------------------------------------
    // Then try known sub-handlers based on prefix of message ------------
    // --------------------------------------------------------------------
    try {
      const routeKey = type.split("pri(")[1].split(".")[0];
      const subhandler = this.#routes[routeKey];
      if (subhandler) return subhandler.handle(id, type, request, port);
    } catch (e) {
      throw new Error(`Unable to handle message of type ${type}`);
    }

    // --------------------------------------------------------------------
    // Then try remaining which are present in this class
    // --------------------------------------------------------------------
    switch (type) {
      // Ensures that the background script remains open when the UI is also open (especially on firefox)
      case "pri(keepalive)":
        return true;

      // Keeps the wallet unlocked for N (user-definable) minutes after the last user interaction
      case "pri(keepunlocked)":
        // Restart the autolock timer when the user interacts with the wallet UI
        this.stores.password.resetAutolockTimer(this.#autoLockMinutes);
        return true;
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

// Stores that expose the .get method

const tabStores = {
  app: appStore,
  errors: errorsStore,
  settings: settingsStore,
  sites: sitesAuthorisedStore,
  tokenRates: tokenRatesStore,
  remoteConfig: remoteConfigStore
};
const extensionStores = {
  ...tabStores,
  accountsCatalog: accountsCatalogStore,
  password: passwordStore
};

const requestEncrypt = (url, payload, account, port) => {
  return requestStore.createRequest({
    url,
    type: ENCRYPT_ENCRYPT_PREFIX,
    request: {
      payload
    },
    account
  }, port);
};
const requestDecrypt = (url, payload, account, port) => {
  return requestStore.createRequest({
    url,
    type: ENCRYPT_DECRYPT_PREFIX,
    request: {
      payload
    },
    account
  }, port);
};

const requestInjectMetadata = async (url, request, port) => {
  await requestStore.createRequest({
    type: METADATA_PREFIX,
    url,
    request
  }, port);
  return true;
};

class SolanaTabsHandler extends TabsHandler {
  async handle(id, type, request, port, url) {
    switch (type) {
      case "pub(solana.provider.subscribe)":
        {
          return handleSolanaSubscribe(id, url, port);
        }
      case "pub(solana.provider.signIn)":
        {
          return requestSolanaSignIn(request, url, port);
        }
      case "pub(solana.provider.connect)":
        {
          return handleSolanaConnect(request, url, port);
        }
      case "pub(solana.provider.disconnect)":
        {
          return handleSolanaDisconnect(request, url);
        }
      case "pub(solana.provider.signMessage)":
        {
          return handleSolanaSignMessage(request, url, port);
        }
      case "pub(solana.provider.signTransaction)":
        {
          return handleSolanaSignTransaction(request, url, port);
        }
    }
    throw new Error(`Unable to handle message of type ${type}`);
  }
}
const handleSolanaConnect = async (request, url, port) => {
  const site = await sitesAuthorisedStore.getSiteFromUrl(url);

  // onlyIfTrusted is used for dapps that want to auto-reconnect after first connection
  // if that flag is set, then it should not trigger an authorisation request

  if (!request.onlyIfTrusted) if (!site?.solAddresses?.length || !(await keyringStore.getAccount(site.solAddresses[0]))) {
    await requestAuthoriseSite(url, {
      origin: "",
      provider: "solana"
    }, port);
  }
  const updatedSite = await sitesAuthorisedStore.getSiteFromUrl(url);
  if (!updatedSite?.solAddresses?.length) throw new Error("Unauthorized");
  const account = await keyringStore.getAccount(updatedSite.solAddresses[0]);
  if (account && isSolanaAddress(account.address)) return {
    account: {
      address: account.address,
      label: account.name,
      icon: getTalismanOrbDataUrl(account.address)
    }
  };
  throw new Error("Unauthorized");
};
const handleSolanaDisconnect = async (request, url) => {
  const site = await sitesAuthorisedStore.getSiteFromUrl(url);
  if (site?.solAddresses?.length) sitesAuthorisedStore.updateSite(site.id, {
    solAddresses: []
  });
};
const handleSolanaSignMessage = async ({
  address,
  message
}, url, port) => {
  const site = await sitesAuthorisedStore.getSiteFromUrl(url);
  if (!site?.solAddresses?.includes(address)) throw new Error("Unauthorized");
  const account = await keyringStore.getAccount(address);
  if (!account) throw new Error("Account not found");
  const request = {
    type: "message",
    message
  };
  const result = await signSolana(url, port, account, request);
  if (result.type !== "message") throw new Error("Unexpected response type from Solana sign request");
  return {
    signature: result.signature
  };
};
const handleSolanaSignTransaction = async ({
  send,
  transaction,
  chain,
  options
}, url, port) => {
  log.debug("handleSolanaSignTransaction", {
    url,
    port,
    transaction,
    chain,
    options
  });
  const site = await sitesAuthorisedStore.getSiteFromUrl(url);
  const tx = deserializeTransaction(transaction);
  const {
    address = site.solAddresses?.[0]
  } = parseTransactionInfo(tx);
  if (!address || !site?.solAddresses?.includes(address)) throw new Error("Unauthorized");
  const account = await keyringStore.getAccount(address);
  if (!account) throw new Error("Account not found");
  const request = {
    type: "transaction",
    transaction,
    send
  };
  const result = await signSolana(url, port, account, request);
  if (result.type !== "transaction") throw new Error("Unexpected response type from Solana sign request");
  if (result.networkId) watchSolanaTransaction(result.networkId, deserializeTransaction(result.transaction), {
    siteUrl: url,
    notifications: true
  });
  return {
    transaction: result.transaction
  };
};
const handleSolanaSubscribe = async (id, url, port) => {
  const resSiteId = urlToDomain(url);
  const siteId = resSiteId.unwrap();
  let prevAccount = null;
  const sub = getAuthorizedSolanaAccount$(siteId).subscribe(account => {
    // event to send to the tab
    const ev = (() => {
      if (account) {
        return prevAccount ? {
          type: "accountChanged",
          account
        } : {
          type: "connect",
          account
        };
      } else if (prevAccount) {
        return {
          type: "disconnect"
        };
      } else return null;
    })();
    prevAccount = account;
    if (ev) {
      try {
        port.postMessage({
          id,
          subscription: ev
        });
      } catch (err) {
        log.error("Error in SolanaTabsHandler subscription", err);
        return sub.unsubscribe();
      }
    }
  });
  return true;
};
const getAuthorizedSolanaAccount$ = siteId => {
  return sitesAuthorisedStore.observable.pipe(map(sites => sites[siteId]), distinctUntilChanged(isEqual), map(site => site?.solAddresses?.[0]), distinctUntilChanged(isEqual), switchMap(address => address ? keyringStore.getAccount(address) : of(null)), map(account => account ? {
    address: account.address,
    label: account.name,
    icon: getTalismanOrbDataUrl(account.address)
  } : null), distinctUntilChanged(isEqual));
};

class TalismanRpcHandler extends TabsHandler {
  #talismanByGenesisHashSubscriptions = new Map();
  async rpcTalismanByGenesisHashSend(request) {
    const {
      genesisHash,
      method,
      params
    } = request;
    const chain = await chaindataProvider.getNetworkByGenesisHash(genesisHash);
    assert$1(chain, `Chain with genesisHash '${genesisHash}' not found`);
    return await chainConnector.send(chain.id, method, params);
  }
  async rpcTalismanByGenesisHashSubscribe(request, id, port) {
    const subscriptionId = `${port.name}-${id}`;
    const {
      genesisHash,
      subscribeMethod,
      responseMethod,
      params,
      timeout
    } = request;
    const chain = await chaindataProvider.getNetworkByGenesisHash(genesisHash);
    assert$1(chain, `Chain with genesisHash '${genesisHash}' not found`);
    const unsubscribe = await chainConnector.subscribe(chain.id, subscribeMethod, responseMethod, params, (error, data) => {
      try {
        port.postMessage({
          id,
          subscription: {
            error,
            data
          }
        });
      } catch (error) {
        // end subscription when port no longer exists
        //
        // unfortunately, we won't know what unsubscribe method to call on the rpc itself
        // so we'll continue to receive updates from the rpc until it's also disconnected
        //
        // but we can at least stop trying to send those updates down to the disconnected port
        //
        // this is a design limitation due to the `ProviderInterface` which we must support
        // in order to use ChainConnector with ApiPromise from the @polkadot/api package
        // this interface doesn't provide the unsubscribeMethod for a subscription until
        // later when the consumer is preparing to unsubscribe
        unsubscribe("");
      }
    }, timeout);
    this.#talismanByGenesisHashSubscriptions.set(subscriptionId, unsubscribe);
    port.onDisconnect.addListener(() =>
    // end subscription when port closes
    this.rpcTalismanByGenesisHashUnsubscribe({
      subscriptionId,
      unsubscribeMethod: ""
    }));
    return subscriptionId;
  }
  async rpcTalismanByGenesisHashUnsubscribe(request) {
    const {
      subscriptionId,
      unsubscribeMethod
    } = request;
    if (!this.#talismanByGenesisHashSubscriptions.has(subscriptionId)) return false;
    const unsubscribe = this.#talismanByGenesisHashSubscriptions.get(subscriptionId);
    this.#talismanByGenesisHashSubscriptions.delete(subscriptionId);
    unsubscribe && unsubscribe(unsubscribeMethod);
    return true;
  }
  async handle(id, type, request, port,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  url) {
    switch (type) {
      case "pub(talisman.rpc.byGenesisHash.send)":
        return this.rpcTalismanByGenesisHashSend(request);
      case "pub(talisman.rpc.byGenesisHash.subscribe)":
        return this.rpcTalismanByGenesisHashSubscribe(request, id, port);
      case "pub(talisman.rpc.byGenesisHash.unsubscribe)":
        return this.rpcTalismanByGenesisHashUnsubscribe(request);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

/**
 * Disabled all these messages for now by throwing an error, verified it doesn't break portal
 */
class TalismanHandler extends TabsHandler {
  #subHandlers;
  constructor(stores) {
    super(stores);
    this.#subHandlers = [new TalismanRpcHandler(stores)];
  }
  async handle(id, type, request, port, url) {
    // these methods are pub() because they're exposed to dapps,
    // BUT they're actually only exposed to dapps where isTalismanHostname is true
    // which is only app.talisman.xyz in production, and also localhost in dev
    if (!isTalismanUrl(url)) throw new Error(`Origin not allowed for message type ${type}`);
    switch (type) {
      case "pub(talisman.customSubstrateChains.subscribe)":
        {
          throw new Error("Not implemented");
        }
      case "pub(talisman.customSubstrateChains.unsubscribe)":
        {
          throw new Error("Not implemented");
        }
      case "pub(talisman.customEvmNetworks.subscribe)":
        {
          throw new Error("Not implemented");
        }
      case "pub(talisman.customEvmNetworks.unsubscribe)":
        {
          throw new Error("Not implemented");
        }
      case "pub(talisman.customTokens.subscribe)":
        {
          throw new Error("Not implemented");
        }
      case "pub(talisman.customTokens.unsubscribe)":
        {
          throw new Error("Not implemented");
        }
      case "pub(talisman.extension.openPortfolio)":
        {
          await windowManager.openDashboard({
            route: "/portfolio"
          });
          return true;
        }
      default:
        for (const handler of this.#subHandlers) {
          try {
            return handler.handle(id, type, request, port, url);
          } catch {
            continue;
          }
        }
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

// Copyright 2019-2021 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0
// Adapted from https://github.com/polkadot-js/extension/packages/extension-base/src/background/handlers/State.ts


// List of providers passed into constructor. This is the list of providers
// exposed by the extension.

class RpcState {
  // Map of providers currently injected in tabs
  #injectedProviders = new Map();
  // Map of all providers exposed by the extension, they are retrievable by key
  #providers;
  constructor(providers = {}) {
    this.#providers = providers;
  }

  // List all providers the extension is exposing
  rpcListProviders() {
    return Promise.resolve(Object.keys(this.#providers).reduce((acc, key) => {
      acc[key] = this.#providers[key].meta;
      return acc;
    }, {}));
  }
  rpcSend(request, port) {
    const provider = this.#injectedProviders.get(port);
    assert(provider, "Cannot call pub(rpc.subscribe) before provider is set");
    return provider.send(request.method, request.params);
  }

  // Start a provider, return its meta
  rpcStartProvider(key, port) {
    assert(Object.keys(this.#providers).includes(key), `Provider ${key} is not exposed by extension`);
    if (this.#injectedProviders.get(port)) {
      return Promise.resolve(this.#providers[key].meta);
    }

    // Instantiate the provider
    this.#injectedProviders.set(port, this.#providers[key].start());

    // Close provider connection when page is closed
    port.onDisconnect.addListener(() => {
      const provider = this.#injectedProviders.get(port);
      if (provider) {
        provider.disconnect().catch(sentry.captureException);
      }
      this.#injectedProviders.delete(port);
    });
    return Promise.resolve(this.#providers[key].meta);
  }
  rpcSubscribe({
    method,
    params,
    type
  }, cb, port) {
    const provider = this.#injectedProviders.get(port);
    assert(provider, "Cannot call pub(rpc.subscribe) before provider is set");
    return provider.subscribe(type, method, params, cb);
  }
  rpcSubscribeConnected(_request, cb, port) {
    const provider = this.#injectedProviders.get(port);
    assert(provider, "Cannot call pub(rpc.subscribeConnected) before provider is set");
    cb(null, provider.isConnected); // Immediately send back current isConnected
    provider.on("connected", () => cb(null, true));
    provider.on("disconnected", () => cb(null, false));
  }
  rpcUnsubscribe(request, port) {
    const provider = this.#injectedProviders.get(port);
    assert(provider, "Cannot call pub(rpc.unsubscribe) before provider is set");
    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }
}

class Tabs extends TabsHandler {
  #rpcState = new RpcState();
  #routes = {};
  constructor(stores) {
    super(stores);

    // routing to sub-handlers
    this.#routes = {
      eth: new EthTabsHandler(stores),
      solana: new SolanaTabsHandler(stores),
      // TODO rename eth => ethereum (requires changing prefix in all requests)
      talisman: new TalismanHandler(stores)
    };
  }
  async authorize(url, request, port) {
    let siteFromUrl;
    try {
      siteFromUrl = await this.stores.sites.getSiteFromUrl(url);
    } catch (error) {
      // means that the url is not valid
      log.error(error);
      return false;
    }
    // site may exist if created during a connection with EVM API
    if (siteFromUrl?.addresses) {
      // this url was seen in the past
      assert(siteFromUrl.addresses?.length, `No Talisman wallet accounts are authorised to connect to ${url}`);
      return false;
    }
    try {
      await requestAuthoriseSite(url, request, port);
    } catch (err) {
      log.error(err);
      return false;
    }
    return true;
  }
  async #getFilteredAccounts(site, {
    anyType
  }, developerMode) {
    return getPublicAccounts(await keyringStore.getAccounts(), filterAccountsByAddresses(site.addresses, anyType), {
      developerMode,
      includePortalOnlyInfo: isTalismanUrl(site.url)
    });
  }
  async accountsList(url, request) {
    let site;
    try {
      site = await this.stores.sites.getSiteFromUrl(url);
    } catch (error) {
      // means url is not a valid one
      return [];
    }
    const {
      addresses
    } = site;
    if (!addresses || addresses.length === 0) return [];
    const developerMode = await this.stores.settings.get("developerMode");
    return this.#getFilteredAccounts(site, request, developerMode);
  }
  accountsSubscribe(url, id, port) {
    return genericAsyncSubscription(id, port, combineLatest([this.stores.sites.observable, this.stores.settings.observable]), async ([sites, settings]) => {
      const {
        val: siteId,
        ok
      } = urlToDomain(url);
      if (!ok) return [];
      const site = sites[siteId];
      if (!site || !site.addresses) return [];
      return await this.#getFilteredAccounts(site, {
        anyType: true
      }, settings.developerMode);
    });
  }
  async bytesSign(url, request, port) {
    const address = request.address;
    const account = await keyringStore.getAccount(address);
    if (!account) throw new Error("Account not found");
    return signSubstrate(url, new RequestBytesSign(request), account, port);
  }
  async extrinsicSign(url, request, port) {
    const address = request.address;
    const account = await keyringStore.getAccount(address);
    if (!account) throw new Error("Account not found");
    return signSubstrate(url, new RequestExtrinsicSign(request), account, port);
  }
  async messageEncrypt(url, request, port) {
    const account = await keyringStore.getAccount(request.address);
    if (!account) throw new Error("Account not found");
    return requestEncrypt(url, request, account, port);
  }
  async messageDecrypt(url, request, port) {
    const account = await keyringStore.getAccount(request.address);
    if (!account) throw new Error("Account not found");
    return requestDecrypt(url, request, account, port);
  }
  metadataProvide(url, request, port) {
    return requestInjectMetadata(url, request, port);
  }
  async metadataList() {
    // this is called by dapps to determine whether they should force the wallet to update metadata before submitting a tx (we can't know on which chain up front)
    // we dont want this metadata as it's not the full one, so it's an UX overhead we want to avoid
    // => return the spec version of all chains for which we know how to connect, plus the ones for which we have the metadata in db
    const [chains, metadata] = await Promise.all([chaindataProvider.getNetworks("polkadot"), db.metadata.toArray()]);
    const dicSpecVersions = [...chains.filter(({
      rpcs
    }) => rpcs?.length), ...metadata].reduce((acc, {
      genesisHash,
      specVersion
    }) => {
      if (genesisHash && specVersion) acc[genesisHash] = Math.max(acc[genesisHash] ?? 0, Number(specVersion));
      return acc;
    }, {});
    return Object.entries(dicSpecVersions).map(([genesisHash, specVersion]) => ({
      genesisHash,
      specVersion
    }));
  }
  rpcListProviders() {
    return this.#rpcState.rpcListProviders();
  }
  rpcSend(request, port) {
    return this.#rpcState.rpcSend(request, port);
  }
  rpcStartProvider(key, port) {
    return this.#rpcState.rpcStartProvider(key, port);
  }
  async rpcSubscribe(request, id, port) {
    const innerCb = createSubscription(id, port);
    const cb = (_error, data) => innerCb(data);
    const subscriptionId = await this.#rpcState.rpcSubscribe(request, cb, port);
    port.onDisconnect.addListener(() => {
      unsubscribe(id);
      this.rpcUnsubscribe({
        ...request,
        subscriptionId
      }, port).catch(sentry.captureException);
    });
    return true;
  }
  rpcSubscribeConnected(request, id, port) {
    const innerCb = createSubscription(id, port);
    const cb = (_error, data) => innerCb(data);
    this.#rpcState.rpcSubscribeConnected(request, cb, port);
    port.onDisconnect.addListener(() => {
      unsubscribe(id);
    });
    return Promise.resolve(true);
  }
  rpcUnsubscribe(request, port) {
    return this.#rpcState.rpcUnsubscribe(request, port);
  }
  redirectPhishingLanding(phishingWebsite) {
    const nonFragment = phishingWebsite.split("#")[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.runtime.getURL("dashboard.html")}#${PHISHING_PAGE_REDIRECT}/${encodedWebsite}`;
    chrome.tabs.query({
      url: nonFragment
    }).then(tabs => {
      tabs.map(({
        id
      }) => id).filter(id => isNumber(id)).forEach(id => chrome.tabs.update(id, {
        url
      }).catch(err => {
        // eslint-disable-next-line no-console
        console.error("Failed to redirect tab to phishing page", {
          err
        });
        sentry.captureException(err, {
          extra: {
            url
          }
        });
      }));
    });
  }
  async redirectIfPhishing(url) {
    const isInDenyList = await protector.isPhishingSite(url);
    if (isInDenyList) {
      sentry.captureEvent({
        message: "Redirect from phishing site",
        extra: {
          url
        }
      });
      talismanAnalytics.capture("Redirect from phishing site", {
        url
      });
      this.redirectPhishingLanding(url);
      return true;
    }
    return false;
  }
  async handle(id, type, request, port, url) {
    if (type === "pub(phishing.redirectIfDenied)") {
      return this.redirectIfPhishing(url);
    }
    // Always check for onboarding before doing anything else
    // Because of chrome extensions can be synchronised on multiple computers,
    // Talisman may be installed on computers where user do not want to onboard
    // => Do not trigger onboarding, just throw an error
    await this.stores.app.ensureOnboarded();

    // check for phishing on all requests
    const isPhishing = await this.redirectIfPhishing(url);
    if (isPhishing) return;

    // --------------------------------------------------------------------
    // Then try known sub-handlers based on prefix of message ------------
    // --------------------------------------------------------------------
    try {
      const routeKey = type.split("pub(")[1].split(".")[0];
      const subhandler = this.#routes[routeKey];
      if (subhandler) return subhandler.handle(id, type, request, port, url);
    } catch (e) {
      throw new Error(`Unable to handle message of type ${type}`);
    }

    // check for authorisation if message is not to authorise, else authorise
    if (type !== "pub(authorize.tab)") {
      await this.stores.sites.ensureUrlAuthorized(url, false);
    } else {
      return this.authorize(url, request, port);
    }
    switch (type) {
      case "pub(accounts.list)":
        return this.accountsList(url, request);
      case "pub(accounts.subscribe)":
        return this.accountsSubscribe(url, id, port);
      case "pub(accounts.unsubscribe)":
        // noop, needed to comply with polkadot.js behaviour
        return true;
      case "pub(bytes.sign)":
        await this.stores.sites.ensureUrlAuthorized(url, false, request.address);
        return this.bytesSign(url, request, port);
      case "pub(extrinsic.sign)":
        await this.stores.sites.ensureUrlAuthorized(url, false, request.address);
        return this.extrinsicSign(url, request, port);
      case "pub(metadata.list)":
        return this.metadataList();
      case "pub(metadata.provide)":
        return this.metadataProvide(url, request, port);
      case "pub(rpc.listProviders)":
        return this.rpcListProviders();
      case "pub(rpc.send)":
        return this.rpcSend(request, port);
      case "pub(rpc.startProvider)":
        return this.rpcStartProvider(request, port);
      case "pub(rpc.subscribe)":
        return this.rpcSubscribe(request, id, port);
      case "pub(rpc.subscribeConnected)":
        return this.rpcSubscribeConnected(request, id, port);
      case "pub(rpc.unsubscribe)":
        return this.rpcUnsubscribe(request, port);
      case "pub(encrypt.encrypt)":
        {
          await this.stores.sites.ensureUrlAuthorized(url, false, request.address);
          const response = await this.messageEncrypt(url, request, port);
          return {
            id: Number(response.id),
            result: response.result
          };
        }
      case "pub(encrypt.decrypt)":
        {
          await this.stores.sites.ensureUrlAuthorized(url, false, request.address);
          const response = await this.messageDecrypt(url, request, port);
          return {
            id: Number(response.id),
            result: response.result
          };
        }
      case "pub(ping)":
        return Promise.resolve(true);
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}

const extension = new Extension(extensionStores);
const tabs = new Tabs(tabStores);

// dev mode logs shouldn't log content for these messages
const OBFUSCATE_LOG_MESSAGES = ["pri(app.authenticate)", "pri(app.checkPassword)", "pri(app.changePassword)", "pri(app.changePassword.subscribe)", "pri(accounts.export)", "pri(accounts.export.all)", "pri(accounts.export.pk)", "pri(accounts.add.derive)", "pri(accounts.add.keypair)", "pri(accounts.create.json)", "pri(accounts.address.lookup)", "pri(app.onboardCreatePassword)", "pri(mnemonics.setVerifierCertMnemonic)", "pri(mnemonics.unlock)", "pri(mnemonics.validateMnemonic)"];
const OBFUSCATED_PAYLOAD = "#OBFUSCATED#";

// ignore the ones that generate too much spam, making it hard to debug other things
const IGNORED_LOG_MESSAGES = ["pub(ping)", "pri(keepalive)", "pri(keepunlocked)", "pri(app.analyticsCapture)", "pub(talisman.rpc.byGenesisHash.subscribe)", "pub(talisman.rpc.byGenesisHash.unsubscribe)", "pub(talisman.rpc.byGenesisHash.send)"];
const formatFrom = source => {
  if (["extension", "<unknown>"].includes(source)) return source;
  try {
    const urlObj = new URL(source);
    return urlObj?.host;
  } catch (err) {
    return source;
  }
};
const PORT_DISCONNECTED_MESSAGES = ["Attempting to use a disconnected port object", "Attempt to postMessage on disconnected port"];
const talismanHandler = (data, port, extensionPortName = PORT_EXTENSION) => {
  const start = performance.now();
  const {
    id,
    message,
    request
  } = data;
  const isExtension = port.name === extensionPortName;
  const sender = port.sender;
  const from = isExtension ? "extension" : sender?.url || "<unknown>";
  const source = `${formatFrom(from)}: ${id}: ${message === "pub(eth.request)" ? `${message} ${request.method}` : message}`;
  const shouldLog = !OBFUSCATE_LOG_MESSAGES.includes(message);
  if (!IGNORED_LOG_MESSAGES.includes(message)) log.debug(`[${port.name} REQ] ${source}`, {
    request: shouldLog ? request : OBFUSCATED_PAYLOAD
  });
  const safePostMessage = (port, message) => {
    // only send message back to port if it's still connected, unfortunately this check is not reliable in all browsers
    if (!port) return;
    try {
      port.postMessage(message);
    } catch (e) {
      if (e instanceof Error && PORT_DISCONNECTED_MESSAGES.includes(e.message)) {
        // this means that the user has done something like close the tab
        port.disconnect();
        return;
      }
      throw e;
    }
  };

  // handle the request and get a promise as a response
  const promise = isExtension ? extension.handle(id, message, request, port) : tabs.handle(id, message, request, port, from);

  // resolve the promise and send back the response
  promise.then(response => {
    if (!IGNORED_LOG_MESSAGES.includes(message)) {
      const duration = `${(performance.now() - start).toFixed(2)}ms`;
      log.debug(`[${port.name} RES] ${source}`, {
        request: shouldLog ? request : OBFUSCATED_PAYLOAD,
        response: shouldLog ? response : OBFUSCATED_PAYLOAD,
        duration
      });
    }
    // between the start and the end of the promise, the user may have closed
    // the tab, in which case port will be undefined
    assert(port, "Port has been disconnected");
    safePostMessage(port, {
      id,
      response
    });

    // heap cleanup
    response = null;
  }).catch(error => {
    const duration = `${(performance.now() - start).toFixed(2)}ms`;
    log.error(`[${port.name} ERR] ${source}:: ${error.message}`, {
      error,
      duration
    });
    if (error instanceof Error && PORT_DISCONNECTED_MESSAGES.includes(error.message)) {
      // this means that the user has done something like close the tab
      port.disconnect();
      return;
    }
    if (["pub(eth.request)", "pri(eth.request)"].includes(message)) {
      const evmError = getEvmErrorCause(error);
      safePostMessage(port, {
        id,
        error: cleanupEvmErrorMessage(message === "pri(eth.request)" && evmError.details || (evmError.shortMessage ?? evmError.message ?? "Unknown error")),
        code: error.code,
        rpcData: evmError.data,
        // don't use "data" as property name or viem will interpret it differently
        isEthProviderRpcError: true
      });
    } else {
      safePostMessage(port, {
        id,
        error: error.message
      });
    }
  }).finally(() => {
    // heap cleanup
    data.request = null;
  });
};

class IconManager {
  constructor() {
    // update the icon when any of the request stores change
    requestStore.observable.subscribe(() => this.updateIcon());
  }
  updateIcon() {
    const counts = requestStore.getCounts();
    const signingCount = counts.get("eth-send") + counts.get("eth-sign") + counts.get("substrate-sign");
    const text = counts.get("auth") ? "Sites" : counts.get("metadata") ? "Meta" : signingCount ? `${signingCount}` : counts.get("eth-network-add") ? "Network" : counts.get("eth-watchasset") ? "Assets" : counts.get("encrypt") ? "Encrypt" : counts.get("decrypt") ? "Decrypt" : "";
    chrome.action.setBadgeText({
      text
    });
  }
}

/**
 * MigrationContext
 * @description
 * This is the context that is passed to each migration. It currently only includes the password. Because migrations are async,
 * we need to pass the password in the context rather than just accessing it from the store in the migration functions, as the password could be cleaned up
 * in the meantime.
 */

class MigrationFunction {
  status = "pending";
  error = null;
  constructor(migration, onError = async () => {}) {
    this._migration = migration;
    this._onError = onError;
  }
  async onError(error) {
    await this._onError(error);
    captureException(error);
    this.error = error;
    this.status = "error";
  }
  async apply(context) {
    try {
      await this._migration(context);
      this.status = "complete";
      return true;
    } catch (e) {
      log.error(e);
      this.onError(e);
      return false;
    }
  }
}

const POLKADOT_GENESIS_HASH = "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3";
const LegacyAccountTypes = {
  TALISMAN: "TALISMAN",
  // mnemonic generated by Talisman
  LEGACY_ROOT: "ROOT",
  // legacy, deprecated
  DERIVED: "DERIVED",
  SEED: "SEED",
  // used for an imported mnemonic used to generate accounts but not stored
  SEED_STORED: "SEED_STORED",
  // used for an imported mnemonic which is stored
  JSON: "JSON",
  HARDWARE: "HARDWARE"};
const NewAccountTypes = {
  TALISMAN: "TALISMAN",
  LEDGER: "LEDGER"};
const accountOriginSwitch = origin => {
  switch (origin) {
    case LegacyAccountTypes.TALISMAN:
    case LegacyAccountTypes.LEGACY_ROOT:
    case LegacyAccountTypes.DERIVED:
    case LegacyAccountTypes.SEED:
    case LegacyAccountTypes.SEED_STORED:
      return {
        origin: NewAccountTypes.TALISMAN
      };
    case LegacyAccountTypes.JSON:
      return {
        origin: NewAccountTypes.TALISMAN,
        importSource: "json"
      };
    case LegacyAccountTypes.HARDWARE:
      return {
        origin: NewAccountTypes.LEDGER
      };
    default:
      return {
        origin
      };
  }
};
const migrateToNewAccountTypes = {
  forward: new MigrationFunction(async () => {
    keyring.getAccounts().forEach(account => {
      const {
        origin
      } = account.meta;
      const newMeta = accountOriginSwitch(origin);
      const pair = keyring.getPair(account.address);

      // delete genesisHash for old json-imported accounts
      if (origin === LegacyAccountTypes.JSON && account.meta.genesisHash) delete account.meta.genesisHash;
      keyring.saveAccountMeta(pair, {
        ...account.meta,
        ...newMeta
      });
    });
  })
};

// Migrates Polkadot ledger accounts from legacy to generic app
const migratePolkadotLedgerAccounts = {
  forward: new MigrationFunction(async () => {
    for (const account of keyring.getAccounts()) {
      if (account.meta.hardwareType === "ledger" && account.meta.genesisHash === POLKADOT_GENESIS_HASH) {
        const {
          name,
          accountIndex,
          addressOffset
        } = account.meta;
        const newMeta = {
          name,
          accountIndex,
          addressOffset,
          origin: LegacyAccountOrigin.Ledger,
          ledgerApp: SubstrateLedgerAppType.Generic,
          type: "ed25519"
        };
        keyring.addHardware(account.address, "ledger", newMeta);
        appStore.set({
          showLedgerPolkadotGenericMigrationAlert: true
        });
      }
    }
  })
};

const legacyAppStore = appStore;
const migratePosthogDistinctIdToAnalyticsStore = {
  forward: new MigrationFunction(async () => {
    const distinctId = await legacyAppStore.get("posthogDistinctId");
    if (distinctId) await analyticsStore.set({
      distinctId
    });
    legacyAppStore.delete("posthogDistinctId");
  }),
  backward: new MigrationFunction(async () => {
    const {
      distinctId
    } = await analyticsStore.get();
    if (distinctId) await legacyAppStore.set({
      posthogDistinctId: distinctId
    });
    analyticsStore.delete("distinctId");
  })
};
const migrateAnaliticsPurgePendingCaptures = {
  forward: new MigrationFunction(async () => {
    analyticsStore.set({
      data: []
    });
  })
};

/**
 * Stores the active state of each substrate network, if and only if the user has overriden it.
 * Active state is stored aside of the database table, to allow for bulk reset of the table on a regular basis
 * Default active state is stored in the chaindata-provider, in the isDefault property.
 * We only store overrides here to reduce storage consumption.
 */
class ActiveChainsStore extends StorageProvider {
  constructor(initialData = {}) {
    super("activeChains", initialData);
  }
  async setActive(networkId, active) {
    const activeNetworks = await this.get();
    if (activeNetworks[networkId] === active) return;
    await this.set({
      ...activeNetworks,
      [networkId]: active
    });
  }
  async resetActive(networkId) {
    await this.delete(networkId);
  }
}

/** @deprecated use activeNetworksStore */
const activeChainsStore = new ActiveChainsStore();

/**
 * Stores the active state of each EVM network, if and only if the user has overriden it.
 * Active state is stored aside of the database table, to allow for bulk reset of the table on a regular basis
 * Default active state is stored in the chaindata-provider, in the isDefault property.
 * We only store overrides here to reduce storage consumption.
 */
class ActiveEvmNetworksStore extends StorageProvider {
  constructor(initialData = {}) {
    super("activeEvmNetworks", initialData);
  }
  async setActive(networkId, active) {
    const activeNetworks = await this.get();
    if (activeNetworks[networkId] === active) return;
    return await this.mutate(activeEvmNetworks => ({
      ...activeEvmNetworks,
      [networkId]: active
    }));
  }
  async resetActive(networkId) {
    await this.delete(networkId);
  }
}

/** @deprecated use activeNetworksStore */
const activeEvmNetworksStore = new ActiveEvmNetworksStore();

/**
 * @deprecated use keyring instead
 */

/**
 * @deprecated use keyring instead
 */
const addressBookStore = new StorageProvider("addressBook");

const cleanBadContacts = {
  forward: new MigrationFunction(async _context => {
    const dirtyContacts = await addressBookStore.get();
    const cleanContacts = Object.fromEntries(Object.entries(dirtyContacts).filter(([address]) => {
      try {
        normalizeAddress(address);
        return true;
      } catch (error) {
        log.log("Error normalising address", error);
        return false;
      }
    }));
    await addressBookStore.replace(cleanContacts);
  })
  // no way back
};
const hideGetStartedIfFunded = {
  forward: new MigrationFunction(async _context => {
    // deprecated
  })
  // no way back
};
const migrateAutoLockTimeoutToMinutes = {
  forward: new MigrationFunction(async _ => {
    const legacySettingsStore = new StorageProvider("settings");
    const currentValue = await legacySettingsStore.get("autoLockTimeout");
    if (currentValue === 0) await settingsStore.set({
      autoLockMinutes: 0
    });else await settingsStore.set({
      autoLockMinutes: currentValue / 60
    });
  }),
  backward: new MigrationFunction(async _ => {
    const currentValue = await settingsStore.get("autoLockMinutes");
    if (currentValue === 0) return;
    const legacySettingsStore = new StorageProvider("settings");
    await legacySettingsStore.set({
      autoLockTimeout: currentValue * 60
    });
  })
};
const migrateEnabledTestnets = {
  forward: new MigrationFunction(async _ => {
    const legacySettingsStore = new StorageProvider("settings");
    const useTestnets = await legacySettingsStore.get("useTestnets");

    // if user doesn't have testnets enabled, reset active status for all testnets
    if (!useTestnets) {
      const [chains, evmNetworks] = await Promise.all([chaindataProvider.getNetworks("polkadot"), chaindataProvider.getNetworks("ethereum")]);
      const chainTestnetIds = chains.filter(n => n.isTestnet).map(n => n.id);
      await activeChainsStore.mutate(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => !chainTestnetIds.includes(id))));
      const evmTestnetIds = evmNetworks.filter(n => n.isTestnet).map(n => n.id);
      await activeEvmNetworksStore.mutate(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => !evmTestnetIds.includes(id))));
    }

    // delete setting
    await legacySettingsStore.delete("useTestnets");
  })
};

// purpose of this migration is to run an initial scan on existing accounts, when the feature is rolled out
const migrateAssetDiscoveryRollout = {
  forward: new MigrationFunction(async () => {
    // we can't start a scan right away because chaindata will only fetch new tokens on first front end subscription
    // => flag that a scan is pending, and start it as soon as new tokens are fetched
    await appStore.set({
      isAssetDiscoveryScanPending: true
    });
  })
};

// purpose of this migration is clear existing stores due to property changes, and start a scan
const migrateAssetDiscoveryV2 = {
  forward: new MigrationFunction(async () => {
    await db.assetDiscovery.clear();
    await assetDiscoveryStore.reset();
    // we can't start a scan right away because chaindata will only fetch new tokens on first front end subscription
    // => flag that a scan is pending, and start it as soon as new tokens are fetched
    await appStore.set({
      isAssetDiscoveryScanPending: true
    });
  })
};

const MIGRATION_LABEL$1 = "Updating Balances System";
const migrateToChaindataV4 = {
  forward: new MigrationFunction(() => executeMigration())
  // no way back
};
const executeMigration = async () => {
  try {
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0
      }
    });
    const oldActiveEvmNetworks = await activeEvmNetworksStore.get();
    const oldActiveChains = await activeChainsStore.get();
    const oldActiveTokens = await activeTokensStore.get();
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.1
      }
    });
    const {
      chains: oldChains,
      evmNetworks: oldEvmNetworks,
      tokens: oldTokens,
      db: oldChaindataDb
    } = await getChaindataV3Entities();
    if (!oldChains.length && !oldEvmNetworks.length && !oldTokens.length)
      // this can happen if user closed the extension before acknowledging the migration popup
      throw new Error("Migration to chaindata v4 has already been applied, nothing to do");
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.4
      }
    });
    const oldTokensMap = keyBy(oldTokens, t => t.id);
    const oldToNewTokenId = fromPairs(oldTokens.map(token => [token.id, getChaindataV4TokenId(token.id, oldTokensMap)]));

    // migrate active networks and tokens
    await activeNetworksStore.set(assign({}, oldActiveEvmNetworks, oldActiveChains));
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.5
      }
    });
    await activeTokensStore.set(fromPairs(toPairs(oldActiveTokens).map(([oldTokenId, isActive]) => {
      return [oldToNewTokenId[oldTokenId], isActive];
    }).filter(([tokenId]) => !!tokenId)));
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.6
      }
    });

    // migrate custom networks and tokens
    await migrateCustomChains(oldChains, oldTokensMap);
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.7
      }
    });
    await migrateCustomEvmNetworks(oldEvmNetworks, oldTokensMap);
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.8
      }
    });

    // migrate tx history
    await migrateTransactions(oldToNewTokenId);
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 0.9
      }
    });

    // clear asset discovery pending queue
    await assetDiscoveryStore.clear();
    try {
      indexedDB.deleteDatabase("TalismanBalances");
    } catch {
      // ignore, this is not critical
    }

    // delete old chaindata v3 db
    await oldChaindataDb?.delete();
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL$1,
        progress: 1,
        acknowledgeRequest: "Your Talisman has been upgraded to improve performance. Your portfolio may briefly show no balances as it is refreshed."
      }
    });

    // wait for user to aknowledge that balances will be reloaded
    await firstValueFrom(appStore.observable.pipe(filter(appState => !!appState.currentMigration?.acknowledged)));
  } catch (error) {
    // actually none of the migrations should throw, unless there are storage (quota?) issues
    // consider non blocking, let the user access the app
    log.error("Error during chaindata v4 migration", error);
  } finally {
    await appStore.delete("currentMigration");
  }
};
const migrateTransactions = async oldToNewTokenId => {
  const txs = await db.transactions.toArray();
  const newTxs = txs.map(tx => {
    const newTx = structuredClone(tx);
    newTx.tokenId = (tx.tokenId && oldToNewTokenId[tx.tokenId]) ?? undefined;
    const txInfo = newTx.txInfo;
    // note: using isTxInfoSwap here would cause a circular dependency
    if (txInfo?.type === "swap-simpleswap" || txInfo?.type === "swap-stealthex" || txInfo?.type === "swap-lifi") {
      if (txInfo.fromTokenId && oldToNewTokenId[txInfo.fromTokenId]) txInfo.fromTokenId = oldToNewTokenId[txInfo.fromTokenId];
      if (txInfo.toTokenId && oldToNewTokenId[txInfo.toTokenId]) txInfo.toTokenId = oldToNewTokenId[txInfo.toTokenId];
    }
    return newTx;
  });
  try {
    await db.transactions.bulkPut(newTxs);
  } catch (error) {
    log.error("Error migrating transactions", {
      newTxs,
      error
    });
  }
};
const getChaindataV3Entities = async () => {
  try {
    const dbChaindataV3 = getChaindataDbV3();
    const [chains, evmNetworks, tokens] = await Promise.all([dbChaindataV3.chains.toArray(), dbChaindataV3.evmNetworks.toArray(), dbChaindataV3.tokens.toArray()]);
    return {
      chains,
      evmNetworks,
      tokens,
      db: dbChaindataV3
    };
  } catch (error) {
    log.error("Error fetching chaindata v3 entities", error);
    return {
      chains: [],
      evmNetworks: [],
      tokens: []
    };
  }
};
const getChaindataV4TokenId = (oldTokenId, oldTokens) => {
  if (oldTokenId.includes("-evm-native")) return oldTokenId.replace("-evm-native", ":evm-native");
  if (oldTokenId.includes("-evm-erc20-")) return oldTokenId.replace("-evm-erc20-", ":evm-erc20:");
  if (oldTokenId.includes("-evm-uniswapv2-")) return oldTokenId.replace("-evm-erc20-", ":evm-erc20:");
  if (oldTokenId.includes("-substrate-native")) return oldTokenId.replace("-substrate-native", ":substrate-native");
  if (oldTokenId.includes("-substrate-tokens-")) return oldTokenId.replace("-substrate-tokens-", ":substrate-tokens:");
  if (oldTokenId.includes("-substrate-psp22-")) return oldTokenId.replace("-substrate-psp22-", ":substrate-psp22:");
  if (oldTokenId.includes("-substrate-assets-")) return oldTokenId.replace("-substrate-assets-", ":substrate-assets:").split("-").slice(0, -1) // remove symbol at the end
  .join(":");
  if (oldTokenId.includes("-substrate-equilibrium-")) return null; // deprecated

  if (oldTokenId.includes("-substrate-foreignassets-")) {
    const oldToken = oldTokens[oldTokenId];
    if (oldToken && oldToken.chainId && oldToken.onChainId) return subForeignAssetTokenId(oldToken.chainId, oldToken.onChainId);
    log.debug("Unable to migrate foreign asset token ID", oldTokenId);
    return null;
  }
  log.warn(`Unknown token ID format: ${oldTokenId}, cannot migrate to chaindata v4`);
  return null;
};
const migrateCustomChains = async (oldChains, oldTokensMap) => {
  // custom networks and tokens
  for (const customChain of oldChains.filter(chain => "isCustom" in chain && chain.isCustom)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldNativeToken = oldTokensMap[customChain.nativeToken?.id ?? ""];
    if (!oldNativeToken) {
      log.warn(`No native token found for custom chain ${customChain.id}, skipping migration`);
      continue;
    }
    const nativeToken = {
      id: subNativeTokenId(customChain.id),
      networkId: customChain.id,
      type: "substrate-native",
      platform: "polkadot",
      symbol: oldNativeToken.symbol,
      decimals: oldNativeToken.decimals,
      coingeckoId: oldNativeToken.coingeckoId,
      name: oldNativeToken.symbol,
      isDefault: true,
      existentialDeposit: oldNativeToken.existentialDeposit ?? "0"
    };
    const customNetwork = {
      id: customChain.id,
      platform: "polkadot",
      nativeTokenId: nativeToken.id,
      genesisHash: customChain.genesisHash,
      name: customChain.name,
      isTestnet: customChain.isTestnet,
      rpcs: customChain.rpcs?.map(r => r.url) ?? [],
      blockExplorerUrls: [],
      // high risk of this not being set as it was introduced recently. its unlikely to have block explorer urls in custom chains anyway
      nativeCurrency: {
        symbol: nativeToken.symbol,
        name: nativeToken.name ?? nativeToken.symbol,
        decimals: nativeToken.decimals,
        coingeckoId: nativeToken.coingeckoId
      },
      account: customChain.account,
      chainName: customChain.chainName,
      specName: customChain.specName,
      specVersion: Number(customChain.specVersion),
      prefix: customChain.prefix,
      hasCheckMetadataHash: customChain.hasCheckMetadataHash ?? false,
      topology: {
        type: "standalone"
      },
      isDefault: true
    };
    try {
      await customChaindataStore.upsertNetwork(customNetwork, nativeToken);
    } catch (err) {
      log.error(`Error migrating custom chain ${customChain.id}`, err);
      continue;
    }
  }
};
const migrateCustomEvmNetworks = async (oldEvmNetworks, oldTokensMap) => {
  for (const customEvmNetwork of oldEvmNetworks.filter(chain => "isCustom" in chain && chain.isCustom)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldNativeToken = oldTokensMap[customEvmNetwork.nativeToken?.id ?? ""];
    if (!oldNativeToken) {
      log.warn(`No native token found for custom evmNetwork ${customEvmNetwork.id}, skipping migration`);
      continue;
    }
    const nativeToken = {
      id: subNativeTokenId(customEvmNetwork.id),
      networkId: customEvmNetwork.id,
      type: "evm-native",
      platform: "ethereum",
      symbol: oldNativeToken.symbol,
      decimals: oldNativeToken.decimals,
      coingeckoId: oldNativeToken.coingeckoId,
      name: oldNativeToken.symbol,
      isDefault: true
    };
    const customNetwork = {
      id: customEvmNetwork.id,
      platform: "ethereum",
      nativeTokenId: nativeToken.id,
      name: customEvmNetwork.name,
      isTestnet: customEvmNetwork.isTestnet,
      rpcs: customEvmNetwork.rpcs?.map(r => r.url) ?? [],
      blockExplorerUrls: [],
      // high risk of this not being set as it was introduced recently. its unlikely to have block explorer urls in custom chains anyway
      nativeCurrency: {
        symbol: nativeToken.symbol,
        name: nativeToken.name ?? nativeToken.symbol,
        decimals: nativeToken.decimals,
        coingeckoId: nativeToken.coingeckoId
      },
      preserveGasEstimate: customEvmNetwork.preserveGasEstimate ?? false,
      isDefault: true
    };
    try {
      await customChaindataStore.upsertNetwork(customNetwork, nativeToken);
    } catch (err) {
      log.error(`Error migrating custom chain ${customEvmNetwork.id}`, err);
      continue;
    }
  }
};

const migrateToNewDefaultEvmNetworks = {
  forward: new MigrationFunction(async () => {
    await activeEvmNetworksStore.set({
      "787": true,
      // Acala EVM
      "46": true,
      // Darwinia EVM
      "2021": true,
      // Edgeware EVM
      "100": true,
      // Gnosis
      "1285": true,
      // Moonriver,
      "336": true // Shiden EVM
    });
  })
};

const MIGRATION_LABEL = "Updating keyring";
const migrateFromPjsKeyring = {
  forward: new MigrationFunction(({
    password
  }) => executeMigrationFromPjsKeyring(password))
  // no way back
};

/**
 * @param password
 * @param replay use only for debugging, it will clear the keyring before running the migration
 */
const executeMigrationFromPjsKeyring = async (password, reset = false) => {
  const errors = [];
  const stopMainTimer = log.timer("executeMigrationFromPjsKeyring");
  try {
    await appStore.set({
      currentMigration: {
        name: MIGRATION_LABEL,
        progress: 0
      }
    });
    await awaitKeyringLoaded();
    if (reset) await keyringStore.reset();

    // fetch legacy data to migrate
    const oldMnemonics = Object.values(await mnemonicsStore.get());
    const oldPairs = keyring.getPairs();
    const oldContacts = Object.values(await addressBookStore.get());
    const oldCertMnemonicId = await appStore.get("vaultVerifierCertificateMnemonicId");

    // manage progress in local storage to let the frontend know about migration's progress
    let currentStep = 0;
    const totalSteps = oldMnemonics.length + oldPairs.length + oldContacts.length + 1;
    const updateMigrationProgress = () => {
      currentStep++;
      const progress = currentStep / totalSteps;
      return appStore.set({
        currentMigration: {
          name: MIGRATION_LABEL,
          progress
        }
      });
    };

    // map old to new mnemonic ids so we know how to replug each account derived from them
    const oldToNewMnemonicId = new Map();

    /**
     * Migrate Mnemonics
     */
    for (const oldMnemonic of oldMnemonics) {
      try {
        const {
          id: oldMnemonicId,
          name,
          confirmed
        } = oldMnemonic;
        const resMnemonicText = await mnemonicsStore.getMnemonic(oldMnemonicId, password);
        if (resMnemonicText.ok && resMnemonicText.val) {
          const existing = await keyringStore.getExistingMnemonicId(resMnemonicText.val);
          if (existing) {
            // skip if already migrated in a previous attempt
            oldToNewMnemonicId.set(oldMnemonicId, existing);
            continue;
          }
          const newMnemonic = await keyringStore.addMnemonic({
            mnemonic: resMnemonicText.val,
            name,
            confirmed
          });
          oldToNewMnemonicId.set(oldMnemonicId, newMnemonic.id);
        }
      } catch (err) {
        errors.push(`Failed to migrate mnemonic ${oldMnemonic.name}`);
        log.error("Failed to migrate mnemonic", {
          err,
          mnemonicId: oldMnemonic.id
        });
      } finally {
        await updateMigrationProgress();
      }
    }

    /**
     * Migrate Accounts
     */

    for (const oldPair of oldPairs) {
      const origin = oldPair.meta.origin;
      try {
        // skip if already migrated in a previous attempt
        if (await keyringStore.getAccount(oldPair.address)) continue;
        switch (origin) {
          case "ROOT":
          case "SEED":
          case "SEED_STORED":
          case "DERIVED":
          case "JSON":
          case LegacyAccountOrigin.Talisman:
            {
              const curve = pjsKeypairTypeToCurve(oldPair.type);
              const name = oldPair.meta.name ?? `Keypair ${oldPair.address}`;
              const mnemonicId = typeof oldPair.meta.derivedMnemonicId === "string" ? oldToNewMnemonicId.get(oldPair.meta.derivedMnemonicId) : null;
              let derivationPath = oldPair.meta.derivationPath;

              // for ethereum accounts, remove leading slash in derivation path
              if (curve === "ethereum" && derivationPath?.startsWith("/m/")) derivationPath = derivationPath.substring(1);
              if (mnemonicId && typeof derivationPath === "string" && (
              // allow empty string (substrate default)
              await isValidDerivationPath(derivationPath, oldPair.type))) {
                // keep the "link" to associated mnemonic by rederiving the account from it
                await keyringStore.addAccountDerive({
                  type: "existing-mnemonic",
                  name,
                  curve,
                  mnemonicId,
                  derivationPath
                });
              } else {
                // import as standalone keypair
                await keyringStore.addAccountKeypair({
                  name,
                  curve,
                  secretKey: getSecretKeyFromPjsJson(oldPair.toJson(password), password)
                });
              }
              break;
            }
          case LegacyAccountOrigin.Qr:
            {
              await keyringStore.addAccountExternal({
                type: "polkadot-vault",
                address: oldPair.address,
                genesisHash: oldPair.meta.genesisHash ?? null,
                name: oldPair.meta.name ?? `Polkadot Vault ${oldPair.address}`
              });
              break;
            }
          case "HARDWARE":
          case LegacyAccountOrigin.Ledger:
            {
              if (oldPair.type === "ethereum") {
                await keyringStore.addAccountExternal({
                  type: "ledger-ethereum",
                  address: oldPair.address,
                  name: oldPair.meta.name ?? `Ledger ${oldPair.address}`,
                  derivationPath: oldPair.meta.path
                });
              } else {
                const {
                  accountIndex,
                  addressOffset,
                  ledgerApp,
                  migrationAppName
                } = oldPair.meta;
                const options = {
                  type: "ledger-polkadot",
                  curve: "ed25519",
                  name: oldPair.meta.name ?? `Ledger ${oldPair.address}`,
                  address: oldPair.address,
                  app: migrationAppName ?? "Polkadot",
                  accountIndex,
                  addressOffset
                };
                if (ledgerApp === SubstrateLedgerAppType.Legacy) options.genesisHash = oldPair.meta.genesisHash;
                await keyringStore.addAccountExternal(options);
              }
              break;
            }
          case LegacyAccountOrigin.Signet:
            {
              await keyringStore.addAccountExternal({
                type: "signet",
                address: oldPair.address,
                name: oldPair.meta.name ?? `Signet ${oldPair.address}`,
                url: oldPair.meta.signetUrl,
                genesisHash: oldPair.meta.genesisHash
              });
              break;
            }
          case LegacyAccountOrigin.Watched:
          case LegacyAccountOrigin.Dcent:
            {
              await keyringStore.addAccountExternal({
                type: "watch-only",
                address: oldPair.address,
                name: oldPair.meta.name ?? `${capitalize(origin)} ${oldPair.address}`,
                isPortfolio: !!oldPair.meta.isPortfolio || origin === LegacyAccountOrigin.Dcent
              });
              break;
            }
          default:
            {
              log.error("Unknown account origin", {
                origin,
                pair: oldPair
              });
              throw new Error("Unknown origin " + origin);
            }
        }
      } catch (err) {
        errors.push(`Failed to migrate account ${oldPair.meta.name ?? oldPair.address}`);
        log.error("Failed to migrate account", {
          err,
          address: oldPair.address
        });
      } finally {
        await updateMigrationProgress();
      }
    }

    /**
     * Migrate contacts
     */
    for (const oldContact of oldContacts) {
      try {
        // skip if already migrated in a previous attempt
        if (await keyringStore.getAccount(oldContact.address)) continue;
        const options = {
          type: "contact",
          name: oldContact.name,
          address: oldContact.address
        };
        if (oldContact.genesisHash) options.genesisHash = oldContact.genesisHash;
        await keyringStore.addAccountExternal(options);
      } catch (err) {
        // ignore
      } finally {
        await updateMigrationProgress();
      }
    }

    /**
     * Migrate PV certificate mnemonic id
     */
    if (oldCertMnemonicId) {
      const newCertMnemonicId = oldToNewMnemonicId.get(oldCertMnemonicId);
      if (newCertMnemonicId) await appStore.set({
        vaultVerifierCertificateMnemonicId: newCertMnemonicId
      });
    }
    await updateMigrationProgress(); // 100%

    if (errors.length) {
      appStore.set({
        currentMigration: {
          name: MIGRATION_LABEL,
          errors
        }
      });
      // throw to prevent cleanup to occur, and inform the runner that it failed.
      // it will be retried on next startup
      throw new Error("Migration failed");
    }

    // copy the password store's data, so we have a snapshot of it that matches the old keyring
    // this entry is to be deleted in a future version
    const {
      password: passwordPjsBackup
    } = await chrome.storage.local.get("password");
    await chrome.storage.local.set({
      passwordPjsBackup
    });

    /**
     * Delete old data
     * @dev: we will do this step in a future version, allowing us to rollback if necessary
     */
    // try {
    //   // cleanup
    //   const keys = Object.keys(await chrome.storage.local.get(null)).filter((key) =>
    //     key.startsWith("account:0x"),
    //   )
    //   await Promise.all(keys.map(async (key) => await chrome.storage.local.remove(key)))

    //   await mnemonicsStore.clear()
    //   await addressBookStore.clear()
    // } catch (err) {
    //   log.error("Migration cleanup failed", { err })
    //   // ignore
    // }

    await appStore.delete("currentMigration");
  } finally {
    stopMainTimer();
  }
};

// if (DEBUG) {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const hostObj = globalThis as any

//   // utility to run the migration manually fron dev console
//   hostObj.executeMigrationFromPjsKeyring = async () => {
//     const password = await passwordStore.getPassword()
//     if (!password) throw new Error("Password not found")
//     await executeMigrationFromPjsKeyring(password, true)
//   }
// }

// keyring will automatically add the missing curve property to ledger-polkadot accounts
// just need to call forceUpdate() for the keyring's storage to be updated
const migrateLedgerPolkadotCurve = {
  forward: new MigrationFunction(() => keyringStore.forceUpdate())
  // no way back
};

const AccountTypes = {
  TALISMAN: "TALISMAN",
  // mnemonic generated by Talisman
  LEGACY_ROOT: "ROOT",
  // legacy, deprecated
  DERIVED: "DERIVED",
  SEED_STORED: "SEED_STORED" // used for an imported mnemonic which is stored
};
const mnemonicAccountTypes = [AccountTypes.TALISMAN, AccountTypes.LEGACY_ROOT, AccountTypes.SEED_STORED];
const getMnemonicHash = async (cipher, password) => {
  const {
    val: mnemonic,
    err
  } = await decryptMnemonic(cipher, password);
  if (err) throw new Error(mnemonic);
  const hash = md5(mnemonic);
  const encrypted = await encryptMnemonic$1(mnemonic, password);
  return {
    hash,
    encrypted
  };
};
const migrateSeedStoreToMultiple = {
  forward: new MigrationFunction(async context => {
    const legacyStore = createLegacySeedPhraseStore();
    const legacyData = await legacyStore.get();
    const legacyCipher = legacyData.cipher;
    if (!legacyCipher) return;
    const {
      password
    } = context;
    assert(password, "Password not found, unable to perform migration");
    const {
      encrypted: cipher,
      hash: id
    } = await getMnemonicHash(legacyCipher, password);
    await mnemonicsStore.set({
      [id]: {
        id,
        name: "My Recovery Phrase",
        source: MnemonicSource.Legacy,
        cipher,
        confirmed: legacyData.confirmed
      }
    });

    // get all accounts which have been derived from this recovery phrase, and add derivedMnemonicId to the metadata

    const allAccounts = keyring.getAccounts();
    const parentAccount = allAccounts.find(({
      meta: {
        origin
      }
    }) => origin && mnemonicAccountTypes.includes(origin));
    const derivedAccounts = allAccounts.filter(({
      meta: {
        parent,
        origin
      }
    }) => parent === parentAccount?.address && origin === AccountTypes.DERIVED);
    const migrationAccounts = [...derivedAccounts, parentAccount];
    migrationAccounts.forEach(account => {
      if (account) {
        keyring.saveAccountMeta(keyring.getPair(account.address), {
          ...account.meta,
          derivedMnemonicId: id
        });
      }
    });

    // if a verifier certificate exists, add it to the new seed store
    const legacyVerifierCertificateStore = createLegacyVerifierCertificateMnemonicStore();
    const legacyVCData = await legacyVerifierCertificateStore.get();
    if (legacyVCData.cipher) {
      let appStoreVCId = id;
      if (legacyVCData.cipher !== legacyData.cipher) {
        const {
          encrypted: vcCipher,
          hash: vcId
        } = await getMnemonicHash(legacyVCData.cipher, password);
        appStoreVCId = vcId;
        await mnemonicsStore.set({
          [vcId]: {
            ...legacyVCData,
            id: vcId,
            name: "Polkadot Vault Verifier Certificate",
            source: MnemonicSource.Legacy,
            cipher: vcCipher,
            confirmed: true // verifier certificate is always confirmed, because it was imported manually
          }
        });
      }

      // set the app store to use the new id
      await appStore.set({
        vaultVerifierCertificateMnemonicId: appStoreVCId
      });
    }
  })
  // no way back
};

// clears existing nfts data
const migrateNftsV2 = {
  forward: new MigrationFunction(async () => {
    await db.blobs.delete("nfts");
    await settingsStore.mutate(prev => ({
      ...prev,
      nftsSortBy: "value"
    }));
  })
  // no way back
};

const migrateSubstrateTokensIds = {
  forward: new MigrationFunction(async () => {
    const migratedTokenIds = new Map(Object.entries({
      "acala-substrate-tokens-lp-aseed-lcdot": "acala-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAEEAquiQgAvjIJDGiADIBLAI4VVAEwDCuVgHdtZVth59yVBAEYAzDIC6MoA",
      "acala-substrate-tokens-lp-aseed-intr": "acala-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAEEAquiQgAvjIJDGiAGKt8ASwDmXUQGddMMLxLkqCACwyAujKA",
      "acala-substrate-tokens-lp-aseed-ibtc": "acala-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAEEAquiQgAvjIJDGiAGKt8ASwDmXUQGddMMLxLkqCAMwyAujKA",
      "acala-substrate-tokens-lp-aseed-ldot": "acala-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAEEAquiQgAvjIJDGiNpx59yVBIpEAZJAHlmsmQF0ZQA",
      "acala-substrate-tokens-lp-aca-aseed": "acala-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAEEAwqJABfaQSGNEbTjz7kqCBSNEBVdEhnSAutKA",
      "acala-substrate-tokens-lp-dot-lcdot": "acala-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1ZAHlmIAL6SCQxogAyASwCOFJQBMAwrlYB3DWVbYefclQQBGAMySAupKA",
      "acala-substrate-tokens-dot": "acala-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiACIDySIAvi0A",
      "acala-substrate-tokens-ldot": "acala-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiADIAiA8kiAL5tA",
      "acala-substrate-tokens-aseed": "acala-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAIICqAygCIgC+7QA",
      "acala-substrate-tokens-tap": "acala-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAsgIIAKIAvs0A",
      "acala-substrate-tokens-lcdot": "acala-substrate-tokens-N4IgLgngDgpiBcIAyBLAjgVxQEwMICcB7Ad2wBtCBDAOxABoQA3SsjOeARgGYBfIA",
      "acala-substrate-tokens-weth": "acala-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1oFYiAWAEwDYi121WYAZhgsARgEYmAdnFSAZqyxSicmAE5pc5RlYZpADhABfIA",
      "acala-substrate-tokens-glmr": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AGAXyA",
      "acala-substrate-tokens-astr": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AmAXyA",
      "acala-substrate-tokens-eqd": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AOAXyA",
      "acala-substrate-tokens-intr": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AWAXyA",
      "acala-substrate-tokens-eq": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54B2AXyA",
      "acala-substrate-tokens-para": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAXyA",
      "acala-substrate-tokens-pink": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAZgF8g",
      "acala-substrate-tokens-ibtc": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BmAXyA",
      "acala-substrate-tokens-pha": "acala-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BOAXyA",
      "acala-substrate-tokens-wbtc": "acala-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1rQA4stmAWIgMwwwGYWAIwCsATmYj+ANgCMAdmYATMTNlK0IkUO5Ki05rOYgAvkA",
      "acala-substrate-tokens-ape": "acala-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1oDMAWNAdgwGYYA2ARnZYAnABNhWJgA5hwrsLT8pAVgxNl-XjC7suolkqJSQAXyA",
      "acala-substrate-tokens-dai": "acala-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1oFYAWIgZgHYisBGNACacmAIwBsvMQLHsYWIuLGiAZsoEi+LdmiYYicAL5A",
      "acala-substrate-tokens-usdcet": "acala-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1qwHYATAMwE4A2VgRgDMAFj5E2fbgCMio1kIF8YGNAA4hbTsxWTMOuAF8gA",
      "acala-substrate-tokens-tdot": "acala-substrate-tokens-N4IgLgngDgpiBcIDKYCGAjANjAggZzxjAAUB7UzAFVIGsYA7EAGhADdVMBXOeABgF8gA",
      "amplitude-substrate-tokens-ksm": "amplitude-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeABgF8g",
      "amplitude-substrate-tokens-usdt": "amplitude-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeARgF8g",
      "amplitude-substrate-tokens-tzs.s": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28ACoAtJLxkBnDeVyImMAB7wADAYDMXIQE4uUgEyZbmKzAAcUgKwB2e3Y9cvMSEpKTNjADMuLjMhSyljOzFMM1c7K0xXdMwARikxANdjGCiANhKpTBAAXxqgA",
      "amplitude-substrate-tokens-brl.s": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28AEIAlADK8ZAZ03lciJjAAe8AAyGYmTEIBsADjFcxJmAGYA7FK5CATF+8BWF2sATgBGaxhbFxM3F38AMxMXbycxaylvTFChW3ihTBcpIX9MAJgTKNdMEABfOqA",
      "amplitude-substrate-tokens-eurc.s": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28AKIBVAEoBhXjIDO28rkRMYAD3gAGYwCYAjNcswYADgBsAZhcB2GFxg2AnABmvgCsXEJmftaOUmZmUkJ+MJhcsR4ewVIBQq6YUlxcrhEe1kIwwWbBjmlCIAC+9UA",
      "amplitude-substrate-tokens-usdc.s": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28AKpIAIgGFeMgM5byuRExgAPeAAYjAZikBOawEY7FgBymYAMxjWnTqZlOYna1NXKTshDy4uNwsANhi3AHYxKU8uGJSxUwSEgCYuU0S3GLyxNzsAViFykABfOqA",
      "amplitude-substrate-tokens-audd.s": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28OgFUAIit4yAzpvK5ETGAA94ABkNCArADMpMAJx2A7HZgAmLiYsXXADgBsJq6uAIxWXFZuVkHBdlYAzBYwHlwWPlJpqVZCca5imN4mmMEWXPl+wWIgAL41QA",
      "amplitude-substrate-tokens-ngnc.s": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28VgHFWAYV4yAzpvK5ETGAA94ABkMAmLgEZMAM0xjbAZisAOV09sB2AJw+v5gCsXIG2QgBsXM5SgVImQj6BXiZcEbZSXD5WXlw5MFzmcSZJrtbhJuFSIAC+tUA",
      "amplitude-substrate-tokens-xlm": "amplitude-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwLKoY4BymYAloXAL6dA",
      "basilisk-substrate-tokens-aseed": "basilisk-substrate-tokens-ExA",
      "basilisk-substrate-tokens-tnkr": "basilisk-substrate-tokens-GxA",
      "basilisk-substrate-tokens-weth": "basilisk-substrate-tokens-IwBiA",
      "basilisk-substrate-tokens-teer": "basilisk-substrate-tokens-IwdiA",
      "basilisk-substrate-tokens-usdt": "basilisk-substrate-tokens-IwFiA",
      "basilisk-substrate-tokens-wusdt": "basilisk-substrate-tokens-IwJiA",
      "basilisk-substrate-tokens-xrt": "basilisk-substrate-tokens-IwNiA",
      "basilisk-substrate-tokens-dai": "basilisk-substrate-tokens-IwZiA",
      "basilisk-substrate-tokens-ksm": "basilisk-substrate-tokens-IxA",
      "basilisk-substrate-tokens-wbtc": "basilisk-substrate-tokens-IzI",
      "basilisk-substrate-tokens-usdcet": "basilisk-substrate-tokens-JxA",
      "bifrost-kusama-substrate-tokens-usdt": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54AGAXyA",
      "bifrost-kusama-substrate-tokens-mgx": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54AWAXyA",
      "bifrost-kusama-substrate-tokens-kint": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGAXyA",
      "bifrost-kusama-substrate-tokens-sdn": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BmAXyA",
      "bifrost-kusama-substrate-tokens-kbtc": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc55sBfIA",
      "bifrost-kusama-substrate-tokens-pha": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAAoASAgiAL6tA",
      "bifrost-kusama-substrate-tokens-dot": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiACIDySIAvi0A",
      "bifrost-kusama-substrate-tokens-bnc": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAEIByAwiAL6tA",
      "bifrost-kusama-substrate-tokens-rmrk": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAEoCydA0iAL5tA",
      "bifrost-kusama-substrate-tokens-zlk": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAFoAyA0iAL6tA",
      "bifrost-kusama-substrate-tokens-movr": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiALIDyAagEogC+7QA",
      "bifrost-kusama-substrate-tokens-kar": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANICCASiAL6tA",
      "bifrost-kusama-substrate-tokens-aseed": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIDKYCGAjANnANCAbqpgK5zyiSwIgDSAqkgCIgC+LQA",
      "bifrost-kusama-substrate-tokens-ksm": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIDKAsiAL6tA",
      "bifrost-kusama-substrate-tokens-blp0": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBCAZACiANCAbgQwBsBXOeABgF8g",
      "bifrost-kusama-substrate-tokens-blp2": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBCAZACiANCAbgQwBsBXOeAJgF8g",
      "bifrost-kusama-substrate-tokens-blp1": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBCAZACiANCAbgQwBsBXOeARgF8g",
      "bifrost-kusama-substrate-tokens-blp3": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBCAZACiANCAbgQwBsBXOeAZgF8g",
      "bifrost-kusama-substrate-tokens-vbnc": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOxAGhADcBDAGwFc55RJYEQAhAOQGEQBfdoA",
      "bifrost-kusama-substrate-tokens-vksm": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOxAGhADcBDAGwFc55RJYEQBpAZQFkQBfdoA",
      "bifrost-kusama-substrate-tokens-vmovr": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOxAGhADcBDAGwFc55RJYEQBZAeSQCUQBfDoA",
      "bifrost-kusama-substrate-tokens-vsksm": "bifrost-kusama-substrate-tokens-N4IgLgngDgpiBcIBqBlAKgewNYwHYgBoQA3AQwBsBXOeUSWBEAaRQFkQBfDoA",
      "bifrost-polkadot-substrate-tokens-ibtc": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54A2AXyA",
      "bifrost-polkadot-substrate-tokens-dot": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54AGAXyA",
      "bifrost-polkadot-substrate-tokens-manta": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54AOAXyA",
      "bifrost-polkadot-substrate-tokens-fil": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54AWAXyA",
      "bifrost-polkadot-substrate-tokens-intr": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54B2AXyA",
      "bifrost-polkadot-substrate-tokens-pink": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGABgF8g",
      "bifrost-polkadot-substrate-tokens-wave": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGAFgF8g",
      "bifrost-polkadot-substrate-tokens-ded": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGagXyA",
      "bifrost-polkadot-substrate-tokens-glmr": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGAXyA",
      "bifrost-polkadot-substrate-tokens-weth": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGAZgF8g",
      "bifrost-polkadot-substrate-tokens-pen": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BGbAXyA",
      "bifrost-polkadot-substrate-tokens-astr": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BmAXyA",
      "bifrost-polkadot-substrate-tokens-usdc": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc54BWAXyA",
      "bifrost-polkadot-substrate-tokens-usdt": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdgJhAGhADcBDAGwFc55sBfIA",
      "bifrost-polkadot-substrate-tokens-bnc": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAEIByAwiAL6tA",
      "bifrost-polkadot-substrate-tokens-vdot": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOwEwgBoQA3AQwBsBXOeABgF8g",
      "bifrost-polkadot-substrate-tokens-vmanta": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOwEwgBoQA3AQwBsBXOeADgF8g",
      "bifrost-polkadot-substrate-tokens-vfil": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOwEwgBoQA3AQwBsBXOeAFgF8g",
      "bifrost-polkadot-substrate-tokens-vglmr": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOwEwgBoQA3AQwBsBXOeARgF8g",
      "bifrost-polkadot-substrate-tokens-vastr": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOwEwgBoQA3AQwBsBXOeAZgF8g",
      "bifrost-polkadot-substrate-tokens-vbnc": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqAVA9gaxgOxAGhADcBDAGwFc55RJYEQAhAOQGEQBfdoA",
      "bifrost-polkadot-substrate-tokens-vsdot": "bifrost-polkadot-substrate-tokens-N4IgLgngDgpiBcIBqBlAKgewNYwHYCYQAaEANwEMAbAVzngAYBfIA",
      "centrifuge-polkadot-substrate-tokens-usdc": "centrifuge-polkadot-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54A2AXyA",
      "centrifuge-polkadot-substrate-tokens-glmr": "centrifuge-polkadot-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AWAXyA",
      "centrifuge-polkadot-substrate-tokens-usdt": "centrifuge-polkadot-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAXyA",
      "centrifuge-polkadot-substrate-tokens-dot": "centrifuge-polkadot-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BWAXyA",
      "composable-finance-substrate-tokens-sdn": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuX1XIuCA",
      "composable-finance-substrate-tokens-astr": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuX1XJOCA",
      "composable-finance-substrate-tokens-eq": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuX1XKMWCA",
      "composable-finance-substrate-tokens-bld": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAY6jgg",
      "composable-finance-substrate-tokens-lsdot": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAY6tgg",
      "composable-finance-substrate-tokens-tia": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAY79gg",
      "composable-finance-substrate-tokens-movr": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAY7lgg",
      "composable-finance-substrate-tokens-silk": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAY7Vgg",
      "composable-finance-substrate-tokens-eqd": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAYidzgg",
      "composable-finance-substrate-tokens-usdc": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAYiMdgg",
      "composable-finance-substrate-tokens-usdt": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAYiN9gg",
      "composable-finance-substrate-tokens-glmr": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAYqdgg",
      "composable-finance-substrate-tokens-vdot": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAYqngg",
      "composable-finance-substrate-tokens-pica": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZLFgg",
      "composable-finance-substrate-tokens-vksm": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZycNgg",
      "composable-finance-substrate-tokens-ist": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZyctgg",
      "composable-finance-substrate-tokens-bnc": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZydlgg",
      "composable-finance-substrate-tokens-statom": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZyidgg",
      "composable-finance-substrate-tokens-osmo": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZyijgg",
      "composable-finance-substrate-tokens-ksm": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZyingg",
      "composable-finance-substrate-tokens-atom": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZyLgg",
      "composable-finance-substrate-tokens-dot": "composable-finance-substrate-tokens-EQIwlg5mB2AuBcB2AnAJlQDgIwDZUFYsAWVHIgZnMX2XPwuXwAZyTgg",
      "hydradx-substrate-tokens-pha": "hydradx-substrate-tokens-BxA",
      "hydradx-substrate-tokens-weth": "hydradx-substrate-tokens-EwBiA",
      "hydradx-substrate-tokens-cru": "hydradx-substrate-tokens-EwdiA",
      "hydradx-substrate-tokens-kilt": "hydradx-substrate-tokens-EwDiA",
      "hydradx-substrate-tokens-sub": "hydradx-substrate-tokens-EwFiA",
      "hydradx-substrate-tokens-nodl": "hydradx-substrate-tokens-EwNiA",
      "hydradx-substrate-tokens-usdc": "hydradx-substrate-tokens-OxA",
      "hydradx-substrate-tokens-unq": "hydradx-substrate-tokens-EwViA",
      "hydradx-substrate-tokens-usdt": "hydradx-substrate-tokens-IwBjHYDZyA",
      "hydradx-substrate-tokens-dai": "hydradx-substrate-tokens-IwDiA",
      "hydradx-substrate-tokens-gdot": "hydradx-substrate-tokens-GwTiA",
      "hydradx-substrate-tokens-ape": "hydradx-substrate-tokens-GxA",
      "hydradx-substrate-tokens-aave": "hydradx-substrate-tokens-IwBjDYCYBYg",
      "hydradx-substrate-tokens-sol": "hydradx-substrate-tokens-IwBjHYFYCYg",
      "hydradx-substrate-tokens-wifd": "hydradx-substrate-tokens-IwBjIDgJiA",
      "hydradx-substrate-tokens-wud": "hydradx-substrate-tokens-IwBjIDgViA",
      "hydradx-substrate-tokens-pen": "hydradx-substrate-tokens-IwBjIDmI",
      "hydradx-substrate-tokens-pink": "hydradx-substrate-tokens-IwBjIJmI",
      "hydradx-substrate-tokens-aca": "hydradx-substrate-tokens-IwBjITgo",
      "hydradx-substrate-tokens-dota": "hydradx-substrate-tokens-IwBjIZgDiA",
      "hydradx-substrate-tokens-ded": "hydradx-substrate-tokens-IwBjOBOI",
      "hydradx-substrate-tokens-game": "hydradx-substrate-tokens-IwBjoFiA",
      "hydradx-substrate-tokens-ldot": "hydradx-substrate-tokens-IwBjpI",
      "hydradx-substrate-tokens-bork": "hydradx-substrate-tokens-IwBjwFgDiA",
      "hydradx-substrate-tokens-intr": "hydradx-substrate-tokens-IwdiA",
      "hydradx-substrate-tokens-bnc": "hydradx-substrate-tokens-IwFiA",
      "hydradx-substrate-tokens-ztg": "hydradx-substrate-tokens-IwJiA",
      "hydradx-substrate-tokens-glmr": "hydradx-substrate-tokens-IwNiA",
      "hydradx-substrate-tokens-wbtc": "hydradx-substrate-tokens-MxA",
      "hydradx-substrate-tokens-vdot": "hydradx-substrate-tokens-IwViA",
      "hydradx-substrate-tokens-cfg": "hydradx-substrate-tokens-IwZiA",
      "hydradx-substrate-tokens-h20": "hydradx-substrate-tokens-IxA",
      "hydradx-substrate-tokens-ibtc": "hydradx-substrate-tokens-IzI",
      "hydradx-substrate-tokens-astr": "hydradx-substrate-tokens-JxA",
      "hydradx-substrate-tokens-dot": "hydradx-substrate-tokens-KxA",
      "hydradx-substrate-tokens-myth": "hydradx-substrate-tokens-MwBiA",
      "hydradx-substrate-tokens-ajun": "hydradx-substrate-tokens-MwJiA",
      "hydradx-substrate-tokens-ring": "hydradx-substrate-tokens-MwRiA",
      "hydradx-substrate-tokens-vastr": "hydradx-substrate-tokens-MzI",
      "interlay-substrate-tokens-dot": "interlay-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiACIDySIAvi0A",
      "interlay-substrate-tokens-ibtc": "interlay-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAJIBCSAwiAL5tA",
      "interlay-substrate-tokens-intr": "interlay-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAJIBySASiAL5tA",
      "interlay-substrate-tokens-kbtc": "interlay-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIBCSAwiAL5tA",
      "interlay-substrate-tokens-kint": "interlay-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANICSAckiAL5tA",
      "interlay-substrate-tokens-ksm": "interlay-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIDKAsiAL6tA",
      "interlay-substrate-tokens-qdot": "interlay-substrate-tokens-N4IgLgngDgpiBcIAyMB2ATAKgewNZpABoQA3AQwBsBXOeAJgF8g",
      "interlay-substrate-tokens-qibtc": "interlay-substrate-tokens-N4IgLgngDgpiBcIAyMB2ATAKgewNZpABoQA3AQwBsBXOeARgF8g",
      "interlay-substrate-tokens-qusdt": "interlay-substrate-tokens-N4IgLgngDgpiBcIAyMB2ATAKgewNZpABoQA3AQwBsBXOeAZgF8g",
      "interlay-substrate-tokens-lp-dot-intr": "interlay-substrate-tokens-N4IgLgngDgpiBcIAyUAqB7A1jAdiANCAG4CGANgK5zwDaoksCIG2ehpl1901IAIgHlUIAL4j83Roha4CxclQSTeASQByqAEqiRAXRFA",
      "interlay-substrate-tokens-lp-ibtc-usdt": "interlay-substrate-tokens-N4IgLgngDgpiBcIAyUAqB7A1jAdiANCAG4CGANgK5zwDaoksCIG2ehpl1901IAkgCFUAYRABfMfm6NEAMXQAnGAEsA5jgCCAZy0wwBYuSoIATGIC6YoA",
      "interlay-substrate-tokens-lp-ibtc-dot": "interlay-substrate-tokens-N4IgLgngDgpiBcIAyUAqB7A1jAdiANCAG4CGANgK5zwDaoksCIG2ehpl1901IAkgCFUAYRABfMfm6NELXAWLkqCabwAiAeVTixAXTFA",
      "interlay-substrate-tokens-usdt": "interlay-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AmAXyA",
      "interlay-substrate-tokens-ldot": "interlay-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAXyA",
      "interlay-substrate-tokens-hdx": "interlay-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAZgF8g",
      "karura-substrate-tokens-lp-kar-qtz": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAggCUQAXxkEhjRADFW+AJYBzLuIDOumGF4lyVBACYZAXRlA",
      "karura-substrate-tokens-lp-kar-lksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAggCUQAXxkEhjRG048+5KgkUiAMqPQBZWTIC6MoA",
      "karura-substrate-tokens-lp-kar-ksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAggCUQAXxkEhjRG048+5KgkUjR6ALKyZAXRlA",
      "karura-substrate-tokens-lp-kar-kusd": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAggCUQAXxkEhjRG048+5KgkUjRAVXRJZMgLoygA",
      "karura-substrate-tokens-lp-kusd-rmrk": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiAGKt8ASwDmXAIIBnPTDC8S5KggAMMgLoygA",
      "karura-substrate-tokens-lp-kusd-qtz": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiAGKt8ASwDmXAIIBnPTDC8S5KggBMMgLoygA",
      "karura-substrate-tokens-lp-kusd-air": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiAGKt8ASwDmXAIIBnPTDC8S5KggCMAJhkBdGUA",
      "karura-substrate-tokens-lp-kusd-csm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiAGKt8ASwDmXAIIBnPTDC8S5KggCsMgLoygA",
      "karura-substrate-tokens-lp-kusd-pha": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiNpx59yVBIpEAFABIBBWTIC6MoA",
      "karura-substrate-tokens-lp-kusd-bnc": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiNpx59yVBIpEAhAHIBhWTIC6MoA",
      "karura-substrate-tokens-lp-kusd-lksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiNpx59yVBIpEAZUegCysmQF0ZQA",
      "karura-substrate-tokens-lp-kusd-kint": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiNpx59yVBIpGiAkgDlmsmQF0ZQA",
      "karura-substrate-tokens-lp-kusd-kbtc": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiNpx59yVBIpGiAQswDCsmQF0ZQA",
      "karura-substrate-tokens-lp-kusd-ksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGkAquiQgAvjIJDGiNpx59yVBIpGj0AWVkyAujKA",
      "karura-substrate-tokens-lp-ksm-rmrk": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGl0AWRABfaQSGNEAMVb4AlgHMuAQQDOumGF4lyVBAAZpAXWlA",
      "karura-substrate-tokens-lp-ksm-aris": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGl0AWRABfaQSGNEAMVb4AlgHMuAQQDOumGF4lyVBAEZpAXWlA",
      "karura-substrate-tokens-lp-ksm-lksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1EAGl0AWRABfaQSGNEbTjz7kqCBSIAy4qbIC60oA",
      "karura-substrate-tokens-lp-tai-tksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAiMAeBlAFgQwE5wBoQA3bAGwFc54BtUSWBEAFQHsBrGAOxCNMur1o1FgEEAkiAC+UgkMaJ0YbACMyMUQGdNMMAAVWrMm048+5KggAMUgLpSgA",
      "karura-substrate-tokens-pha": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAAoASAgiAL6tA",
      "karura-substrate-tokens-lksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiADIDSAygLIgC+7QA",
      "karura-substrate-tokens-bnc": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAEIByAwiAL6tA",
      "karura-substrate-tokens-vsksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAGoDKA0gwLIgC+HQA",
      "karura-substrate-tokens-kbtc": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIBCSAwiAL5tA",
      "karura-substrate-tokens-aseed": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANICqAygCIgC+7QA",
      "karura-substrate-tokens-kint": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANICSAckiAL5tA",
      "karura-substrate-tokens-ksm": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIDKAsiAL6tA",
      "karura-substrate-tokens-tai": "karura-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAsgIICSIAvs0A",
      "karura-substrate-tokens-kico": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54A2AXyA",
      "karura-substrate-tokens-rmrk": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AGAXyA",
      "karura-substrate-tokens-hei": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AmABgF8g",
      "karura-substrate-tokens-qtz": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AmAXyA",
      "karura-substrate-tokens-teer": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AOAXyA",
      "karura-substrate-tokens-hko": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AWAXyA",
      "karura-substrate-tokens-usdt": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54B2AXyA",
      "karura-substrate-tokens-kma": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGABgF8g",
      "karura-substrate-tokens-pchu": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAdgF8g",
      "karura-substrate-tokens-sdn": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGADgF8g",
      "karura-substrate-tokens-gens": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAFgF8g",
      "karura-substrate-tokens-air": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAJgF8g",
      "karura-substrate-tokens-tur": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGANgF8g",
      "karura-substrate-tokens-lt": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGATgF8g",
      "karura-substrate-tokens-eqd": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAVgF8g",
      "karura-substrate-tokens-aris": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAXyA",
      "karura-substrate-tokens-crab": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAZgF8g",
      "karura-substrate-tokens-bsx": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGFgXyA",
      "karura-substrate-tokens-movr": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BmAXyA",
      "karura-substrate-tokens-neer": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BOAXyA",
      "karura-substrate-tokens-csm": "karura-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BWAXyA",
      "karura-substrate-tokens-dai": "karura-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1oBYAjFgNiIDMWBWLohhZYA7EV4ATAIxomATjkwZAZgkS+RKbxgiscoiKkgAvkA",
      "karura-substrate-tokens-usdcet": "karura-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1oEYAzAZiKawFYAOAdiLYmTACwwh3AEacpbXrxgwMAExWiibNvzTL+IAL5A",
      "karura-substrate-tokens-waseed": "karura-substrate-tokens-N4IgLgngDgpiBcICiAnAxgJgAwgDQgDcBDAGwFc5EALGAD3i1pmwDYAOAZiIBMBGGbmwBGQmAIDsMXkRjiALKN5YAZrwCcgrHICsQ7RxwBfIA",
      "karura-substrate-tokens-tksm": "karura-substrate-tokens-N4IgLgngDgpiBcIDKYCGAjANjAggZzxjAAUB7UzAFVIGsYA7EAGhADdVMBXOeABgF8gA",
      "karura-substrate-tokens-3usd": "karura-substrate-tokens-N4IgLgngDgpiBcIDKYCGAjANjAggZzxjAAUB7UzAFVIGsYA7EAGhADdVMBXOeARgF8gA",
      "kintsugi-substrate-tokens-dot": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiACIDySIAvi0A",
      "kintsugi-substrate-tokens-ibtc": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAJIBCSAwiAL5tA",
      "kintsugi-substrate-tokens-intr": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiAJIBySASiAL5tA",
      "kintsugi-substrate-tokens-kbtc": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIBCSAwiAL5tA",
      "kintsugi-substrate-tokens-kint": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANICSAckiAL5tA",
      "kintsugi-substrate-tokens-ksm": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAqB7A1jAdiANCAbgIYA2ArnPKJLAiANIDKAsiAL6tA",
      "kintsugi-substrate-tokens-qksm": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAyMB2ATAKgewNZpABoQA3AQwBsBXOeAJgF8g",
      "kintsugi-substrate-tokens-qkbtc": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAyMB2ATAKgewNZpABoQA3AQwBsBXOeARgF8g",
      "kintsugi-substrate-tokens-qusdt": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAyMB2ATAKgewNZpABoQA3AQwBsBXOeAZgF8g",
      "kintsugi-substrate-tokens-lp-kbtc-usdt": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAyUAqB7A1jAdiANCAG4CGANgK5zwDaoksCIG2ehpl1901IA0gCFUAYRABfMfm6NEAMXQAnGAEsA5jgCCAZy0wwBYuSoIAzGIC6YoA",
      "kintsugi-substrate-tokens-lp-kbtc-ksm": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAyUAqB7A1jAdiANCAG4CGANgK5zwDaoksCIG2ehpl1901IA0gCFUAYRABfMfm6NELXAWLkqCabz4BlALLixAXTFA",
      "kintsugi-substrate-tokens-lp-ksm-kint": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIAyUAqB7A1jAdiANCAG4CGANgK5zwDaoksCIG2ehpl1901IA0gGUAsiAC+o-N0aIWuAsXJUEU3nwCSAOVRjRAXVFA",
      "kintsugi-substrate-tokens-lksm": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AmAXyA",
      "kintsugi-substrate-tokens-aseed": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAXyA",
      "kintsugi-substrate-tokens-usdt": "kintsugi-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BmAXyA",
      "mangata-substrate-tokens-mgx": "mangata-substrate-tokens-EQBmQ",
      "pendulum-substrate-tokens-dot": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeABgF8g",
      "pendulum-substrate-tokens-pink": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeAdgF8g",
      "pendulum-substrate-tokens-hdx": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeADgF8g",
      "pendulum-substrate-tokens-brz": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeAFgF8g",
      "pendulum-substrate-tokens-usdc": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeAJgF8g",
      "pendulum-substrate-tokens-glmr": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeANgF8g",
      "pendulum-substrate-tokens-vdot": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeARgAYBfIA",
      "pendulum-substrate-tokens-usdc.axl": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeARgCYBfIA",
      "pendulum-substrate-tokens-usdt": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeARgF8g",
      "pendulum-substrate-tokens-bnc": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeARjIF8g",
      "pendulum-substrate-tokens-astr": "pendulum-substrate-tokens-N4IgLgngDgpiBcIAaBhAsiANCAbgQwBsBXOeATgF8g",
      "pendulum-substrate-tokens-tzs.s": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28ACoAtJLxkBnDeVyImMAB7wADAYDMXIQE4uUgEyZbmKzAAcUgKwB2e3Y9cvMSEpKTNjADMuLjMhSyljOzFMM1c7K0xXdMwARikxANdjGCiANhKpTBAAXxqgA",
      "pendulum-substrate-tokens-brl.s": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28AEIAlADK8ZAZ03lciJjAAe8AAyGYmTEIBsADjFcxJmAGYA7FK5CATF+8BWF2sATgBGaxhbFxM3F38AMxMXbycxaylvTFChW3ihTBcpIX9MAJgTKNdMEABfOqA",
      "pendulum-substrate-tokens-eurc.s": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28AKIBVAEoBhXjIDO28rkRMYAD3gAGYwCYAjNcswYADgBsAZhcB2GFxg2AnABmvgCsXEJmftaOUmZmUkJ+MJhcsR4ewVIBQq6YUlxcrhEe1kIwwWbBjmlCIAC+9UA",
      "pendulum-substrate-tokens-usdc.s": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28AKpIAIgGFeMgM5byuRExgAPeAAYjAZikBOawEY7FgBymYAMxjWnTqZlOYna1NXKTshDy4uNwsANhi3AHYxKU8uGJSxUwSEgCYuU0S3GLyxNzsAViFykABfOqA",
      "pendulum-substrate-tokens-audd.s": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28OgFUAIit4yAzpvK5ETGAA94ABkNCArADMpMAJx2A7HZgAmLiYsXXADgBsJq6uAIxWXFZuVkHBdlYAzBYwHlwWPlJpqVZCca5imN4mmMEWXPl+wWIgAL41QA",
      "pendulum-substrate-tokens-ngnc.s": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwIgCCaUAFpgHKkC2ALPkSeQlABjAPYATCiABGASwB28VgHFWAYV4yAzpvK5ETGAA94ABkMAmLgEZMAM0xjbAZisAOV09sB2AJw+v5gCsXIG2QgBsXM5SgVImQj6BXiZcEbZSXD5WXlw5MFzmcSZJrtbhJuFSIAC+tUA",
      "pendulum-substrate-tokens-xlm": "pendulum-substrate-tokens-N4IgLgngDgpiBcIDKYYBs0EMBOIA0IAbpmgK5zyiSwLKoY4BymYAloXAL6dA",
      "picasso-substrate-tokens-dot": "picasso-substrate-tokens-EQIwlg5mB2AuBcA2YQ",
      "picasso-substrate-tokens-eq": "picasso-substrate-tokens-EQIwlg5mB2AuBcAmADARlcIA",
      "picasso-substrate-tokens-sdn": "picasso-substrate-tokens-EQIwlg5mB2AuBcAmADMg7MIA",
      "picasso-substrate-tokens-astr": "picasso-substrate-tokens-EQIwlg5mB2AuBcAmADMgbMIA",
      "picasso-substrate-tokens-tnkr": "picasso-substrate-tokens-EQIwlg5mB2AuBcAmAjI4Q",
      "picasso-substrate-tokens-osmo": "picasso-substrate-tokens-EQIwlg5mB2AuBcAOYQ",
      "picasso-substrate-tokens-huahua": "picasso-substrate-tokens-EQIwlg5mB2AuBcAWATABmEA",
      "picasso-substrate-tokens-ksm": "picasso-substrate-tokens-EQIwlg5mB2AuBcAWYQ",
      "picasso-substrate-tokens-atom": "picasso-substrate-tokens-EQIwlg5mB2AuBcB2YQ",
      "picasso-substrate-tokens-umee": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGA7MIA",
      "picasso-substrate-tokens-movr": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGADAFmEA",
      "picasso-substrate-tokens-bnc": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGADAJmEA",
      "picasso-substrate-tokens-vksm": "picasso-substrate-tokens-EQIwlg5mB2AuBcBmATMIA",
      "picasso-substrate-tokens-kar": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGADI4Q",
      "picasso-substrate-tokens-statom": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGADMIA",
      "picasso-substrate-tokens-bld": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGAHMIA",
      "picasso-substrate-tokens-bcre": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGALMIA",
      "picasso-substrate-tokens-scrt": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGArMIA",
      "picasso-substrate-tokens-eqd": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGATAdmEA",
      "picasso-substrate-tokens-aseed": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGATATmEA",
      "picasso-substrate-tokens-ntrn": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGATMIA",
      "picasso-substrate-tokens-usdt": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGAzABmEA",
      "picasso-substrate-tokens-wbtc": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGAzAJmEA",
      "picasso-substrate-tokens-usdc": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGAzI4Q",
      "picasso-substrate-tokens-weth": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGAzM4Q",
      "picasso-substrate-tokens-cre": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGAzMIA",
      "picasso-substrate-tokens-stars": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGRwg",
      "picasso-substrate-tokens-pica": "picasso-substrate-tokens-EQIwlg5mB2AuBcBGYQ",
      "picasso-substrate-tokens-bnc-ksm": "picasso-substrate-tokens-EQIwlg5mB2AuBcBmAjMIA",
      "picasso-substrate-tokens-vdot": "picasso-substrate-tokens-EQIwlg5mB2AuBcBmALMIA",
      "picasso-substrate-tokens-bnc-dot": "picasso-substrate-tokens-EQIwlg5mB2AuBcBmRwg",
      "picasso-substrate-tokens-strd": "picasso-substrate-tokens-EQIwlg5mB2AuBcBOYQ",
      "zeitgeist-substrate-tokens-hdx": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54A2AXyA",
      "zeitgeist-substrate-tokens-dot": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AGAXyA",
      "zeitgeist-substrate-tokens-bnc": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54AOAXyA",
      "zeitgeist-substrate-tokens-intr": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54B2AXyA",
      "zeitgeist-substrate-tokens-vglmr": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGABgF8g",
      "zeitgeist-substrate-tokens-usdc": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGAXyA",
      "zeitgeist-substrate-tokens-vastr": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BGFgXyA",
      "zeitgeist-substrate-tokens-glmr": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BmAXyA",
      "zeitgeist-substrate-tokens-vdot": "zeitgeist-substrate-tokens-N4IgLgngDgpiBcIBiB7ATjAlgcwHYEEBnQmMEAGhADcBDAGwFc54BOAXyA"
    }));
    await db.transaction("readwrite", "transactions", async t => {
      await t.transactions.each(async tx => {
        if (!tx.tokenId?.includes("substrate-tokens")) return;
        const newTokenId = migratedTokenIds.get(tx.tokenId);
        if (!newTokenId) return;
        tx.tokenId = newTokenId;
        await t.transactions.put(tx);
      });
    });
  })
};

// For DB version 11, Wallet version 2.13.0
const migrateTransactionsV2 = {
  forward: new MigrationFunction(async () => {
    try {
      await db.transaction("readwrite", ["transactions", "transactionsV2"], async tx => {
        // migrate legacy data to new table with new typing
        const legacyTransactions = await tx.table("transactions").toArray();
        const newTransactions = legacyTransactions.map(migrateLegacyTransaction).filter(isNotNil);
        await tx.table("transactionsV2").bulkPut(newTransactions);

        // clear legacy transactions table
        await tx.table("transactions").clear();
      });
    } catch (err) {
      // not a blocker
      log.error("Error migrating transactions", err);
    }
  })
};
const migrateLegacyTransaction = tx => {
  const txInfo = tx.txInfo ?? (tx.to && tx.tokenId && tx.value ? {
    type: "transfer",
    tokenId: tx.tokenId,
    value: tx.value,
    to: tx.to
  } : undefined);
  if (tx.networkType === "substrate" && GENESIS_HASH_TO_NETWORK_ID[tx.genesisHash]) return {
    id: tx.hash,
    platform: "polkadot",
    networkId: GENESIS_HASH_TO_NETWORK_ID[tx.genesisHash],
    account: tx.account,
    payload: tx.unsigned,
    status: tx.status,
    timestamp: tx.timestamp,
    hash: tx.hash,
    nonce: tx.nonce,
    blockNumber: tx.blockNumber,
    confirmed: !!tx.confirmed,
    label: tx.label,
    siteUrl: tx.siteUrl,
    txInfo
  };
  if (tx.networkType === "evm") {
    return {
      id: tx.hash,
      platform: "ethereum",
      networkId: tx.evmNetworkId,
      account: tx.account,
      payload: tx.unsigned,
      status: tx.status,
      timestamp: tx.timestamp,
      hash: tx.hash,
      nonce: tx.nonce,
      confirmed: !!tx.confirmed,
      label: tx.label,
      siteUrl: tx.siteUrl,
      isReplacement: !!tx.isReplacement,
      txInfo
    };
  }
  return null;
};

// chaindata provider might not be avalable while the migration is running
// hardcoded mappings of substrate networks genesisHash => networkId
const GENESIS_HASH_TO_NETWORK_ID = {
  "0x6c5894837ad89b6d92b114a2fb3eafa8fe3d26a54848e3447015442cd6ef4e66": "3-dpass",
  "0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c": "acala",
  "0xce7681fb12aa8f7265d229a9074be0ea1d5e99b53eedcec2deade43857901808": "acurast",
  "0xe358eb1d11b31255a286c12e44fe6780b7edb171d657905a97e39f71d9c6c3ee": "ajuna",
  "0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e": "aleph-zero",
  "0x05d5279c52c484cc80396535a316add7d47b1c5b9e0398dd1f584149341460c5": "aleph-zero-testnet",
  "0xa518884657dc1ae5492b530666bc3b3c4d49a65341a0721095400dc7ccaa105d": "melodie-testnet",
  "0xaa3876c1dc8a1afcc2e9a685a49ff7704cfd36ad8c90bf2702b9d1b00cc40011": "altair",
  "0xcceae7f3b9947cdb67369c026ef78efa5f34a08fe5808d373c04421ecf4f1aaf": "amplitude",
  "0x6d04f01a398a0de6466f7e3d8300e81fb1e5e8428a48ac4975469e90bedb96b6": "analog-testnet",
  "0x1459b0204b92719ffc978c5da3d6a2057973916bd548f8076df2064bc1cb4cfc": "analog-timechain",
  "0x66dc4e5ff85faddb0311b768eb73a58d9a00c65f06056ffaa370a1b1354d7411": "argon-testnet",
  "0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6": "astar",
  "0x66455a580aabff303720aa83adbe6c44502922251c03ba73686d5245da9e21bd": "autonomys",
  "0x5a367ed131b9d8807f0166651095a9ed51aefa9aaec3152d3eb5cee322220ce6": "autonomys-taurus-evm-testnet",
  "0x295aeafca762a304d92ee1505548695091f6082d3f0aa4d092ac3cd6397a6c5e": "autonomys-taurus-testnet",
  "0xb91746b45e0346cc2f815a520b9c6cb4d5c0902af848db0a80f85932d2e8276a": "avail",
  "0xd3d2f3a3495dc597434a99d7d449ebad6616db45e4e4f178f31cc6fa14378b70": "avail-turing-testnet",
  "0x8b5c955b5c8fd7112562327e3859473df4e3dff49bd72a113dbb668d2cfa20d7": "aventus",
  "0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755": "basilisk",
  "0x9f28c6a68e0fc9646eff64935684f6eeeece527e37bbe1f213d22caa1d9d6bed": "bifrost-kusama",
  "0x262e1b2ad728475fd6fe88e62d34c200abe6fd693931ddad144059b1eb884e5b": "bifrost-polkadot",
  "0xc14597baeccb232d662770d2d50ae832ca8c3192693d2b0814e6433f2888ddd6": "bitgreen",
  "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03": "bittensor",
  "0x8f9cf856bf558a14440e75569c9e58594757048d7b3a84b5d25f6bd978263105": "bittensor-testnet",
  "0xb3db41421702df9a7fcac62b53ffeac85f7853cc4e689e0b93aeb3db18c09d82": "centrifuge-polkadot",
  "0x81443836a9a24caaa23f1241897d1235717535711d1d3fe24eae4fdc942c092c": "cere",
  "0x8b8c140b0af9db70686583e3f6bf2a59052bfe9584b97d20c45068281e976eb9": "chainflip",
  "0x7a5d4db858ada1d20ed6ded4933c33313fc9673e5fffab560d0ca714782f2080": "chainflip-testnet",
  "0x6ac13efb5b368b97b4934cef6edfdd99c2af51ba5109bfb8dacc116f9c584c10": "chainx",
  "0xbc6eb9753e2417476601485f9f8ef8474701ec199d456f989bd397682c9425c5": "communeai",
  "0xdaab8df776eb52ec604a5df5d388bb62a050a0aaec4556a64265b9d42755552d": "composable-finance",
  "0x86e49c195aeae7c5c4a86ced251f1a28c67b3c35d8289c387ede1776cdd88b24": "crab",
  "0x4436a7d64e363df85e065a894721002a86643283f9707338bf195d360ba2ee71": "creditcoin",
  "0xdd954cbf4000542ef1a15bca509cd89684330bee5e23766c527cdb0d7275e9c2": "creditcoin-classic",
  "0xc2e43792c8acc075e564558f9a2184a0ffe9b0fd573969599eee9b647358c6cf": "creditcoin-classic-testnet",
  "0xfc4ec97a1c1f119c4353aecb4a17c7c0cf7b40d5d660143d8bad9117e9866572": "creditcoin-testnet",
  "0x4319cc49ee79495b57a1fec4d2bd43f59052dcc690276de566c2691d6df4f7b8": "crust-parachain",
  "0x1d73b9f5dc392744e0dee00a6d6254fcfa2305386cceba60315894fa4807053a": "curio",
  "0x983a1a72503d6cc3636776747ec627172b51272bf45e50a355348facb67a820a": "dancelight-testnet",
  "0xf0b8924b12e8108550d28870bc03f7b45a947e1b2b9abf81bfb0b89ecb60570e": "darwinia",
  "0x742a2ca70c2fda6cee4f8df98d64c4c670a052d9568058982dad9d5a7a135c5b": "edgeware",
  "0xa01fd8b004e04a4ce2c689a339b48b0585004de5844b9939071d44be07806a94": "elysium",
  "0x7dd99936c1e9e6d1ce7d90eb6f33bea8393b4bf87677d675aa63c9cb3e8c5b5b": "encointer",
  "0xe7eafa72eb58d1fdd906202f88d68f660ea6520bdc9c9ad08d6ebf91d14b4405": "encointer-testnet-standalone",
  "0x3af4ff48ec76d2efc8476730f423ac07e25ad48f5f4c9dc39c778b164d808615": "enjin-matrixchain",
  "0xa37725fd8943d2a524cb7ecc65da438f9fa644db78ba24dcd0003e2f95645e8f": "enjin-matrixchain-testnet",
  "0xd8761d3c88f26dc12875c00d3165f7d67243d56fc85b4cf19937601a7916e5a9": "enjin-relay",
  "0x735d8773c63e74ff8490fee5751ac07e15bfe2b3b5263be4d683c48dbdfbcd15": "enjin-relay-testnet",
  "0x5a51e04b88a4784d205091aa7bada002f3e5da3045e5b05655ee4db2589c33b5": "ewx",
  "0x4a587bf17a404e3572747add7aab7bbe56e805a5479c6c436f07f36fcc8d3ae1": "frequency",
  "0x2fc8bb6ed7c0051bdcf4866c322ed32b6276572713607e3297ccf411b8f14aa9": "heima",
  "0x40d175caba06c99521d5cd1bea3d1495b14d28b59eef1d5ffc2688cbb7e3dd76": "heima-testnet",
  "0xc56fa32442b2dad76f214b3ae07998e4ca09736e4813724bfb0717caae2c8bee": "humanode",
  "0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d": "hydradx",
  "0x61ea8a51fd4a058ee8c0e86df0a89cc85b8b67a0a66432893d09719050c9f540": "hyperbridge-polkadot",
  "0xcdedc8eadbfa209d3f207bba541e57c3c58a667b05a2e1d1e86353c9000758da": "integritee-kusama",
  "0xe13e7af377c64e83f95e0d70d5e5c3c01d697a84538776c5b9bbe0e7d7b6034c": "integritee-polkadot",
  "0xbf88efe70e9e0e916416e8bed61f2b45717f517d7f3523e33c7b001e5ffcbc72": "interlay",
  "0x6f0f071506de39058fe9a95bbca983ac0e9c5da3443909574e95d52eb078d348": "ipci",
  "0xbb9233e202ec014707f82ddb90e84ee9efece8fefee287ad4ad646d869a6c24a": "jamton",
  "0x6b5e488e0fa8f9821110d5c13f4c468abcd43ce5e297e62b34c53c3346465956": "joystream",
  "0xfeb426ca713f0f46c96465b8f039890370cf6bfd687c9076ea2843f58a6ae8a7": "kabocha",
  "0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b": "karura",
  "0x411f057b9107718c9624d6aa4a3f23c1653898297f3d4d529d9bb6511a39dd21": "kilt-spiritnet",
  "0xa0c6e3bac382b316a68bca7141af1fba507207594c761076847ce358aeedcc21": "kilt-testnet-standalone-2",
  "0x9af9a64e6e4da8e3073901c3ff0cc4c3aad9563786d89daf6ad820b6e14a0b8b": "kintsugi",
  "0xc710a5f16adc17bcd212cff0aedcbf1c1212a043cdc0fb2dcba861efe5305b01": "kreivo",
  "0xb3dd5ad6a82872b30aabaede8f41dfd4ff6c32ff82f8757d034a45be63cf104c": "krest",
  "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe": "kusama",
  "0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a": "kusama-asset-hub",
  "0x00dcb981df86429de8bbacf9803401f09485366c44efbf53af9ecfab03adc7e5": "kusama-bridge-hub",
  "0x638cd2b9af4b3bb54b8c1f0d22711fc89924ca93300f0caf25a580432b29d050": "kusama-coretime",
  "0xc1af4cb4eb3918e5db15086c0cc5ec17fb334f728b7c65dd44bfe1e174ff8b3f": "kusama-people",
  "0xe8aecc950e82f1a375cf650fa72d07e0ad9bef7118f49b92283b63e88b1de88b": "laos",
  "0x6324385efe4e93beadb6167414fd77e2ae505557db538ea26d297f1208520ae1": "laos-testnet",
  "0x6bd89e052d67a45bb60a9a23e8581053d5e0d619f15cb9865946937e690c42d6": "liberland",
  "0x131a8f81116a6ee880aa5f84b16115499a50f5f8dccfed80d87e204ec9203f3c": "liberland-testnet",
  "0x28e1d199bc6066751490ae2112010464ee8950f76ae9e2f11a03e9ea336b528b": "logion-polkadot",
  "0x87ac53add0e7b7cd6cac65a1fc42284ec3a98246c1daaac535805e80216199e8": "logion-testnet",
  "0xd611f22d291c5b7b69f1e105cca03352984c344c4421977efaa4cbdd1834e2aa": "mangata",
  "0xf3c7ad88f6a80f366c4be216691411ef0622e8b809b1046ea297ef106058d4eb": "manta",
  "0x91bc6e169807aaa54802737e1c504b2577d4fafedd5a02c10293b1cd60e39527": "moonbase-alpha-testnet",
  "0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d": "moonbeam",
  "0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b": "moonriver",
  "0xf6ee56e9c5277df5b4ce6ae9983ee88f3cbed27d31beeb98f9f84f997a1ab0b9": "mythos",
  "0xe7e0962324a3b86c83404dbea483f25fb5dab4c224791c81b756cfc948006174": "neuroweb",
  "0x97da7ede98d7bad4e36b4d734b6055425a3be036da2a332ea5a7037656427a21": "nodle-polkadot",
  "0xc87870ef90a438d574b8e320f17db372c50f62beb52e479c8ff6ee5b460670b9": "opal-testnet",
  "0xd6eec26135305a8ad257a20d003357284c8aa03d0bdb2b357ab0a22371e11ef2": "paseo-asset-hub",
  "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f": "paseo-testnet",
  "0xd2a5d385932d1f650dae03ef8e2748983779ee342c614f80854d32b8cd8fa48c": "peaq",
  "0x5d3c298622d5634ed019bf61ea4b71655030015bde9beb0d6a24743714462c86": "pendulum",
  "0x1bb969d85965e4bb5a651abbedf21a54b6b31a21f66b5401cc3f1e286268d736": "phala",
  "0xd9b288f9083f852f2729af58476b82b04bc9ed7e07d705614a843c93460974b2": "phala-testnet",
  "0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc": "picasso",
  "0x7eb9354488318e7549c722669dcbdcdc526f1fef1420e7944667212f3601fdbd": "polimec",
  "0x3920bcb4960a1eef5580cd5367ff3f430eef052774f78468852f7b9cb39f8a3c": "polkadex-standalone",
  "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3": "polkadot",
  "0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f": "polkadot-asset-hub",
  "0xdcf691b5a3fbe24adc99ddc959c0561b973e329b1aef4c4b22e7bb2ddecb4464": "polkadot-bridge-hub",
  "0x46ee89aa2eedd13e988962630ec9fb7565964cf5023bb351f2b6b25c1b68b0b2": "polkadot-collectives",
  "0xefb56e30d9b4a24099f88820987d0f45fb645992416535d87650d98e00f46fc4": "polkadot-coretime",
  "0x67fa177a097bfa18f77ea95ab56e9bcdfeb0e5b8a40e46298bb93e16b6fc5008": "polkadot-people",
  "0x6fbd74e5e1d0a61d52ccfe9d4adaed16dd3a7caa37c6bc4d0c2fa12e8b2f4063": "polymesh",
  "0x2ace05e703aa50b48c0ccccfc8b424f7aab9a1e2c424ed12e45d20b1e8ffd0d6": "polymesh-testnet",
  "0xcd4d732201ebe5d6b014edda071c4203e16867305332301dc8d092044b28e554": "quartz",
  "0x631ccc82a078481584041656af292834e1ae6daab61d2875b4dd0c14bb9b17bc": "robonomics-kusama",
  "0xf8820c64d415196a42723347a305420ce55940c8a3f7ab38bc134b2ba8844a50": "rococo-basilisk-testnet",
  "0xec39b15e5a1945ff19b8e8c0f76990b5758ce19faa4578e8ed57eda33e844452": "rococo-bifrost-testnet",
  "0x466edf864b4314b97f36e45ec21ddb39e0bdc52789377b91be0957d5afad2eb2": "rococo-ewx-testnet",
  "0x6f58daca460670a15c4c49c752c07eeab025e07bc142a50f94186b052a4538a8": "rococo-kinera-testnet",
  "0xf2b8faefcf9c370872d0b4d2eee31d46b4de4a8688153d23d82a39e2d6bc8bbc": "rococo-neuro-web-testnet",
  "0x1ad405b58a84050383b7c6ec01baaf1a446c81cf841513a25b75bc01a00f450f": "rococo-sora-testnet",
  "0xfb2f6c0837c11d62c3554fc042b644563e3be9362efeddf63e95042607a3904f": "rococo-zeitgeist-testnet",
  "0xd4c0c08ca49dc7c680c3dac71a7c0703e5b222f4b6c03fe4c5219bb8f22c18dc": "shadow-kusama",
  "0xddb89973361a170839f80f152d2e9e38a376a5a7eccefcade763f46a8e567019": "shibuya-testnet",
  "0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108": "shiden-kusama",
  "0x6d8d9f145c2177fa83512492cdd80a71e29f22473f4a8943a6292149ac319fb9": "sora-kusama",
  "0xe92d165ad41e41e215d09713788173aecfdbe34d3bed29409d33a2ef03980738": "sora-polkadot",
  "0x7e4e32d0feafd4f9c9414b0be86373f9a1efa904809b683453a9af6856d38ad5": "sora-standalone",
  "0x3266816be9fa51b32cfea58d3e33ca77246bc9618595a4300e44c8856a8d8a17": "sora-substrate-testnet",
  "0x4a12be580bb959937a1c7a61d5cf24428ed67fa571974b4007645d1886e7c89f": "subsocial-polkadot",
  "0x92e91e657747c41eeabed5129ff51689d2e935b9f6abfbd5dfcb2e1d0d035095": "subspace-gemini-3-f-testnet",
  "0x44f68476df71ebf765b630bf08dc1e0fedb2bf614a1aa0563b3f74f20e47b3e0": "tangle",
  "0xdd6d086f75ec041b66e20c4186d327b23c8af244c534a2418de6574e8c041a60": "tanssi",
  "0x6859c81ca95ef624c9dfe4dc6e3381c33e5d6509e35e147092bfbc780f777c4e": "ternoa",
  "0x0e00b212768e28b176d069890c106e37c331ea9b16b207f4e9baf67b3f3f3021": "torus",
  "0x84322d9cddbf35088f1e54e9a85c967a41a56a4f43445768125e61af166c7d31": "unique",
  "0xfe1b4c55fd4d668101126434206571a7838a8b6b93a6d1b95d607e78e6c53763": "vara",
  "0x525639f713f397dcf839bd022cd821f367ebcf179de7b9253531f8adbe5436d6": "vara-testnet",
  "0x21a1ba24a807ab70ade25cbd741e6428746a7007926ac7b82d102df7d620e2ea": "vtb",
  "0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9": "westend-asset-hub-testnet",
  "0x0441383e31d1266a92b4cb2ddd4c2e3661ac476996db7e5844c52433b81fe782": "westend-bridge-hub-testnet",
  "0x713daf193a6301583ff467be736da27ef0a72711b248927ba413f573d2b38e44": "westend-collectives-testnet",
  "0xf938510edee7c23efa6e9db74f227c827a1b518bffe92e2f6c9842dc53d38840": "westend-coretime-testnet",
  "0xafb18a620de2f0a9bf9c56cf8c8b05cacc6c608754959f3020e4fc90f9ae0c9f": "westend-penpal-testnet",
  "0x1eb6fb0ba5187434de017a70cb84d4f47142df1d571d0ef9e7e1407f2b80b93c": "westend-people-testnet",
  "0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e": "westend-testnet",
  "0x28cc1df52619f4edd9f0389a7e910a636276075ecc429600f1dd434e281a04e9": "xode",
  "0x50dd5d206917bf10502c68fb4d18a59fc8aa31586f4e8856b493e43544aa82aa": "xxnetwork",
  "0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060": "zeitgeist",
  "0xff7fe5a610f15fe7a0c52f94f86313fb7db7d3786e7f8acf2b66c11d5be7c242": "zkverify-volta-testnet"
};

// The order of these migrations can never be changed after they have been released.
const migrations = [migrateSeedStoreToMultiple, migrateToNewAccountTypes, migrateToNewDefaultEvmNetworks, migrateAssetDiscoveryRollout, cleanBadContacts, migratePolkadotLedgerAccounts, migratePosthogDistinctIdToAnalyticsStore, hideGetStartedIfFunded, migrateAutoLockTimeoutToMinutes, migrateAnaliticsPurgePendingCaptures, migrateAssetDiscoveryV2, migrateFromPjsKeyring, migrateEnabledTestnets, migrateSubstrateTokensIds, migrateLedgerPolkadotCurve, migrateToChaindataV4, migrateTransactionsV2, migrateNftsV2];

// @dev snippet to use in dev console of background worker to remove a migration:
// const state = await chrome.storage.local.get("migrations")
// delete state.migrations["15"] // CHANGE THIS TO YOUR MIGRATION'S INDEX
// await chrome.storage.local.set(state)
// warning: this will remove the record of the migration's application, but will not revert changes made by the migration
// it should only be used for idempotent or non-reversible migrations

/**
 * MigrationRunner
 * @description
 * This store is used to keep track of migrations that have been applied, and to run migrations on startup.
 * When updating, the store will check which migrations have already been run, and run the remaining ones.
 * If a migration fails, the store will be marked as 'error' and the migration will not be run again.
 *
 */

class MigrationRunner extends StorageProvider {
  status = new BehaviorSubject("unknown");
  /**
   * @param migrations - List of migrations to run
   * @param fakeApply - If true, will mark all migrations as applied, without actually running them. To be used on first install.
   */
  constructor(migrations = [], fakeApply = false, context) {
    const initialData = {};
    if (fakeApply) {
      migrations.forEach((_, i) => {
        initialData[i.toString()] = {
          appliedAt: Date.now()
        };
      });
    } else if (!context && migrations.length > 0) throw new Error("Migration context required when performing migrations");
    super("migrations", {});
    this.context = context;
    this.migrations = migrations;
    this.isComplete = new Promise(resolve => {
      this.status.subscribe({
        next: v => {
          if (v === "pending") this.applyMigrations();
          if (v === "complete" || v === "error") {
            // cleanup password and other context
            this.context = undefined;
            resolve(true);
          }
        }
      });
    });
    if (fakeApply) {
      // initial data has to be set rather than just passed into the super constructor
      this.set(initialData).then(() => {
        this.status.next("complete");
      });
    } else this.init();
  }
  init() {
    this.get().then(data => {
      const newStatus = Object.keys(data).length === this.migrations.length ? "complete" : "pending";
      this.status.next(newStatus);
    });
  }
  checkMigration = async key => {
    const applied = await this.get(key);
    return Boolean(applied);
  };
  applyMigration = async index => {
    assert(this.context, "Migration context required");
    const migration = this.migrations[index];
    if (!migration) throw new Error(`Migration ${index} not found`);
    const key = index.toString();
    const applied = await this.checkMigration(key);
    if (!applied) {
      const migrated = await migration.forward.apply(this.context);
      if (migrated) {
        return await this.set({
          [key]: {
            appliedAt: Date.now()
          }
        });
      }
      throw new Error(`Migration ${key} failed`, {
        cause: migration.forward.error
      });
    }
    log.warn(`Migration ${key} already applied, ignoring`);
    return;
  };
  reverseMigration = async index => {
    assert(this.context, "Migration context required");
    const migration = this.migrations[index];
    const key = index.toString();
    const applied = await this.checkMigration(key);
    if (applied) {
      const migrated = migration.backward ? await migration.backward.apply(this.context) : true;
      if (migrated) {
        return await this.set({
          [key]: undefined
        });
      }
      throw new Error(`Migration ${key} failed`, {
        cause: migration.backward?.error
      });
    }
    log.warn(`Migration ${key} not applied, ignoring`);
    return;
  };
  getLatestAppliedMigration = async () => {
    const applied = await this.get();
    const keys = Object.keys(applied);
    const latest = keys.map(Number).sort((a, b) => b - a)[0];
    return latest;
  };
  applyMigrations = async () => {
    if (this.status.value !== "pending") return;
    this.status.next("migrating");
    const latestApplied = (await this.getLatestAppliedMigration()) ?? -1;
    const lastToApply = this.migrations.length - 1;
    const pending = Array.from({
      length: lastToApply - latestApplied
    }, (_, i) => latestApplied + 1 + i);
    log.debug(`${pending.length} pending migrations`);
    const applied = [];
    try {
      for (const index of pending) {
        log.debug(`Applying migration ${index}`);
        await this.applyMigration(index);
        applied.push(index);
      }
      log.debug(`Applied ${applied.length} migrations`);
      this.status.next("complete");
      return applied;
    } catch (e) {
      this.status.next("error");
      log.error(e);
      if (e.cause) captureException(e);
      const stillPending = pending.filter(i => !applied.includes(i));
      log.error(`${stillPending.length} migrations were not applied`);
      return false;
    }
  };
}

sentry.init();
chrome.action.setBadgeBackgroundColor({
  color: "#d90000"
});

// Onboarding and migrations
chrome.runtime.onInstalled.addListener(async ({
  reason,
  previousVersion
}) => {
  if (reason === "install") {
    // if install, we want to check the storage for prev onboarded info
    // if not onboarded, show the onboard screen
    chrome.storage.local.get(["talismanOnboarded", "app"]).then(data => {
      // open onboarding when reason === "install" and data?.talismanOnboarded !== true
      // open dashboard data?.talismanOnboarded === true
      const legacyOnboarded = data && data.talismanOnboarded && data.talismanOnboarded?.onboarded === "TRUE";
      const currentOnboarded = data && data.app && data.app.onboarded === "TRUE";
      if (!legacyOnboarded && !currentOnboarded) {
        chrome.tabs.create({
          url: chrome.runtime.getURL("onboarding.html")
        });
      }
    });

    // instantiate the migrations runner with applyFake = true
    // this will not run any migrations
    const migrationRunner = new MigrationRunner(migrations, true);
    await migrationRunner.isComplete;
  } else if (reason === "update") {
    // run any legacy migrations
    if (previousVersion) {
      await migrateConnectAllSubstrate(previousVersion);
    }
  }
});

// run migrations on first login after startup
// Migrations occur on login to ensure that password is present for any migrations that require it
const migrationSub = passwordStore.isLoggedIn.subscribe(async isLoggedIn => {
  if (isLoggedIn === "TRUE") {
    const password = await passwordStore.getPassword();
    if (!password) {
      sentry.captureMessage("Unable to run migrations, no password present");
      return;
    }
    // instantiate the migrations runner with migrations to run
    // this will run any migrations that have not already been run
    const migrationRunner = new MigrationRunner(migrations, false, {
      password
    });
    await migrationRunner.isComplete;
    // only do this once
    migrationSub.unsubscribe();
    setWalletReady(); // set the wallet ready state to true, so workers such as asset discovery can start

    // start the asset discovery scanner after migrations are complete
    assetDiscoveryScanner.startPendingScan();
    initialiseSolanaAssetDiscovery();
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "wakeup") {
    sendResponse({
      status: "awake"
    });
  }
});

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener(_port => {
  // only listen to what we know about
  assert([PORT_CONTENT, PORT_EXTENSION].includes(_port.name), `Unknown connection from ${_port.name}`);
  let port = _port;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageHandler = data => {
    if (port) talismanHandler(data, port);
  };
  port.onMessage.addListener(messageHandler);
  const disconnectHandler = () => {
    port?.onMessage.removeListener(messageHandler);
    port?.onDisconnect.removeListener(disconnectHandler);
    port = undefined;
  };
  port.onDisconnect.addListener(disconnectHandler);
});
!DEBUG && chrome.runtime.setUninstallURL("https://thxbye.talisman.xyz/");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
new IconManager();
sessionStore.reset().catch(err => {
  log.error("Failed to reset session store", err);
});
