import * as StellarSdk from "@stellar/stellar-sdk";

export const STELLAR_NETWORK = "TESTNET";
export const STELLAR_NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET; // "Test SDF Network ; September 2015"
export const STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org";

export const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);

/**
 * Validates a given Stellar Public Key.
 * @param value The public key string to validate.
 * @returns boolean indicating if the public key is valid.
 */
export function isValidStellarPublicKey(value: string): boolean {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(value);
  } catch {
    return false;
  }
}
