// @flow

import { type Disklet } from 'disklet'
import { type Subscriber } from 'yaob'

export {
  DustSpendError,
  errorNames,
  InsufficientFundsError,
  SpendToSelfError,
  NetworkError,
  NoAmountSpecifiedError,
  ObsoleteApiError,
  OtpError,
  PasswordError,
  PendingFundsError,
  SameCurrencyError,
  SwapAboveLimitError,
  SwapBelowLimitError,
  SwapCurrencyError,
  SwapPermissionError,
  UsernameError
} from './error.js'

// ---------------------------------------------------------------------
// io types
// ---------------------------------------------------------------------

// Node.js randomBytes function:
export type EdgeRandomFunction = (bytes: number) => Uint8Array

// The only subset of `Console` that Edge core uses:
export type EdgeConsole = {
  error(...data: Array<any>): void,
  info(...data: Array<any>): void,
  warn(...data: Array<any>): void
}

// The scrypt function Edge expects:
export type EdgeScryptFunction = (
  data: Uint8Array,
  salt: Uint8Array,
  n: number,
  r: number,
  p: number,
  dklen: number
) => Promise<Uint8Array>

/**
 * Access to platform-specific resources.
 * The core never talks to the outside world on its own,
 * but always goes through this object.
 */
export type EdgeIo = {
  // Crypto:
  +random: EdgeRandomFunction,
  +scrypt: EdgeScryptFunction,

  // Local io:
  +console: EdgeConsole,
  +disklet: Disklet,

  // Networking:
  +fetch: typeof fetch,
  +WebSocket: typeof WebSocket
}

/**
 * On React Native, each plugin can provide a bridge to whatever native
 * io it needs.
 */
export type EdgeNativeIo = { [packageName: string]: Object }

export type EdgeCorePluginOptions = {
  initOptions: Object, // Load-time options (like API keys)
  io: EdgeIo,
  nativeIo: EdgeNativeIo, // Only filled in on React Native
  pluginDisklet: Disklet // Plugin local storage
}

export type EdgePluginMap<Value> = { [pluginName: string]: Value }

// ---------------------------------------------------------------------
// key types
// ---------------------------------------------------------------------

export type EdgeWalletInfo = {
  id: string,
  type: string,
  keys: any
}

export type EdgeWalletInfoFull = {
  appIds: Array<string>,
  archived: boolean,
  deleted: boolean,
  id: string,
  keys: any,
  sortIndex: number,
  type: string
}

export type EdgeWalletState = {
  archived?: boolean,
  deleted?: boolean,
  sortIndex?: number
}

export type EdgeWalletStates = {
  [walletId: string]: EdgeWalletState
}

// ---------------------------------------------------------------------
// currency types
// ---------------------------------------------------------------------

// currency info -------------------------------------------------------

export type EdgeDenomination = {
  name: string,
  multiplier: string,
  symbol?: string
}

export type EdgeMetaToken = {
  currencyCode: string,
  currencyName: string,
  denominations: Array<EdgeDenomination>,
  contractAddress?: string,
  symbolImage?: string
}

export type EdgeCurrencyInfo = {
  // Basic currency information:
  currencyCode: string,
  displayName: string,
  pluginName: string,
  denominations: Array<EdgeDenomination>,
  requiredConfirmations?: number,
  walletType: string,

  // Configuration options:
  defaultSettings: any,
  metaTokens: Array<EdgeMetaToken>,

  // Explorers:
  addressExplorer: string,
  blockExplorer?: string,
  transactionExplorer: string,

  // Images:
  symbolImage?: string,
  symbolImageDarkMono?: string
}

// spending ------------------------------------------------------------

export type EdgeMetadata = {
  name?: string,
  category?: string,
  notes?: string,
  amountFiat?: number,
  bizId?: number,
  miscJson?: string
}

export type EdgeNetworkFee = {
  +currencyCode: string,
  +nativeAmount: string
}

