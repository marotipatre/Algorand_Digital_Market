import * as algokit from  '@algorandfoundation/algokit-utils';
import { DigitalMarketClient , DigitalMarketFactory } from './contracts/DigitalMarket';

export function create(algorand: algokit.AlgorandClient, dmClient: DigitalMarketFactory , assetBeingSolf: bigint, unitaryPrice: bigint) {
  return async () => {
    await dmClient.send.create.createApplication({ args: [assetBeingSolf, unitaryPrice] })
  }}  

