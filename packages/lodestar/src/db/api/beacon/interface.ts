/**
 * @module db/api/beacon
 */

import {SignedBeaconBlock} from "@chainsafe/lodestar-types";

import {
  AggregateAndProofRepository,
  AttestationRepository,
  AttesterSlashingRepository,
  BadBlockRepository,
  BlockArchiveRepository,
  BlockRepository,
  DepositEventRepository,
  DepositDataRootRepository,
  Eth1DataRepository,
  ProposerSlashingRepository,
  StateArchiveRepository,
  VoluntaryExitRepository,
} from "./repositories";
import {StateContextCache} from "./stateContextCache";
import {CheckpointStateCache} from "./stateContextCheckpointsCache";
import {SeenAttestationCache} from "./seenAttestationCache";
import {PendingBlockRepository} from "./repositories/pendingBlock";

/**
 * The DB service manages the data layer of the beacon chain
 * The exposed methods do not refer to the underlying data engine,
 * but instead expose relevent beacon chain objects
 */
export interface IBeaconDb {
  // bad blocks
  badBlock: BadBlockRepository;

  // unfinalized blocks
  block: BlockRepository;

  // pending block
  pendingBlock: PendingBlockRepository;

  // unfinalized states
  stateCache: StateContextCache;
  checkpointStateCache: CheckpointStateCache;

  //cache
  seenAttestationCache: SeenAttestationCache;

  // finalized blocks
  blockArchive: BlockArchiveRepository;

  // finalized states
  stateArchive: StateArchiveRepository;

  // op pool
  attestation: AttestationRepository;
  aggregateAndProof: AggregateAndProofRepository;
  voluntaryExit: VoluntaryExitRepository;
  proposerSlashing: ProposerSlashingRepository;
  attesterSlashing: AttesterSlashingRepository;
  depositEvent: DepositEventRepository;

  // eth1 processing

  // all deposit data roots and merkle tree
  depositDataRoot: DepositDataRootRepository;
  eth1Data: Eth1DataRepository;

  processBlockOperations(signedBlock: SignedBeaconBlock): Promise<void>;

  start(): Promise<void>;
  stop(): Promise<void>;
}