export type EdgeTransaction = {
  txid: string,
  date: number,
  currencyCode: string,
  blockHeight: number,
  nativeAmount: string,
  networkFee: string,
  ourReceiveAddresses: Array<string>,
  signedTx: string,
  parentNetworkFee?: string,
  metadata?: EdgeMetadata,
  otherParams: any,
  wallet?: EdgeCurrencyWallet // eslint-disable-line no-use-before-define
}

export type EdgeSpendTarget = {
  currencyCode?: string,
  destWallet?: EdgeCurrencyWallet, // eslint-disable-line no-use-before-define
  publicAddress?: string,
  nativeAmount?: string,
  destMetadata?: EdgeMetadata,
  otherParams?: Object
}

export type EdgePaymentProtocolInfo = {
  domain: string,
  memo: string,
  merchant: string,
  nativeAmount: string,
  spendTargets: Array<EdgeSpendTarget>
}

export type EdgeSpendInfo = {
  currencyCode?: string,
  noUnconfirmed?: boolean,
  privateKeys?: Array<string>,
  spendTargets: Array<EdgeSpendTarget>,
  nativeAmount?: string,
  quoteFor?: string,
  networkFeeOption?: string, // 'high' | 'standard' | 'low' | 'custom',
  customNetworkFee?: any, // Some kind of currency-specific JSON
  metadata?: EdgeMetadata,
  otherParams?: Object
}

// query data ----------------------------------------------------------

export type EdgeDataDump = {
  walletId: string,
  walletType: string,
  data: {
    [dataCache: string]: any
  }
}

export type EdgeFreshAddress = {
  publicAddress: string,
  segwitAddress?: string,
  legacyAddress?: string
}

export type EdgeTokenInfo = {
  currencyCode: string,
  currencyName: string,
  contractAddress: string,
  multiplier: string
}

export type EdgeTxidMap = { [txid: string]: number }

// URI -----------------------------------------------------------------

export type EdgeParsedUri = {
  token?: EdgeMetaToken,
  privateKeys?: Array<string>,
  publicAddress?: string,
  legacyAddress?: string,
  segwitAddress?: string,
  nativeAmount?: string,
  currencyCode?: string,
  metadata?: EdgeMetadata,
  bitIDURI?: string,
  bitIDDomain?: string,
  bitIDCallbackUri?: string,
  paymentProtocolUrl?: string,
  returnUri?: string,
  uniqueIdentifier?: string, // Ripple payment id
  bitidPaymentAddress?: string, // Experimental
  bitidKycProvider?: string, // Experimental
  bitidKycRequest?: string // Experimental
}

export type EdgeEncodeUri = {
  publicAddress: string,
  segwitAddress?: string,
  legacyAddress?: string,
  nativeAmount?: string,
  label?: string,
  message?: string,
  currencyCode?: string
}

// options -------------------------------------------------------------

export type EdgeCurrencyCodeOptions = {
  currencyCode?: string
}

export type EdgeGetTransactionsOptions = {
  currencyCode?: string,
  startIndex?: number,
  startEntries?: number,
  startDate?: number,
  endDate?: number,
  searchString?: string,
  returnIndex?: number,
  returnEntries?: number,
  denomination?: string
}

// engine --------------------------------------------------------------

export type EdgeCurrencyEngineCallbacks = {
  +onBlockHeightChanged: (blockHeight: number) => void,
  +onTransactionsChanged: (transactions: Array<EdgeTransaction>) => void,
  +onBalanceChanged: (currencyCode: string, nativeBalance: string) => void,
  +onAddressesChecked: (progressRatio: number) => void,
  +onTxidsChanged: (txids: EdgeTxidMap) => void
}

export type EdgeCurrencyEngineOptions = {
  callbacks: EdgeCurrencyEngineCallbacks,
  walletLocalDisklet: Disklet,
  walletLocalEncryptedDisklet: Disklet,
  userSettings: Object | void
}

