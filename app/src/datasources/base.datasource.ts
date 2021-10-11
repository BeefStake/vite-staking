import BigNumber from "bignumber.js";
import { getVitexClient, VitexClient } from "../clients/vitex.client";
import { DefaultPoolFilterValues, UnknownToken } from "../common/constants";
import { CommonUtil } from "../util/common.util";
import { getEmitter, IGlobalEmitter } from "../util/emitter.util";
import { Ensure } from "../util/ensure";
import { getLogger } from "../util/logger";
import { MomentUtil } from "../util/moment.util";
import { GlobalEvent, Pool, PoolFilterValues, PoolUserInfo, Token } from "../util/types";
import { getWalletManager, WalletAccount, WalletManager } from "../wallet";

const logger = getLogger();

export interface IDataSource {
  initAsync(): Promise<void>;
  dispose(): void;
  getBalanceAsync(_address: string): Promise<BigNumber>;
  getNetworkBlockHeightAsync(): Promise<BigNumber>;
  getPoolAsync(id: number): Promise<Pool>;
  getPoolsAsync(): Promise<Pool[]>;
  getPoolUserInfoAsync(poolId: number, address?: string): Promise<Maybe<PoolUserInfo>>;
  getTokenAsync(id: string): Promise<Token>;
  getTotalPoolsAsync(): Promise<number>;
}

export abstract class BaseDataSource implements IDataSource {
  private readonly _emitter: IGlobalEmitter;
  private readonly _walletManager: WalletManager;
  private readonly _vitexClient: VitexClient;
  private readonly _tokens: Map<string, Token>;
  private _moment: MomentUtil = new MomentUtil();
  private _poolFilterValues: PoolFilterValues = DefaultPoolFilterValues;

  constructor() {
    this._emitter = getEmitter();
    this._walletManager = getWalletManager();
    this._vitexClient = getVitexClient();
    this._tokens = new Map<string, Token>();
  }

  async initAsync(): Promise<void> {
    logger.info("Init BaseDataSource")();
    this._moment = new MomentUtil();
    this._poolFilterValues = DefaultPoolFilterValues;
    this._emitter.on(GlobalEvent.PoolFilterValuesChanged, this.handlePoolFilterValuesChanged);
    await this.initAsyncProtected();
  }

  dispose(): void {
    logger.info("Disposing BaseDataSource")();
    this._emitter.off(GlobalEvent.PoolFilterValuesChanged, this.handlePoolFilterValuesChanged);
    this.disposeProtected();
  }

  private handlePoolFilterValuesChanged(oldValues: PoolFilterValues, newValues: PoolFilterValues): void {
    if (!CommonUtil.equals(oldValues, newValues)) {
      console.log(newValues);
      this._poolFilterValues = newValues;
    }
  }

  getAccount(): WalletAccount {
    const account = this._walletManager.getActiveAccount();
    Ensure.notNull(account, "account", "Please connect your wallet first.");
    return account as WalletAccount;
  }

  async getEndTimestampAsync(endBlock: BigNumber): Promise<number> {
    try {
      if (!endBlock || endBlock.lte(0)) {
        return 0;
      }
      const networkBlockHeight = await this.getNetworkBlockHeightAsync();
      const remainingSeconds = endBlock.minus(networkBlockHeight);
      if (remainingSeconds.lte(0)) {
        return 0;
      }
      return this._moment.get().add(remainingSeconds.toNumber(), "seconds").unix();
    } catch (error) {
      logger.error(error)();
    }
    return 0;
  }

  async getTokenAsync(id: string): Promise<Token> {
    try {
      const existing = this._tokens.get(id);
      if (existing) {
        return existing;
      }
      const result = await this._vitexClient.getTokenDetailAsync(id);
      if (result) {
        const token = {
          __typename: "Token",
          id,
          name: result.name,
          symbol: result.symbol,
          originalSymbol: result.originalSymbol,
          decimals: result.tokenDecimals,
          iconUrl: result.urlIcon,
          url: "https://coinmarketcap.com/currencies/" + result.name.replace(" ", "-")
        }
        this._tokens.set(id, token);
        return token;
      }
    } catch (error) {
      logger.error(error)();
    }
    const unknownToken = {
      ...UnknownToken,
      id
    }
    this._tokens.set(id, unknownToken);
    return unknownToken;
  }

  async getFilteredPoolsAsync(): Promise<void> {
    // 1. Load all pools if empty
    // 2. Apply filter to base pools
    // 3. Return filtered pools
  }

  protected abstract initAsyncProtected(): Promise<void>;

  protected abstract disposeProtected(): void;

  abstract getBalanceAsync(_address: string): Promise<BigNumber>;

  abstract getNetworkBlockHeightAsync(): Promise<BigNumber>;

  abstract getPoolAsync(id: number): Promise<Pool>;

  abstract getPoolsAsync(): Promise<Pool[]>;

  abstract getPoolUserInfoAsync(poolId: number, address?: string): Promise<Maybe<PoolUserInfo>>;

  abstract getTotalPoolsAsync(): Promise<number>;
}