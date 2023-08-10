import BigNumber from 'bignumber.js';
import { getCoingeckoClient } from './coingecko.client';

export enum WolkTokens {
    WOLK = "tti_e52613a75562cc20917785fd"
}

export class WolkAPIClient {
  static tokens:string[] = [
    WolkTokens.WOLK
  ]

  async getTokenPriceUSD(tokenId: string): Promise<BigNumber> {
    if(tokenId !== WolkTokens.WOLK) throw new Error("Invalid token id");
    const coingecko = getCoingeckoClient()
    const vitePrice = await coingecko.getTokenPriceUSDAsync("Vite")
    return vitePrice.times("0.002") // presale price
  }
}

const client = new WolkAPIClient();

export const getWolkAPIClient = () => {
  return client;
}