export type EdgeCurrencyEngine = {
  changeUserSettings(settings: Object): Promise<mixed>,

  // Keys:
  getDisplayPrivateSeed(): string | null,
  getDisplayPublicSeed(): string | null,

  // Engine status:
  startEngine(): Promise<mixed>,
  killEngine(): Promise<mixed>,
  resyncBlockchain(): Promise<mixed>,
  dumpData(): EdgeDataDump,

  // Chain state:
  getBlockHeight(): number,
  getBalance(opts: EdgeCurrencyCodeOptions): string,
  getNumTransactions(opts: EdgeCurrencyCodeOptions): number,
  getTransactions(
    opts: EdgeGetTransactionsOptions
  ): Promise<Array<EdgeTransaction>>,
  getTxids?: () => EdgeTxidMap,

  // Tokens:
  enableTokens(tokens: Array<string>): Promise<mixed>,
  disableTokens(tokens: Array<string>): Promise<mixed>,
  getEnabledTokens(): Promise<Array<string>>,
  addCustomToken(token: EdgeTokenInfo): Promise<mixed>,
  getTokenStatus(token: string): boolean,

  // Addresses:
  getFreshAddress(opts: EdgeCurrencyCodeOptions): EdgeFreshAddress,
  addGapLimitAddresses(addresses: Array<string>): void,
  isAddressUsed(address: string): boolean,

  // Spending:
  makeSpend(spendInfo: EdgeSpendInfo): Promise<EdgeTransaction>,
  signTx(transaction: EdgeTransaction): Promise<EdgeTransaction>,
  broadcastTx(transaction: EdgeTransaction): Promise<EdgeTransaction>,
  saveTx(transaction: EdgeTransaction): Promise<mixed>,
  +sweepPrivateKeys?: (spendInfo: EdgeSpendInfo) => Promise<EdgeTransaction>,
  +getPaymentProtocolInfo?: (
    paymentProtocolUrl: string
  ) => Promise<EdgePaymentProtocolInfo>,

  // Escape hatch:
  +otherMethods?: Object
}

// currency plugin -----------------------------------------------------

export type EdgeBitcoinPrivateKeyOptions = {
  format?: string,
  coinType?: number,
  account?: number
}

// Add other currencies to this list as they gather options:
export type EdgeCreatePrivateKeyOptions = {} | EdgeBitcoinPrivateKeyOptions

export type CustomTokenInfo = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  multiplier: string,
  denomination: string, // eventually change to mandatory
  isVisible?: boolean, // eventually change to mandatory,
  denominations: Array<EdgeDenomination>
}

export type EdgeCurrencyTools = {
  // Keys:
  +importPrivateKey?: (
    key: string,
    opts?: EdgeCreatePrivateKeyOptions
  ) => Promise<Object>,
  createPrivateKey(
    walletType: string,
    opts?: EdgeCreatePrivateKeyOptions
  ): Promise<Object>,
  derivePublicKey(walletInfo: EdgeWalletInfo): Promise<Object>,
  +getSplittableTypes?: (walletInfo: EdgeWalletInfo) => Array<string>,

  // URIs:
  parseUri(
    uri: string,
    currencyCode?: string,
    customTokens?: Array<EdgeMetaToken>
  ): Promise<EdgeParsedUri>,
  encodeUri(
    obj: EdgeEncodeUri,
    customTokens?: Array<EdgeMetaToken>
  ): Promise<string>
}

export type EdgeCurrencyPlugin = {
  +currencyInfo: EdgeCurrencyInfo,

  makeCurrencyTools(): Promise<EdgeCurrencyTools>,
  makeCurrencyEngine(
    walletInfo: EdgeWalletInfo,
    opts: EdgeCurrencyEngineOptions
  ): Promise<EdgeCurrencyEngine>,

  // Escape hatch:
  +otherMethods?: Object
}

// wallet --------------------------------------------------------------

export type EdgeBalances = { [currencyCode: string]: string }

export type EdgeReceiveAddress = EdgeFreshAddress & {
  metadata: EdgeMetadata,
  nativeAmount: string
}

export type EdgeCurrencyWalletEvents = {
  newTransactions: Array<EdgeTransaction>,
  transactionsChanged: Array<EdgeTransaction>
}

