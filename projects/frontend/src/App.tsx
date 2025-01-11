
import { WalletId, WalletProvider,WalletManager, SupportedWallet,NetworkId } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import Home from './Home'

let providersArray: SupportedWallet[] = []
let network = NetworkId.TESTNET
if (import.meta.env.VITE_ALGOD_NETWORK === '') {
  providersArray = [
    WalletId.KMD
  ]
  console.log(providersArray)
  network = NetworkId.LOCALNET
} else {
  providersArray = [
    WalletId.DEFLY,
    WalletId.PERA,
  ]
}

const walletManager = new WalletManager({
  wallets: providersArray,
  network: network,
})

export default function App() {

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <Home />
      </WalletProvider>
    </SnackbarProvider>
  )
}
