/**
 * @module params
 */

export interface IBeaconParams {
  // Misc
  MAX_COMMITTEES_PER_SLOT: number;
  TARGET_COMMITTEE_SIZE: number;
  MAX_VALIDATORS_PER_COMMITTEE: number;
  MIN_PER_EPOCH_CHURN_LIMIT: number;
  CHURN_LIMIT_QUOTIENT: number;
  SHUFFLE_ROUND_COUNT: number;
  MIN_GENESIS_ACTIVE_VALIDATOR_COUNT: number;
  MIN_GENESIS_TIME: number;
  HYSTERESIS_QUOTIENT: number;
  HYSTERESIS_DOWNWARD_MULTIPLIER: number;
  HYSTERESIS_UPWARD_MULTIPLIER: number;

  // Fork choice
  SAFE_SLOTS_TO_UPDATE_JUSTIFIED: number;

  // Validator
  ETH1_FOLLOW_DISTANCE: number;
  TARGET_AGGREGATORS_PER_COMMITTEE: number;
  RANDOM_SUBNETS_PER_VALIDATOR: number;
  EPOCHS_PER_RANDOM_SUBNET_SUBSCRIPTION: number;
  SECONDS_PER_ETH1_BLOCK: number;

  // Deposit contract
  DEPOSIT_CHAIN_ID: number;
  DEPOSIT_NETWORK_ID: number;
  DEPOSIT_CONTRACT_ADDRESS: Buffer;

  // Gwei Values
  MIN_DEPOSIT_AMOUNT: bigint;
  MAX_EFFECTIVE_BALANCE: bigint;
  EJECTION_BALANCE: bigint;
  EFFECTIVE_BALANCE_INCREMENT: bigint;

  // Initial values
  GENESIS_FORK_VERSION: Buffer;
  BLS_WITHDRAWAL_PREFIX: Buffer;

  // Time parameters
  GENESIS_DELAY: number;
  SECONDS_PER_SLOT: number;
  MIN_ATTESTATION_INCLUSION_DELAY: number;
  SLOTS_PER_EPOCH: number;
  MIN_SEED_LOOKAHEAD: number;
  MAX_SEED_LOOKAHEAD: number;
  EPOCHS_PER_ETH1_VOTING_PERIOD: number;
  SLOTS_PER_HISTORICAL_ROOT: number;
  MIN_VALIDATOR_WITHDRAWABILITY_DELAY: number;
  SHARD_COMMITTEE_PERIOD: number;
  MIN_EPOCHS_TO_INACTIVITY_PENALTY: number;

  // State vector lengths
  EPOCHS_PER_HISTORICAL_VECTOR: number;
  EPOCHS_PER_SLASHINGS_VECTOR: number;
  HISTORICAL_ROOTS_LIMIT: number;
  VALIDATOR_REGISTRY_LIMIT: number;

  // Reward and penalty quotients
  BASE_REWARD_FACTOR: number;
  WHISTLEBLOWER_REWARD_QUOTIENT: number;
  PROPOSER_REWARD_QUOTIENT: number;
  INACTIVITY_PENALTY_QUOTIENT: bigint;
  MIN_SLASHING_PENALTY_QUOTIENT: number;
  PROPORTIONAL_SLASHING_MULTIPLIER: number;

  // Max operations per block
  MAX_PROPOSER_SLASHINGS: number;
  MAX_ATTESTER_SLASHINGS: number;
  MAX_ATTESTATIONS: number;
  MAX_DEPOSITS: number;
  MAX_VOLUNTARY_EXITS: number;

  // Signature domains
  DOMAIN_BEACON_PROPOSER: Buffer;
  DOMAIN_BEACON_ATTESTER: Buffer;
  DOMAIN_RANDAO: Buffer;
  DOMAIN_DEPOSIT: Buffer;
  DOMAIN_VOLUNTARY_EXIT: Buffer;
  DOMAIN_SELECTION_PROOF: Buffer;
  DOMAIN_AGGREGATE_AND_PROOF: Buffer;

  // Old and future forks
  ALL_FORKS: IFork[];
}

interface IFork {
  // 4 bytes
  previousVersion: number;
  // 4 bytes
  currentVersion: number;
  // Fork epoch number
  epoch: number;
}
