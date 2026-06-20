#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Client,      // Address of the person paying for the gig
    Freelancer,  // Address of the service provider receiving payment
    Token,       // Asset token address used for payment (e.g., USDC)
    Amount,      // Total amount locked inside the contract instance
    IsReleased,  // State tracking boolean to prevent double withdrawal
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initializes the escrow contract instance and transfers payment tokens from the client to the contract.
    pub fn initialize(env: Env, client: Address, freelancer: Address, token: Address, amount: i128) {
        // Enforce guard checking to ensure the contract hasn't already been configured
        assert!(!env.storage().instance().has(&DataKey::Client), "Contract instance already initialized");
        assert!(amount > 0, "Escrow amount must be greater than zero");

        env.storage().instance().set(&DataKey::Client, &client);
        env.storage().instance().set(&DataKey::Freelancer, &freelancer);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::IsReleased, &false);

        // Instantly draw down the milestone payment directly into this escrow contract's balance
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &amount);
    }

    /// Releases the escrowed funds to the designated freelancer. Can only be authorized by the client.
    pub fn release(env: Env) {
        let client: Address = env.storage().instance().get(&DataKey::Client).expect("Not initialized");
        
        // Cryptographically verify that the client called this specific function
        client.require_auth();

        let is_released: bool = env.storage().instance().get(&DataKey::IsReleased).unwrap_or(false);
        assert!(!is_released, "Funds have already been released or refunded");

        let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).expect("Missing freelancer");
        let token: Address = env.storage().instance().get(&DataKey::Token).expect("Missing token");
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).expect("Missing amount");

        // Mark state to avoid race conditions or re-entrancy risks
        env.storage().instance().set(&DataKey::IsReleased, &true);

        // Move the locked milestone tokens directly into the freelancer's wallet address
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &freelancer, &amount);
    }

    /// Cancels the contract and returns the escrowed funds to the client. Can only be authorized by the freelancer.
    pub fn refund(env: Env) {
        let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).expect("Not initialized");
        
        // Cryptographically verify that the freelancer is initiating the refund
        freelancer.require_auth();

        let is_released: bool = env.storage().instance().get(&DataKey::IsReleased).unwrap_or(false);
        assert!(!is_released, "Funds have already been released or refunded");

        let client: Address = env.storage().instance().get(&DataKey::Client).expect("Missing client");
        let token: Address = env.storage().instance().get(&DataKey::Token).expect("Missing token");
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).expect("Missing amount");

        env.storage().instance().set(&DataKey::IsReleased, &true);

        // Return the locked milestone tokens back into the client's wallet address
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &client, &amount);
    }
}