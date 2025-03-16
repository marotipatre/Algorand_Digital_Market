// src/components/Home.tsx
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import React, { useEffect, useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import MethodCall from './components/MethodCall'
import { DigitalMarketClient, DigitalMarketFactory } from './contracts/DigitalMarket'
import * as methods from './methods'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {

  // algokit.Config.configure({ populateAppCallResources: true }) ***no need of this now
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)

  // Wallet connection state
  const { activeAccount, activeAddress, signer: TransactionSigner } = useWallet()


  //assetId, unitaryPrice, quantity
  const [appId, setAppId] = useState<bigint>(BigInt(0))
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n)
  const [changeprice, setChangePrice] = useState<bigint>(0n)
  const [quantity, setQuantity] = useState<bigint>(0n)
  const [unitsleft, setUnitsLeft] = useState<bigint>(0n)
  const [seller, setSeller] = useState<string >("")
  const [assetname, setassetname] = useState<string>("")
  const[int_quantity, setInt_quanity] = useState<bigint>(0n)
  const [hasAsset, sethasAsset] = useState<boolean>(false);

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
    console.log('inside fetchstate')
    try {
      if (!activeAccount) throw new Error('Please connect wallet first')
      if (!appId) throw new Error('App ID is required')

      const dmClient = new DigitalMarketClient({
        appId: BigInt(appId),
        algorand: algorand,
        defaultSigner: TransactionSigner,
      })

      console.log('state.assetid.value above')
      setAssetId(BigInt(0))




      const state = await dmClient.appClient.getGlobalState()


      setUnitaryPrice(BigInt(state.unitaryprice.value))

      console.log('state.assetid.value ', state.assetid.value)


      setAssetId(BigInt(state.assetid.value))

      const info = await algorand.asset.getAccountInformation(algosdk.getApplicationAddress(appId), BigInt(state.assetid.value))

      const asset_info = await algorand.asset.getById(BigInt(state.assetid.value))

      await algorand.client.algod
        .getApplicationByID(Number(appId))
        .do()
        .then((app) => {
          setSeller(app.params.creator)
        })


      setUnitsLeft(info.balance)
      setassetname(asset_info.assetName || "")

      // console.log(BigInt(state.unitaryprice.value))
      // console.log(BigInt(state.assetid.value))
      // console.log(info.balance)
    } catch (e) {
      console.log('inside catch')
      setUnitaryPrice(0n)
      // setAssetId(0n)
      // setUnitsLeft(0n)
      console.error(e)
    }
  }

  useEffect(() => {
    console.log('inside useeffect')

    fetchstate()
  }, [appId])

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
            Digital Market - Sell your asset at your fingertips
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
             {appId === BigInt(0) && (
            <div>

            <div className='divider'/>
            <label className="label flex items-center">
            <span className="ml-2">Do you have Asset?</span>
            <input
                type="checkbox"
                className="checkbox checkbox-primary"
                onChange={(e)=>{
                  sethasAsset(e.currentTarget.checked)
                }}
                  />
            </label>
            </div>
                )}

            <div className="divider" />
            {hasAsset && activeAddress && appId === BigInt(0) && (
                <div>
                    <label className="label">Asset ID</label>
                    <input
                  type="number"
                  className="input input-bordered"
                  value={(assetId).toString()}
                  onChange={(e) => {
                    setAssetId(BigInt(e.currentTarget.valueAsNumber || 0))
                  }}
                />
                <label className="label">Asset Quantity To be Sold</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={(int_quantity).toString()}
                  onChange={(e) => {
                    setInt_quanity(BigInt(e.currentTarget.valueAsNumber || 0))
                  }}
                />
                </div>
            )}
            { !hasAsset && activeAddress && appId === BigInt(0) && (
              <div>
                <label className="label">Unitary Price</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={(unitaryPrice / BigInt(10e5)).toString()}
                  onChange={(e) => {
                    setUnitaryPrice(BigInt(e.currentTarget.valueAsNumber || 0) * BigInt(10e5))
                  }}
                />
                <label className="label">Asset Name</label>
                <input
                type = "text"
                className='input input-bordered'
                value={assetname?.toString()}
                onChange={(e) => {
                  setassetname(e.currentTarget.value || "")
                }} />
                <label className="label">Asset Quantity</label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={(int_quantity).toString()}
                  onChange={(e) => {
                    setInt_quanity(BigInt(e.currentTarget.valueAsNumber || 0))
                  }}
                />
                </div>
                )}
                {appId === BigInt(0) && (
                <div className=''>
                <MethodCall
                  methodFunction={methods.create(
                    algorand,
                    dmFactory,
                    dmClient,
                    assetId,
                    unitaryPrice,
                    activeAddress!,
                    int_quantity,
                    TransactionSigner,
                    assetname,
                    "https://ipfs.io/ipfs/bafybeihgaevhc5ryia7ooz4uln4hzvd6ob5a5t7lynpohueqdeer274l3m#arc3",
                    setAppId,
                  )}
                  text="Create Application"
                />
                </div>
                )}




            {appId !== BigInt(0) && (

              <div>
                <div className="divider" />
                <label className="label">Asset ID</label>
                <input type="text" className="input input-bordered" value={assetId.toString()} readOnly />
                <label className="label">Asset Name</label>
                <input
                type = "text"
                className='input input-bordered'
                value={assetname?.toString()}
                readOnly />
                <label className="label">Units Left</label>
                <input type="text" className="input input-bordered" value={unitsleft.toString()} readOnly />

              </div>
            )}

            {appId!== BigInt(0) && activeAddress === seller && unitsleft > 0n && (
              <div>
                <div className="divider" />
                <label className='label'>Change Asset Prize</label>
                <input type="number" className='input input-bordered' value={(changeprice / BigInt(10e5)).toString()} onChange={(e) => setChangePrice(BigInt(e.currentTarget.valueAsNumber || 0) * BigInt(10e5))} />
                <MethodCall
                  text='Set Price'
                  methodFunction={methods.setprice(algorand, dmFactory, dmClient, activeAddress!, changeprice, TransactionSigner,setUnitaryPrice)}/>

              </div>

              )}


              {activeAddress! && appId !== BigInt(0) && unitsleft > 0n && (
                <div>
                  <div className="divider" />
                  <label className="label">Price Per Unit</label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={(unitaryPrice / BigInt(10e5)).toString()}
                    readOnly
                  />
                  <label className="label">Desired Quantity</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={quantity.toString()}
                    min="1"
                    max="1"
                    onChange={(e) => {
                      const inputValue = e.currentTarget.valueAsNumber || 0;
                      // Ensure the quantity is always 1
                      setQuantity(inputValue > 1 ? BigInt(1) : BigInt(inputValue));
                    }}
                  />
                  <MethodCall
                    text={`Buy ${quantity} for ${(unitaryPrice * BigInt(quantity)) / BigInt(10e5)} AlGO`}
                    methodFunction={methods.buy(
                      algorand,
                      dmFactory,
                      dmClient,
                      activeAddress!,
                      algosdk.getApplicationAddress(appId),
                      assetId,
                      quantity,
                      unitaryPrice,
                      TransactionSigner,
                      seller,
                      setUnitsLeft,
                    )}
                  />
                </div>
              )}

            {appId !== BigInt(0) && assetId !== BigInt(0) && unitsleft <= 0n && activeAddress !== seller && (
              <div>
                <div className="divider" />
                <p className="text-red-500">No units left</p>
              </div>
            )}

            {appId !== BigInt(0) && activeAddress === seller && (
              <MethodCall
                text="Delete App"
                methodFunction={methods.deleteApp(algorand, dmFactory, dmClient, assetId, activeAddress!, TransactionSigner, setAppId)}
              />
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
