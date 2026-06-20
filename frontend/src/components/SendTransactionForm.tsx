import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { isValidStellarPublicKey } from "../lib/stellar";

interface SendTransactionFormProps {
  isConnected: boolean;
  onSend: (destination: string, amount: string, memo?: string) => Promise<string>;
}

export function SendTransactionForm({ isConnected, onSend }: SendTransactionFormProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    
    setError(null);
    setTxHash(null);

    // Validation
    if (!destination) {
      setError("Destination public key is required");
      return;
    }
    if (!isValidStellarPublicKey(destination)) {
      setError("Invalid Stellar public key format");
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    setIsSending(true);
    try {
      const hash = await onSend(destination, amount, memo);
      setTxHash(hash);
      setDestination("");
      setAmount("");
      setMemo("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400">Connect your wallet to send transactions.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Send className="w-5 h-5 text-indigo-400" />
        Send XLM
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {txHash && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg text-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-semibold">Transaction Successful!</p>
          </div>
          <div className="pl-7">
            <p className="text-xs text-green-500/70 mb-2">Transaction Hash:</p>
            <p className="font-mono text-xs break-all bg-green-500/5 p-2 rounded border border-green-500/20 mb-3">
              {txHash}
            </p>
            <a 
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1.5 rounded transition-colors"
            >
              View on Explorer <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Destination Public Key</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="glass-input"
            placeholder="G..."
            disabled={isSending}
          />
        </div>
        
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Amount (XLM)</label>
          <input
            type="number"
            step="0.0000001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="glass-input"
            placeholder="0.0"
            disabled={isSending}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Memo (Optional)</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="glass-input"
            placeholder="Text memo..."
            maxLength={28}
            disabled={isSending}
          />
        </div>

        <button
          type="submit"
          disabled={isSending || !destination || !amount}
          className="btn-primary mt-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Transaction
            </>
          )}
        </button>
      </form>
    </div>
  );
}
