import * as algokit from '@algorandfoundation/algokit-utils';
import { DigitalMarketClient, DigitalMarketFactory } from './contracts/DigitalMarket';
import { TransactionSigner } from 'algosdk';


//using appfactory client from client file
export function create(algorand: algokit.AlgorandClient, dmFactory: DigitalMarketFactory , dmClient: DigitalMarketClient, assetBeingSold: bigint, unitaryPrice: bigint, sender: string, quantity: bigint , dec:number, signer: TransactionSigner,assetname: string, url: string,
setAppId: (id: bigint) => void,
) {

  console.log(unitaryPrice)
  return async () => {
    let assetId = assetBeingSold

    if(assetId == 0n)
{
    const assetCreate = await algorand.send.assetCreate({
      sender,
      total: quantity,
      decimals: dec,
      assetName: assetname,
      unitName: assetname.substring(0, 3),
      url: url,

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

export function setprice(algorand: algokit.AlgorandClient, dmFactory:DigitalMarketFactory, dmClient: DigitalMarketClient, sender: string, unitaryPrice: bigint, signer: TransactionSigner,setUnitaryPrice: (id : bigint) => void, ) {
  return async () => {
    await dmClient.send.setPrice({ args: [unitaryPrice], sender: sender, assetReferences:[] })
    setUnitaryPrice(unitaryPrice);
  }
}

//buy function to buy the asset

export function buy(algorand: algokit.AlgorandClient, dmFactory: DigitalMarketFactory , dmClient: DigitalMarketClient, sender: string, appAddress: string,assetID: bigint, quantity: bigint, unitaryPrice: bigint, signer: TransactionSigner, seller:string , setUnitsLeft: (units: bigint) => void) {
  return async () => {
    try {
      // Check if the user already has the asset in their wallet
      const accountInfo = await algorand.asset.getAccountInformation(sender, assetID);
      if (accountInfo && accountInfo.balance > 0n) {
        alert('You already own this asset. You cannot purchase it again.');
        return; // Exit the function if the user already owns the asset
      }
    } catch (error) {
      // If the user doesn't have the asset, proceed with the purchase
      console.log('User does not own the asset. Proceeding with purchase...');
    }

      console.log(quantity)
      console.log(unitaryPrice)
      const buyerTxn = await algorand.createTransaction.payment({
        sender,
        receiver: appAddress,
        amount: algokit.microAlgos(Number(quantity*unitaryPrice)),
        extraFee: algokit.microAlgos(1000),
      })
      console.log(buyerTxn)

      // Add a valid condition or remove the if statement if not needed
      try {
        await algorand.asset.getAccountInformation(sender, assetID);

      } catch (error) {
        console.error('Error fetching account information or opting in:', error);
        await algorand.send.assetOptIn({ sender: sender, assetId: assetID });
      }

      const result = await dmClient.send.buy({ args: [buyerTxn, quantity], sender: sender, assetReferences:[assetID] })
      console.log(result)
      const state = await dmClient.appClient.getGlobalState()
      const assetId = state.assetid.value as bigint;
      const info = await algorand.asset.getAccountInformation(appAddress, assetId)
      setUnitsLeft(info.balance)
      alert('Purchase successful!');
}


}


//deleting the app and withdrawing the profit
export function deleteApp(algorand: algokit.AlgorandClient, dmFactory: DigitalMarketFactory , dmClient: DigitalMarketClient,assetID:bigint,sender: string,signer: TransactionSigner,
setAppId: (id: bigint) => void) {
  return async () => {
     await dmClient.send.delete.deleteApplication({args: [],sender: sender,assetReferences:[assetID]})
      setAppId(BigInt(0))
  }
}
