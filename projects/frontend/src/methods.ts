import * as algokit from '@algorandfoundation/algokit-utils';
import { DigitalMarketClient, DigitalMarketFactory } from './contracts/DigitalMarket';
import { TransactionSigner } from 'algosdk';


//using appfactory client from client file
export function create(algorand: algokit.AlgorandClient, dmFactory: DigitalMarketFactory , dmClient: DigitalMarketClient, assetBeingSold: bigint, unitaryPrice: bigint, sender: string, quantity: bigint , signer: TransactionSigner,
setAppId: (id: bigint) => void,
) {
  return async () => {
    let assetId = assetBeingSold

    if(assetId == 0n)
{
    const assetCreate = await algorand.send.assetCreate({ 
      sender,
      total: quantity,
    })

    console.log(assetCreate)

    assetId = BigInt(assetCreate.confirmation.assetIndex!)
}
    const result = await dmFactory.send.create.createApplication({ args: [assetId, unitaryPrice] , sender});

    
    const newClient = new DigitalMarketClient({ appId: result.appClient.appId, algorand: algorand, defaultSigner: signer })

    const mbrpay = await algorand.createTransaction.payment({
      sender,
      receiver: result.appClient.appAddress,
      amount: algokit.algos(0.1+0.1),
      extraFee: algokit.algos(0.001)
    })

    console.log(assetId)

    await newClient.send.optInToAsset({ args: [mbrpay], sender: sender,assetReferences:[assetId] })

    await algorand.send.assetTransfer({
      sender,
      assetId,
      receiver: result.appClient.appAddress,
      amount: quantity,
    })

    setAppId(BigInt(result.appClient.appId))
  }



}


//buy function to buy the asset

export function buy(algorand: algokit.AlgorandClient, dmFactory: DigitalMarketFactory , dmClient: DigitalMarketClient, sender: string, appAddress: string, quantity: bigint, unitaryPrice: bigint, setUnitsLeft: (units: bigint) => void) {
  return async () => {
      const buyerTxn = await algorand.createTransaction.payment({
        sender,
        receiver: appAddress,
        amount: algokit.microAlgos(Number(quantity*unitaryPrice))
      })

      const state = await dmClient.appClient.getGlobalState()
      const assetId = state.assetId.value as bigint;
      const info = await algorand.asset.getAccountInformation(appAddress, assetId)
      setUnitsLeft(info.balance)
}


}


//deleting the app and withdrawing the profit
export function deleteApp(algorand: algokit.AlgorandClient, dmFactory: DigitalMarketFactory , dmClient: DigitalMarketClient,
setAppId: (id: number) => void) {
  return async () => {
     await dmClient.send.delete.deleteApplication({args: []})
      setAppId(0)
  }
}