export type EdgeCurrencyWallet = {
  +on: Subscriber<EdgeCurrencyWalletEvents>,
  +watch: Subscriber<EdgeCurrencyWallet>,

  // Data store:
  +id: string,
  +keys: any,
  +type: string,
  +publicWalletInfo: EdgeWalletInfo,
  +disklet: Disklet,
  +localDisklet: Disklet,
  sync(): Promise<mixed>,

  // Wallet keys:
  +displayPrivateSeed: string | null,
  +displayPublicSeed: string | null,

  // Wallet name:
  +name: string | null,
  renameWallet(name: string): Promise<mixed>,

  // Fiat currency option:
  +fiatCurrencyCode: string,
  setFiatCurrencyCode(fiatCurrencyCode: string): Promise<mixed>,

  // Currency info:
  +currencyInfo: EdgeCurrencyInfo,
  nativeToDenomination(
    nativeAmount: string,
    currencyCode: string
  ): Promise<string>,
  denominationToNative(
    denominatedAmount: string,
    currencyCode: string
  ): Promise<string>,

  // Chain state:
  +balances: EdgeBalances,
  +blockHeight: number,
  +syncRatio: number,

  // Running state:
  startEngine(): Promise<mixed>,
  stopEngine(): Promise<mixed>,

  // Token management:
  enableTokens(tokens: Array<string>): Promise<mixed>,
  disableTokens(tokens: Array<string>): Promise<mixed>,
  getEnabledTokens(): Promise<Array<string>>,
  addCustomToken(token: EdgeTokenInfo): Promise<mixed>,

  // Transactions:
  getNumTransactions(opts?: EdgeCurrencyCodeOptions): Promise<number>,
  getTransactions(
    opts?: EdgeGetTransactionsOptions
  ): Promise<Array<EdgeTransaction>>,
  getReceiveAddress(
    opts?: EdgeCurrencyCodeOptions
  ): Promise<EdgeReceiveAddress>,
  saveReceiveAddress(receiveAddress: EdgeReceiveAddress): Promise<mixed>,
  lockReceiveAddress(receiveAddress: EdgeReceiveAddress): Promise<mixed>,
  makeSpend(spendInfo: EdgeSpendInfo): Promise<EdgeTransaction>,
  signTx(tx: EdgeTransaction): Promise<EdgeTransaction>,
  broadcastTx(tx: EdgeTransaction): Promise<EdgeTransaction>,
  saveTx(tx: EdgeTransaction): Promise<mixed>,
  sweepPrivateKeys(edgeSpendInfo: EdgeSpendInfo): Promise<EdgeTransaction>,
  saveTxMetadata(
    txid: string,
    currencyCode: string,
    metadata: EdgeMetadata
  ): Promise<mixed>,
  getMaxSpendable(spendInfo: EdgeSpendInfo): Promise<string>,
  getPaymentProtocolInfo(
    paymentProtocolUrl: string
  ): Promise<EdgePaymentProtocolInfo>,

  // Wallet management:
  resyncBlockchain(): Promise<mixed>,
  dumpData(): Promise<EdgeDataDump>,
  getDisplayPrivateSeed(): string | null,
  getDisplayPublicSeed(): string | null,

  // Data exports:
  exportTransactionsToQBO(opts: EdgeGetTransactionsOptions): Promise<string>,
  exportTransactionsToCSV(opts: EdgeGetTransactionsOptions): Promise<string>,

  // URI handling:
  parseUri(uri: string, currencyCode?: string): Promise<EdgeParsedUri>,
  encodeUri(obj: EdgeEncodeUri): Promise<string>,

  +otherMethods: Object,

  // Deprecated API's:
  getBalance(opts?: EdgeCurrencyCodeOptions): string,
  getBlockHeight(): number
}

// ---------------------------------------------------------------------
// swap plugin
// ---------------------------------------------------------------------

export type EdgeSwapInfo = {
  +displayName: string,
  +pluginName: string,

  +quoteUri?: string, // The quoteId would be appended to this
  +supportEmail: string
}

export type EdgeSwapRequest = {
  // Where?
  fromWallet: EdgeCurrencyWallet,
  toWallet: EdgeCurrencyWallet,

  // What?
  fromCurrencyCode: string,
  toCurrencyCode: string,

  // How much?
  nativeAmount: string,
  quoteFor: 'from' | 'to'
}

