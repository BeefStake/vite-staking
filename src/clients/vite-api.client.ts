import axios from 'axios';

type BaseResult<T> = {
  code: number,
  data: T
}

export type TokenDetailResult = {
  name: string
  symbol: string
  originalSymbol: string
  tokenDecimals: number
  urlIcon: string
}
export type LPTokenValue = {
  contractAddress: string,
  tokenId: string,
  supply: string,
  usd: string,
  tokens: {
    contractAddress: string,
    tokenId: string,
    usd: string,
    total: string,
    amount: string,
    price: string
  }[]
}

export class ViteAPIClient {
  private readonly _baseUrl: string;
  static lptokens = [
    // VINUBNB
    "tti_e06b807b9c6fadd0391f8748",
    // VITCWBNB
    "tti_6312d2a685a9bd7a54250cb9",
    // VITCWONE
    "tti_f94c6bf7ffb1982691322d50",
    // VICATBNB
    "tti_135ae433038c18fe0797f528",
    // VIVABNB
    "tti_d05920af6f485fa52ffe4e69"
  ]

  constructor() {
    this._baseUrl = "https://vite-api.thomiz.dev"
  }

  async getTokenDetailAsync(tokenId: string): Promise<Maybe<TokenDetailResult>> {
    const result = await axios.get<BaseResult<TokenDetailResult>>(`${this._baseUrl}/crypto-info/tokens/${tokenId}/details`);
    return result.data.data;
  }

  async getLPTokenValue(tokenId: string): Promise<Maybe<LPTokenValue>>{
    const result = await axios.get<LPTokenValue>(`${this._baseUrl}/lptokens/${tokenId}`);
    return result.data;
  }
}

const client = new ViteAPIClient();

export const getViteAPIClient = () => {
  return client;
}
