import BigNumber from "bignumber.js";
import { CoingeckoClient, getCoingeckoClient } from "../clients/coingecko.client";
import { getMinionAPIClient, MinionAPIClient } from "../clients/minion.client";
import { getViteAPIClient, ViteAPIClient } from "../clients/vite-api.client";
import { TypeNames, UnknownToken } from "../common/constants";
import ActionQueue from "../common/queue";
import { CoinUtil, getCoinUtil } from "../util/coin.util";
import { getEmitter, IGlobalEmitter } from "../util/emitter.util";
import { Ensure } from "../util/ensure";
import { getLogger } from "../util/logger";
import { MomentUtil } from "../util/moment.util";
import { ContractPool, ContractPoolUserInfo, Network, Pool, PoolUserInfo, Token } from "../util/types";
import { getWalletManager, WalletAccount, WalletManager } from "../wallet";

const logger = getLogger();

export interface IDataSource {
  initAsync(network: Network): Promise<void>;
  dispose(): void;
  getAccountBalanceAsync(_account: string): Promise<BigNumber>;
  getNetworkBlockHeightAsync(): Promise<BigNumber>;
  getPoolAsync(_id: number, _account?: Maybe<string>): Promise<Pool>;
  getPoolsAsync(_account?: Maybe<string>): Promise<Pool[]>;
  getPoolUserInfoAsync(_poolId: number, _account?: Maybe<string>): Promise<Maybe<PoolUserInfo>>;
  getTokenAsync(_id: string): Promise<Token>;
  getTotalPoolsAsync(): Promise<number>;
  depositAsync(_id: number, _tokenId: string, _amount: string): Promise<boolean>;
  withdrawAsync(_id: number, _amount: string): Promise<boolean>;
}

export abstract class BaseDataSource implements IDataSource {
  protected readonly _emitter: IGlobalEmitter;
  private readonly _walletManager: WalletManager;
  private readonly _coingeckoClient: CoingeckoClient;
  private readonly _vitexClient: ViteAPIClient;
  private readonly _coinUtil: CoinUtil;
  private readonly _tokens: Map<string, Token>;
  private readonly _queue: ActionQueue<string>;
  private readonly _tokensURL: Map<string, string>;
  private _moment: MomentUtil = new MomentUtil();

  constructor() {
    this._emitter = getEmitter();
    this._walletManager = getWalletManager();
    this._coingeckoClient = getCoingeckoClient();
    this._vitexClient = getViteAPIClient();
    this._coinUtil = getCoinUtil();
    this._tokens = new Map<string, Token>();
    this._tokensURL = new Map<string, string>([
      ["tti_22d0b205bed4d268a05dfc3c", "https://vitamincoin.org/home"]
    ])
    this._queue = new ActionQueue<string>();
  }

  async initAsync(network: Network): Promise<void> {
    logger.info("Init BaseDataSource")();
    this._moment = new MomentUtil();
    await this.initAsyncProtected(network);
  }

  dispose(): void {
    logger.info("Disposing BaseDataSource")();
    this._tokens.clear();
    this.disposeProtected();
  }

  getAccount(): WalletAccount {
    const account = this._walletManager.getActiveAccount();
    Ensure.notNull(account, "account", "Please connect your wallet first.");
    return account as WalletAccount;
  }

  async getAprAsync(pool: Pool): Promise<Maybe<BigNumber>> {
    try {
      if (pool.endTimestamp >= 0 && (this._moment.isExpired(pool.endTimestamp) || pool.latestRewardBlock === pool.endBlock)) {
        // pool is closed, should not display numeric APR.
        return undefined;
      }
      const [
        rewardTokenPrice,
        stakingTokenPrice
      ] = await Promise.all([
        pool.rewardToken,
        pool.stakingToken
      ].map(token => {
        if(pool.rewardToken === pool.stakingToken)return new BigNumber(1)
        if(ViteAPIClient.lptokens.includes(token.id))return getViteAPIClient().getLPTokenValue(token.id)
          .then(data => new BigNumber(data?.usd || 0))

        if(MinionAPIClient.tokens.includes(token.id))return getMinionAPIClient().getTokenPriceUSD(token.id)
        
        return this._coingeckoClient.getTokenPriceUSDAsync(token.name)
      }));
      const totalTime = pool.endBlock.minus(pool.startBlock);
      const secondsInYear = new BigNumber(365 * 24 * 60 * 60);
      const usdRewardAmount = rewardTokenPrice.times(pool.totalRewards).shiftedBy(-pool.rewardToken.decimals)
        .times(pool.removedDecimals);
      const usdStakingAmount = stakingTokenPrice.times(pool.totalStaked).shiftedBy(-pool.stakingToken.decimals)
        .times(pool.removedDecimals);
      console.log(usdRewardAmount.toFixed(), usdStakingAmount.toFixed())
      const apr = new BigNumber(usdRewardAmount)
      .div(usdStakingAmount)
      .div(totalTime)
      .times(secondsInYear)
      .times(100)
      return !apr.isFinite() || apr.isNaN() ? undefined : apr;
    } catch (error) {
      logger.error(error)();
      return undefined;
    }
  }