export type EdgeSwapPluginQuote = {
  +fromNativeAmount: string,
  +toNativeAmount: string,
  +networkFee: EdgeNetworkFee,
  +destinationAddress: string,

  +pluginName: string,
  +expirationDate?: Date,
  +quoteId?: string,

  approve(): Promise<EdgeTransaction>,
  close(): Promise<mixed>
}

export type EdgeSwapPluginStatus = {
  needsActivation?: boolean
}

export type EdgeSwapPlugin = {
  +swapInfo: EdgeSwapInfo,

  checkSettings?: (userSettings: Object) => EdgeSwapPluginStatus,
  fetchSwapQuote(
    request: EdgeSwapRequest,
    userSettings: Object | void
  ): Promise<EdgeSwapPluginQuote>
}

// ---------------------------------------------------------------------
// rate plugin
// ---------------------------------------------------------------------

export type EdgeRateHint = {
  fromCurrency: string,
  toCurrency: string
}

export type EdgeRateInfo = {
  +displayName: string
}

export type EdgeRatePair = {
  fromCurrency: string,
  toCurrency: string,
  rate: number
}

export type EdgeRatePlugin = {
  +rateInfo: EdgeRateInfo,

  fetchRates(hints: Array<EdgeRateHint>): Promise<Array<EdgeRatePair>>
}

// ---------------------------------------------------------------------
// account
// ---------------------------------------------------------------------

export type EdgeAccountOptions = {
  otp?: string
}

// currencies ----------------------------------------------------------

export type EdgeCreateCurrencyWalletOptions = {
  fiatCurrencyCode?: string,
  name?: string,

  // Create a private key from some text:
  importText?: string,

  // Used to tell the currency plugin what keys to create:
  keyOptions?: EdgeCreatePrivateKeyOptions,

  // Used to copy wallet keys between accounts:
  keys?: {}
}

export type EdgeCurrencyConfig = {
  +watch: Subscriber<EdgeCurrencyConfig>,

  +currencyInfo: EdgeCurrencyInfo,
  +otherMethods: Object,
  +userSettings: Object | void,

  changeUserSettings(settings: Object): Promise<mixed>
}

export type EthereumTransaction = {
  chainId: number, // Not part of raw data, but needed for signing
  nonce: string,
  gasPrice: string,
  gasLimit: string,
  to: string,
  value: string,
  data: string,
  // The transaction is unsigned, so these are not present:
  v?: string,
  r?: string,
  s?: string
}

// rates ---------------------------------------------------------------

export type EdgeRateCacheEvents = {
  update: mixed
}

