#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_happy_path_release() {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    // Set up a mock Stellar Asset contract to represent our payment asset (USDC)
    let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_contract_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract_id);

    // Initial funding setup
    token_admin_client.mint(&client, &1000);
    assert_eq!(token_client.balance(&client), 1000);

    // Deploy contract instance
    let contract_id = env.register_contract(None, EscrowContract);
    let contract_client = EscrowContractClient::new(&env, &contract_id);

    // Test initialization & deposit
    contract_client.initialize(&client, &freelancer, &token_contract_id, &600);
    assert_eq!(token_client.balance(&client), 400);
    assert_eq!(token_client.balance(&contract_id), 600);

    // Test explicit client release execution flow
    contract_client.release();
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&freelancer), 600);
}

#[test]
fn test_happy_path_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_contract_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract_id);

    token_admin_client.mint(&client, &1000);

    let contract_id = env.register_contract(None, EscrowContract);
    let contract_client = EscrowContractClient::new(&env, &contract_id);

    contract_client.initialize(&client, &freelancer, &token_contract_id, &600);
    
    // Test freelancer refund execution flow
    contract_client.refund();
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&client), 1000);
}

#[test]
#[should_panic(expected = "Funds have already been released or refunded")]
fn test_edge_case_double_release_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract_id);

    token_admin_client.mint(&client, &1000);

    let contract_id = env.register_contract(None, EscrowContract);
    let contract_client = EscrowContractClient::new(&env, &contract_id);

    contract_client.initialize(&client, &freelancer, &token_contract_id, &600);
    contract_client.release();
    
    // Second execution must trigger a panic condition
    contract_client.release();
}

#[test]
#[should_panic(expected = "Contract instance already initialized")]
fn test_edge_case_duplicate_initialization_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract_id);

    token_admin_client.mint(&client, &2000);

    let contract_id = env.register_contract(None, EscrowContract);
    let contract_client = EscrowContractClient::new(&env, &contract_id);

    contract_client.initialize(&client, &freelancer, &token_contract_id, &500);
    
    // Attempting to re-initialize an active instance must fail
    contract_client.initialize(&client, &freelancer, &token_contract_id, &500);
}

#[test]
fn test_state_verification() {
    let env = Env::default();
    env.mock_all_auths();

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract_id = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract_id);

    token_admin_client.mint(&client, &1000);

    let contract_id = env.register_contract(None, EscrowContract);
    let contract_client = EscrowContractClient::new(&env, &contract_id);

    contract_client.initialize(&client, &freelancer, &token_contract_id, &450);

    // Explicit state assertions against deployment storage states
    assert!(env.storage().instance().has(&DataKey::Client));
    assert!(env.storage().instance().has(&DataKey::Freelancer));
    let amount_stored: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
    assert_eq!(amount_stored, 450);
}