  async getEndTimestampAsync(endBlock: BigNumber): Promise<number> {
    try {
      if (!endBlock || endBlock.lte(0)) {
        return -1;
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
    switch(id){
      case "tti_b60ec4474e94e38b232c37fb": {
        return {
          __typename: "Token",
          id,
          name: "GummyBearCoin",
          symbol: "GUMMYB",
          originalSymbol: "GUMMYB",
          decimals: 10,
          iconUrl: "gummyb",
          url: "https://vitamincoin.org"
        }
      }
    }
    try {
      if(this._tokens.has(id))return this._tokens.get(id) as Token;
      // @ts-ignore
      return await this._queue.queueAction<Token>(id, async () => {
        if(this._tokens.has(id))return this._tokens.get(id) as Token;
        const result = await this._vitexClient.getTokenDetailAsync(id);
        if(!result)return
        const token:Token = {
          __typename: "Token",
          id,
          name: result.name,
          symbol: result.symbol,
          originalSymbol: result.originalSymbol,
          decimals: result.tokenDecimals,
          iconUrl: result.urlIcon,
          url: this._tokensURL.get(id) || "https://coinmarketcap.com/currencies/" + this._coinUtil.mapCoinMarketCapName(result.name)
        }
        this._tokens.set(id, token);
        return token;
      });
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

  protected async toPoolAsync(id: number, p: ContractPool): Promise<Pool> {
    const [
      stakingToken,
      rewardToken,
      endTimestamp
    ] = await Promise.all([
      this.getTokenAsync(p.stakingTokenId),
      this.getTokenAsync(p.rewardTokenId),
      this.getEndTimestampAsync(new BigNumber(p.endBlock))
    ]);
    const pool: Pool = {
      __typename: TypeNames.Pool,
      id,
      stakingToken,
      rewardToken,
      totalStaked: new BigNumber(p.totalStakingBalance),
      totalRewards: new BigNumber(p.totalRewardBalance),
      startBlock: new BigNumber(p.startBlock),
      endBlock: new BigNumber(p.endBlock),
      endTimestamp,
      latestRewardBlock: new BigNumber(p.latestRewardBlock),
      rewardPerPeriod: new BigNumber(p.rewardPerPeriod),
      rewardPerToken: new BigNumber(p.rewardPerToken),
      paidOut: new BigNumber(p.paidOut),
      fetchTimestamp: this._moment.get().unix(),
      removedDecimals: new BigNumber(p.removedDecimals || 1),
      timelock: new BigNumber(p.timelock || 0)
    };
    return pool;
  }

  protected async toPoolUserInfoAsync(u: ContractPoolUserInfo): Promise<PoolUserInfo> {
    return {
      __typename: TypeNames.PoolUserInfo,
      id: `${u.address}_${u.poolId}`,
      poolId: u.poolId,
      account: u.address,
      stakingBalance: new BigNumber(u.stakingBalance),
      rewardDebt: new BigNumber(u.rewardDebt),
      depositBlock: new BigNumber(u.depositBlock)
    }
  }

  protected abstract initAsyncProtected(network: Network): Promise<void>;

  protected abstract disposeProtected(): void;

  abstract getAccountBalanceAsync(_account: string): Promise<BigNumber>;

  abstract getNetworkBlockHeightAsync(): Promise<BigNumber>;

  abstract getPoolAsync(_id: number, _account?: Maybe<string>): Promise<Pool>;

  abstract getPoolsAsync(_account?: Maybe<string>): Promise<Pool[]>;

  abstract getPoolUserInfoAsync(_poolId: number, _account?: Maybe<string>): Promise<Maybe<PoolUserInfo>>;

  abstract getTotalPoolsAsync(): Promise<number>;

  abstract depositAsync(_id: number, _tokenId: string, _amount: string): Promise<boolean>;

  abstract withdrawAsync(_id: number, _amount: string): Promise<boolean>;
}