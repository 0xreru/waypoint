
import { Wallet, RefreshCw, LogOut } from "lucide-react";

interface StellarWalletPanelProps {
  publicKey: string | null;
  isConnected: boolean;
  balance: string | null;
  isConnecting: boolean;
  isLoadingBalance: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshBalance: () => void;
}

export function StellarWalletPanel({
  publicKey,
  isConnected,
  balance,
  isConnecting,
  isLoadingBalance,
  error,
  onConnect,
  onDisconnect,
  onRefreshBalance,
}: StellarWalletPanelProps) {
  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-400" />
          Freighter Wallet
        </h2>
        {isConnected ? (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        ) : null}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Wallet className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-400 text-center mb-6 max-w-sm">
            Connect your Freighter wallet on the Stellar Testnet to check balances and send XLM.
          </p>
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="btn-primary w-full max-w-xs"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </span>
            ) : (
              "Connect Freighter Wallet"
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <p className="text-sm text-slate-500 mb-1">Public Key</p>
            <p className="font-mono text-sm break-all text-slate-200">
              {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
            </p>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Testnet Balance</p>
              {isLoadingBalance ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-white">
                  {balance ? parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "0"} <span className="text-indigo-400 text-lg">XLM</span>
                </p>
              )}
            </div>
            <button
              onClick={onRefreshBalance}
              disabled={isLoadingBalance}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-5 h-5 text-indigo-400 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