export type EdgeRateCache = {
  +on: Subscriber<EdgeRateCacheEvents>,

  convertCurrency(
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<number>
}

// swap ----------------------------------------------------------------

/**
 * Information and settings for a currency swap plugin.
 */
export type EdgeSwapConfig = {
  +watch: Subscriber<EdgeSwapConfig>,

  +enabled: boolean,
  +needsActivation: boolean,
  +swapInfo: EdgeSwapInfo,
  +userSettings: Object | void,

  changeEnabled(enabled: boolean): Promise<mixed>,
  changeUserSettings(settings: Object): Promise<mixed>
}

export type EdgeSwapQuote = EdgeSwapPluginQuote & {
  +quoteUri?: string
}

// edge login ----------------------------------------------------------

export type EdgeLoginRequest = {
  +appId: string,
  approve(): Promise<mixed>,

  +displayName: string,
  +displayImageUrl: string | void
}

export type EdgeLobby = {
  +loginRequest: EdgeLoginRequest | void
  // walletRequest: EdgeWalletRequest | void
}

// storage -------------------------------------------------------------

export type EdgeDataStore = {
  deleteItem(storeId: string, itemId: string): Promise<mixed>,
  deleteStore(storeId: string): Promise<mixed>,

  listItemIds(storeId: string): Promise<Array<string>>,
  listStoreIds(): Promise<Array<string>>,

  getItem(storeId: string, itemId: string): Promise<string>,
  setItem(storeId: string, itemId: string, value: string): Promise<mixed>
}

// Deprecated:
export type EdgePluginData = {
  deleteItem(pluginId: string, itemId: string): Promise<mixed>,
  deletePlugin(pluginId: string): Promise<mixed>,

  listItemIds(pluginId: string): Promise<Array<string>>,
  listPluginIds(): Promise<Array<string>>,

  getItem(pluginId: string, itemId: string): Promise<string>,
  setItem(pluginId: string, itemId: string, value: string): Promise<mixed>
}

// account -------------------------------------------------------------

export type EdgeAccountEvents = {}

export type EdgeAccount = {
  +on: Subscriber<EdgeAccountEvents>,
  +watch: Subscriber<EdgeAccount>,

  // Data store:
  +id: string,
  +keys: any,
  +type: string,
  +disklet: Disklet,
  +localDisklet: Disklet,
  sync(): Promise<mixed>,

  // Basic login information:
  +appId: string,
  +loggedIn: boolean,
  +loginKey: string,
  +recoveryKey: string | void, // For email backup
  +username: string,

  // Special-purpose API's:
  +currencyConfig: EdgePluginMap<EdgeCurrencyConfig>,
  +rateCache: EdgeRateCache,
  +swapConfig: EdgePluginMap<EdgeSwapConfig>,
  +dataStore: EdgeDataStore,

  // What login method was used?
  +edgeLogin: boolean,
  +keyLogin: boolean,
  +newAccount: boolean,
  +passwordLogin: boolean,
  +pinLogin: boolean,
  +recoveryLogin: boolean,

  // Change or create credentials:
  changePassword(password: string): Promise<mixed>,
  changePin(opts: {
    pin?: string, // We keep the existing PIN if unspecified
    enableLogin?: boolean // We default to true if unspecified
  }): Promise<string>,
  changeRecovery(
    questions: Array<string>,
    answers: Array<string>
  ): Promise<string>,

  // Verify existing credentials:
  checkPassword(password: string): Promise<boolean>,
  checkPin(pin: string): Promise<boolean>,

  // Remove credentials:
  deletePassword(): Promise<mixed>,
  deletePin(): Promise<mixed>,
  deleteRecovery(): Promise<mixed>,

  // OTP:
  +otpKey: string | void, // OTP is enabled if this exists
  +otpResetDate: string | void, // A reset is requested if this exists
  cancelOtpReset(): Promise<mixed>,
  disableOtp(): Promise<mixed>,
  enableOtp(timeout?: number): Promise<mixed>,

  // Edge login approval:
  fetchLobby(lobbyId: string): Promise<EdgeLobby>,

  // Login management:
  logout(): Promise<mixed>,

  // Master wallet list:
  +allKeys: Array<EdgeWalletInfoFull>,
  changeWalletStates(walletStates: EdgeWalletStates): Promise<mixed>,
  createWallet(type: string, keys: any): Promise<string>,
  getFirstWalletInfo(type: string): ?EdgeWalletInfo,
  getWalletInfo(id: string): ?EdgeWalletInfo,
  listWalletIds(): Array<string>,
  listSplittableWalletTypes(walletId: string): Promise<Array<string>>,
  splitWalletInfo(walletId: string, newWalletType: string): Promise<string>,

  // Currency wallets:
  +activeWalletIds: Array<string>,
  +archivedWalletIds: Array<string>,
  +currencyWallets: { [walletId: string]: EdgeCurrencyWallet },
  createCurrencyWallet(
    type: string,
    opts?: EdgeCreateCurrencyWalletOptions
  ): Promise<EdgeCurrencyWallet>,
  waitForCurrencyWallet(walletId: string): Promise<EdgeCurrencyWallet>,

  // Web compatibility:
  signEthereumTransaction(
    walletId: string,
    transaction: EthereumTransaction
  ): Promise<string>,

  // Swapping:
  fetchSwapQuote(request: EdgeSwapRequest): Promise<EdgeSwapQuote>,

  // Deprecated names:
  +pluginData: EdgePluginData,
  +exchangeCache: EdgeRateCache,
  +currencyTools: EdgePluginMap<EdgeCurrencyConfig>,
  +exchangeTools: EdgePluginMap<EdgeSwapConfig>,
  getExchangeQuote(request: EdgeSwapRequest): Promise<EdgeSwapQuote>
}

// ---------------------------------------------------------------------
// context types
// ---------------------------------------------------------------------

export type EdgeCorePlugin =
  | EdgeCurrencyPlugin
  | EdgeRatePlugin
  | EdgeSwapPlugin

export type EdgeCorePlugins = EdgePluginMap<
  EdgeCorePlugin | ((env: EdgeCorePluginOptions) => EdgeCorePlugin)
>

export type EdgeCorePluginsInit = EdgePluginMap<boolean | Object>

export type EdgeContextOptions = {
  apiKey: string,
  appId: string,
  authServer?: string,
  hideKeys?: boolean,
  path?: string, // Only used on node.js
  plugins?: EdgeCorePluginsInit
}

// parameters ----------------------------------------------------------

export type EdgeEdgeLoginOptions = EdgeAccountOptions & {
  // Deprecated. The info server handles these now:
  displayImageUrl?: string,
  displayName?: string
}

export type EdgeLoginMessages = {
  [username: string]: {
    otpResetPending: boolean,
    recovery2Corrupt: boolean
  }
}

export type EdgePasswordRules = {
  secondsToCrack: number,
  tooShort: boolean,
  noNumber: boolean,
  noLowerCase: boolean,
  noUpperCase: boolean,
  passed: boolean
}

export type EdgePendingEdgeLogin = {
  +id: string,
  cancelRequest(): void
}

export type EdgeUserInfo = {
  pinLoginEnabled: boolean,
  username: string
}

// context -------------------------------------------------------------

export type EdgeContextEvents = {
  error: Error,
  login: EdgeAccount,
  loginStart: { username: string },
  loginError: { error: Error }
}

export type EdgeContext = {
  +on: Subscriber<EdgeContextEvents>,
  +watch: Subscriber<EdgeContext>,
  close(): Promise<mixed>,

  +appId: string,

  // Local user management:
  localUsers: Array<EdgeUserInfo>,
  fixUsername(username: string): string,
  listUsernames(): Promise<Array<string>>,
  deleteLocalAccount(username: string): Promise<mixed>,

  // Account creation:
  usernameAvailable(username: string): Promise<boolean>,
  createAccount(
    username: string,
    password?: string,
    pin?: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>,

  // Edge login:
  requestEdgeLogin(opts: EdgeEdgeLoginOptions): Promise<EdgePendingEdgeLogin>,

  // Fingerprint login:
  loginWithKey(
    username: string,
    loginKey: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>,

  // Password login:
  checkPasswordRules(password: string): EdgePasswordRules,
  loginWithPassword(
    username: string,
    password: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>,

  // PIN login:
  pinLoginEnabled(username: string): Promise<boolean>,
  loginWithPIN(
    username: string,
    pin: string,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>,

  // Recovery2 login:
  getRecovery2Key(username: string): Promise<string>,
  loginWithRecovery2(
    recovery2Key: string,
    username: string,
    answers: Array<string>,
    opts?: EdgeAccountOptions
  ): Promise<EdgeAccount>,
  fetchRecovery2Questions(
    recovery2Key: string,
    username: string
  ): Promise<Array<string>>,
  listRecoveryQuestionChoices(): Promise<Array<string>>,

  // OTP stuff:
  requestOtpReset(username: string, otpResetToken: string): Promise<Date>,
  fetchLoginMessages(): Promise<EdgeLoginMessages>
}

// ---------------------------------------------------------------------
// fake mode
// ---------------------------------------------------------------------

export type EdgeFakeUser = {
  username: string,
  loginId: string,
  loginKey: string,
  repos: Object,
  server: Object
}

export type EdgeFakeWorld = {
  close(): Promise<mixed>,

  makeEdgeContext(
    opts: EdgeContextOptions & { cleanDevice?: boolean }
  ): Promise<EdgeContext>,

  goOffline(offline?: boolean): Promise<mixed>,
  dumpFakeUser(account: EdgeAccount): Promise<EdgeFakeUser>
}
