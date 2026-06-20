# **Waypoint Vault**

A trust-minimized, cross-border milestone escrow contract built on Stellar's Soroban platform.

## **Problem**

Freelancers and SMEs face massive fees (10-20%) on traditional global gig platforms, delayed clearances, and severe payment default risks. Conversely, direct hiring off-platform offers zero payment protection, often resulting in clients "ghosting" independent contractors after work is delivered.

## **Solution**

Waypoint Vault utilizes a Soroban smart contract to create an immutable escrow agreement. The client locks milestone funds (like USDC) on-chain. Once the work is delivered, the client authorizes the release, routing funds instantly to the freelancer. If the project is aborted, the freelancer can trigger a refund. This guarantees zero-fee trust and instant cross-border settlement.

## **Timeline**

* **Duration:** 1-Day Hackathon Project (MVP Ready)

## **Stellar Features Used**

* **Soroban Smart Contracts:** Secure, multi-party escrow logic execution with cryptographic authorization guards and double-spend protection.  
* **USDC Asset Integration:** Stable tokenization for cross-border payments, protecting against local currency volatility.

## **Vision and Purpose**

To economically empower independent gig workers globally by providing a trustless, borderless, and fee-free milestone validation infrastructure.

## **Prerequisites**

* Rust with wasm32-unknown-unknown target installed  
* Stellar CLI installed

rustup target add wasm32-unknown-unknown

## **How to build**

cargo build \--target wasm32-unknown-unknown \--release

*Output:* target/wasm32-unknown-unknown/release/waypoint\_vault.wasm

## **How to test**

cargo test

*Expected output:*

running 5 tests  
test test::test\_happy\_path\_refund ... ok  
test test::test\_happy\_path\_release ... ok  
test test::test\_state\_verification ... ok  
test test::test\_edge\_case\_double\_release\_fails ... ok  
test test::test\_edge\_case\_duplicate\_initialization\_fails ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

## **How to deploy to testnet**

stellar contract deploy \\  
  \--wasm target/wasm32-unknown-unknown/release/waypoint\_vault.wasm \\  
  \--source deployer \\  
  \--network testnet

## **Sample CLI Invocation**

Initialize the vault with a 500 USDC milestone:

stellar contract invoke \\  
  \--id \<CONTRACT\_ID\> \\  
  \--source client \\  
  \--network testnet \\  
  \-- \\  
  initialize \\  
  \--client \<CLIENT\_ADDRESS\> \\  
  \--freelancer \<FREELANCER\_ADDRESS\> \\  
  \--token \<USDC\_TOKEN\_ADDRESS\> \\  
  \--amount 500

Release the funds (called by the client):

stellar contract invoke \\  
  \--id \<CONTRACT\_ID\> \\  
  \--source client \\  
  \--network testnet \\  
  \-- \\  
  release

## Deployment

### Testnet
- **Smart Contract Address:** `CCYAHHIAY2MYJ43NFQOSDDDXZUWN67C3VAQDWMIXDDJRZIX52PDVLHMZ`
- 📸 **Screenshot — Stellar Expert (Testnet)**
<img width="1906" height="976" alt="testnet" src="https://github.com/user-attachments/assets/6bab2c23-75cb-4285-ac6e-1cc1a31486f1" />

## **License**

MIT
