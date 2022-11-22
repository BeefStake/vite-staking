import BigNumber from 'bignumber.js';
import { getCoingeckoClient } from './coingecko.client';

export enum MinionTokens {
    MINION = "tti_da32dc3230fd8d25b4f215f9"
}

export class MinionAPIClient {
  static tokens:string[] = [
    MinionTokens.MINION
  ]

  async getTokenPriceUSD(tokenId: string): Promise<BigNumber> {
    if(tokenId !== MinionTokens.MINION) throw new Error("Invalid token id");
    const coingecko = getCoingeckoClient()
    const vitePrice = await coingecko.getTokenPriceUSDAsync("Vite")
    return vitePrice.times("0.002") // presale price
  }
}

const client = new MinionAPIClient();

export const getMinionAPIClient = () => {
  return client;
}
