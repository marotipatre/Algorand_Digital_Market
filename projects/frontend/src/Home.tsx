// src/components/Home.tsx
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import { DigitalMarketClient, DigitalMarketFactory } from './contracts/DigitalMarket'
import { getAlgodConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import MethodCall from './components/MethodCall'
import * as methods from './methods'


interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  // algokit.Config.configure({ populateAppCallResources: true })
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  // Wallet connection state
  const {activeAccount,activeAddress,signer } = useWallet()

  const [appId, setAppId] = useState<bigint>(BigInt(0))

  //assetId, unitaryPrice, quantity
  const [assetId, setAssetId] = useState<bigint>(0n)
  const [unitaryPrice, setUnitaryPrice] = useState<bigint>(0n)
  const [quantity, setQuantity] = useState<bigint>(0n)


  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = algokit.AlgorandClient.fromConfig({ algodConfig })
  algorand.setDefaultSigner(signer)

  const dmFactory = new DigitalMarketFactory({
    algorand: algorand,
    defaultSender: activeAccount?.address,
    defaultSigner: signer,
  })

  const dmClient = new DigitalMarketClient({
    appId: BigInt(appId),
    algorand: algorand,
    defaultSigner: signer,
  })

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
              <MethodCall
                methodFunction={methods.create(algorand,dmFactory,dmClient,assetId,unitaryPrice,activeAddress!, 10n, signer,setAppId)}
                text="Create Application"
              />
            </div>) }
            <label className="label">Network</label>
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
