import { useState, useEffect, useCallback } from "react";
import {
  isConnected as freighterIsConnected,
  setAllowed as freighterSetAllowed,
  getAddress as freighterGetAddress,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, STELLAR_NETWORK_PASSPHRASE } from "../lib/stellar";

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  balance: string | null;
  isConnecting: boolean;
  isLoadingBalance: boolean;
  error: string | null;
}

export function useStellarWallet() {
  const [state, setState] = useState<WalletState>({
    publicKey: null,
    isConnected: false,
    balance: null,
    isConnecting: false,
    isLoadingBalance: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    try {
      const connected = await freighterIsConnected();
      if (connected) {
        // If they already authorized us before, we can get the address silently or just wait for them to click connect.
        // For level 1, we rely on connect action.
        const storedKey = localStorage.getItem("freighterPublicKey");
        if (storedKey) {
          setState((prev) => ({ ...prev, publicKey: storedKey, isConnected: true }));
          fetchBalance(storedKey);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const connected = await freighterIsConnected();
      if (!connected) {
        throw new Error("Freighter wallet is required. Install the Freighter browser extension and switch to Testnet.");
      }
      
      const allowed = await freighterSetAllowed();
      if (!allowed) {
        throw new Error("User rejected connection.");
      }

      const response = await freighterGetAddress();
      let address = "";
      if (typeof response === "string") {
        address = response;
      } else if (response && response.address) {
        address = response.address;
      } else if (response && response.error) {
        throw new Error(response.error);
      } else {
        throw new Error("Failed to retrieve public key from Freighter.");
      }

      setState((prev) => ({ ...prev, publicKey: address, isConnected: true, isConnecting: false }));
      localStorage.setItem("freighterPublicKey", address);
      await fetchBalance(address);

    } catch (err: unknown) {
      setState((prev) => ({ ...prev, error: err instanceof Error ? err.message : String(err), isConnecting: false }));
    }
  };

  const disconnect = () => {
    setState({
      publicKey: null,
      isConnected: false,
      balance: null,
      isConnecting: false,
      isLoadingBalance: false,
      error: null,
    });
    localStorage.removeItem("freighterPublicKey");
  };

  const fetchBalance = async (publicKey: string) => {
    setState((prev) => ({ ...prev, isLoadingBalance: true, error: null }));
    try {
      const account = await server.loadAccount(publicKey);
      const nativeBalance = account.balances.find((b) => b.asset_type === "native");
      if (nativeBalance) {
        setState((prev) => ({ ...prev, balance: nativeBalance.balance, isLoadingBalance: false }));
      } else {
        setState((prev) => ({ ...prev, balance: "0", isLoadingBalance: false }));
      }
    } catch (err: unknown) {
      const is404 = err && typeof err === 'object' && 'response' in err && (err as Record<string, unknown>).response && (err as Record<string, Record<string, unknown>>).response?.status === 404;
      if (is404) {
        setState((prev) => ({
          ...prev,
          balance: "0",
          isLoadingBalance: false,
          error: "Your Testnet account is not funded yet. Fund it using Stellar Friendbot, then refresh balance.",
        }));
      } else {
        setState((prev) => ({ ...prev, isLoadingBalance: false, error: "Failed to fetch balance. Are you on Testnet?" }));
      }
    }
  };

  const refreshBalance = async () => {
    if (state.publicKey) {
      await fetchBalance(state.publicKey);
    }
  };

  const sendXlm = async (destination: string, amount: string, memo?: string): Promise<string> => {
    if (!state.publicKey) throw new Error("Wallet not connected");
    setState((prev) => ({ ...prev, error: null }));
    
    try {
      const sourceAccount = await server.loadAccount(state.publicKey);
      
      const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount,
        })
      )
      .setTimeout(180);

      if (memo) {
        transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
      }

      const transaction = transactionBuilder.build();
      const xdr = transaction.toXDR();

      const signedResult = await freighterSignTransaction(xdr, {
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        address: state.publicKey,
      });

      let signedTxXdr = "";
      if (typeof signedResult === "string") {
        signedTxXdr = signedResult;
      } else if (signedResult && signedResult.signedTxXdr) {
        signedTxXdr = signedResult.signedTxXdr;
      } else if (signedResult && signedResult.error) {
        throw new Error(signedResult.error);
      } else {
        throw new Error("Failed to sign transaction.");
      }

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
      const response = await server.submitTransaction(signedTx as StellarSdk.Transaction);
      
      await refreshBalance();
      
      return response.hash;
    } catch (err: unknown) {
      let errorMessage = err instanceof Error ? err.message : "Transaction failed";
      // Handle horizon errors
      if (err && typeof err === 'object' && 'response' in err) {
        const responseObj = (err as Record<string, unknown>).response as { data?: { extras?: { result_codes?: { operations?: string[], transaction?: string } } } } | undefined;
        if (responseObj?.data?.extras) {
          const resultCodes = responseObj.data.extras.result_codes;
          if (resultCodes && resultCodes.operations) {
             errorMessage = `Transaction failed: ${resultCodes.operations.join(", ")}`;
          } else if (resultCodes && resultCodes.transaction) {
             errorMessage = `Transaction failed: ${resultCodes.transaction}`;
          }
        }
      }
      throw new Error(errorMessage, { cause: err });
    }
  };

  return {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    sendXlm,
  };
}
