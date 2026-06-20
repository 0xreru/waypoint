
import { StellarWalletPanel } from './components/StellarWalletPanel';
import { SendTransactionForm } from './components/SendTransactionForm';
import { useStellarWallet } from './hooks/useStellarWallet';

function App() {
  const wallet = useStellarWallet();

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <header className="w-full max-w-5xl mb-12 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Waypoint Vault
        </h1>
        <p className="text-slate-400 max-w-2xl text-lg">
          A trust-minimized, cross-border milestone escrow contract built on Stellar's Soroban platform.
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 flex flex-col gap-8">
          <StellarWalletPanel
            publicKey={wallet.publicKey}
            isConnected={wallet.isConnected}
            balance={wallet.balance}
            isConnecting={wallet.isConnecting}
            isLoadingBalance={wallet.isLoadingBalance}
            error={wallet.error}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
            onRefreshBalance={wallet.refreshBalance}
          />
        </div>
        
        <div className="md:col-span-7">
          <SendTransactionForm 
            isConnected={wallet.isConnected}
            onSend={wallet.sendXlm}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
