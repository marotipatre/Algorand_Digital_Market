// src/components/Home.tsx
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { DigitalMarketClient, DigitalMarketFactory } from './contracts/DigitalMarket'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import MethodCall from './components/MethodCall'
import * as methods from './methods'
import algosdk from 'algosdk'



interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  // algokit.Config.configure({ populateAppCallResources: true })
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  // Wallet connection state
  const {activeAccount,activeAddress,signer: TransactionSigner } = useWallet()

  const [appId, setAppId] = useState<bigint>(BigInt(0))

  //assetId, unitaryPrice, quantity
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n)
  const [quantity, setQuantity] = useState<bigint>(0n)
  const [ unitsleft, setUnitsLeft] = useState<bigint>(0n)
  const [seller, setSeller] = useState<string | undefined>(undefined)


  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = algokit.AlgorandClient.fromConfig({ algodConfig })
  algorand.setDefaultSigner(TransactionSigner)

  const dmFactory = new DigitalMarketFactory({
    algorand: algorand,
    defaultSender: activeAccount?.address,
    defaultSigner: TransactionSigner,
  })

  const dmClient = new DigitalMarketClient({
    appId: BigInt(appId),
    algorand: algorand,
    defaultSigner: TransactionSigner,
  })
  const fetchstate = async () => {
    
    try {
      if (!activeAccount) throw new Error("Please connect wallet first");
      if (!appId) throw new Error("App ID is required");

      const dmClient = new DigitalMarketClient({
        appId: BigInt(appId),
        algorand: algorand,
        defaultSigner: TransactionSigner,
      });
      const state = await dmClient.appClient.getGlobalState();

      setUnitaryPrice(BigInt(state.unitaryprice.value));
      
      setAssetId(BigInt(state.assetid.value));
    

      const info = await algorand.asset.getAccountInformation(algosdk.getApplicationAddress(appId), assetId!)

    
      algorand.client.algod.getApplicationByID(Number(appId)).do().then((app) =>
        {
          setSeller(app.params.creator)
        })
      
      setUnitsLeft(info.balance)
      console.log(BigInt(state.unitaryprice.value))
      console.log(BigInt(state.assetid.value))
      console.log(info.balance)
    

  }

    catch (e) {
      setUnitaryPrice(0n)
      setAssetId(0n)
      setUnitsLeft(0n)
      console.error(e);
    }
  };

  
  
  useEffect(() => {
    fetchstate();
  }
  , [appId,assetId]);

  // useEffect(() => {
  //   dmClient.appClient.getGlobalState().then((globalState) => {
  //     setUnitaryPrice(BigInt(globalState.unitaryprice.value))
  //     console.log(globalState.unitaryprice.value)
  //     console.log(globalState.assetid.value)
  //     const id = BigInt(globalState.asseid.value) || 0n
  //     setAssetId(id)
  //   }).catch(() => {
  //     setUnitaryPrice(0n)
  //     setAssetId(0n)
  //   })
  // },
  // [appId])

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">AlgoKit 🙂</div>
          </h1>
          <p className="py-6">
            This starter has been generated using official AlgoKit React template. Refer to the resource below for next steps.
          </p>

          <div className="grid">
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>
            <div className="divider" />
            <label className="label">App Id</label>
            <input
              type="number"
              value={appId.toString()}
              onChange={(e) => setAppId(BigInt(e.target.value))}
              className="input input-bordered"
            />
            
            <div className="divider" />
            {activeAddress && appId === BigInt(0) && (<div>
              <label className="label">Unitary Price</label>
              <input type="number" className='input input-bordered' value={(unitaryPrice/BigInt(10e6)).toString()} onChange={(e) => {setUnitaryPrice(BigInt(e.currentTarget.valueAsNumber || 0)*BigInt(10e6))}} />
              <MethodCall
                methodFunction={methods.create(algorand,dmFactory,dmClient,assetId,unitaryPrice,activeAddress!, 10n, TransactionSigner,setAppId)}
                text="Create Application"
              />
            </div>) }

            <div className="divider" />
            {appId !== BigInt(0) && (
              <div>
                <label className="label">Asset ID</label>
                <input type="text" className='input input-bordered' value={assetId.toString()} readOnly />
                <label className="label">Units Left</label>
                <input type="text" className='input input-bordered' value={unitsleft.toString()} readOnly />
              </div>
            )}

            <div className="divider" />
            {activeAddress && appId !== BigInt(0) && unitsleft > 0n && (
              <div>
              <label className="label">Price Per Unit</label>
              <input type="text" className='input input-bordered' value={(unitaryPrice/BigInt(10e6)).toString()} readOnly />
              <label className="label">Desired Quantity</label>
              <input type="number" className='input input-bordered' value={quantity.toString()} onChange={(e) => {setQuantity(BigInt(e.currentTarget.valueAsNumber || 0))}} />
              <MethodCall text={`Buy ${quantity} for ${(unitaryPrice * BigInt(quantity)/BigInt(10e6))} AlGO`} methodFunction={methods.buy(algorand,dmFactory,dmClient,activeAddress!,algosdk.getApplicationAddress(appId),assetId,quantity,unitaryPrice,TransactionSigner,setUnitsLeft)}/> 

              </div>
            ) }

            {appId !== BigInt(0) && unitsleft <=0n && activeAddress!== seller && (
              <div>
                <p className="text-red-500">No units left</p>
              </div>
            )}


            {appId !== BigInt(0) && unitsleft <=0n && activeAddress === seller &&(
              <MethodCall text="Delete App" methodFunction={methods.deleteApp(algorand,dmFactory,dmClient,assetId,activeAddress!,TransactionSigner,setAppId)} />
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
