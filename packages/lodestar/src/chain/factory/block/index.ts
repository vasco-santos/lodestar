/**
 * @module chain/blockAssembly
 */

import {fastStateTransition, IStateContext} from "@chainsafe/lodestar-beacon-state-transition";
import {createCachedValidatorsBeaconState} from "@chainsafe/lodestar-beacon-state-transition/lib/fast/util";
import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {BeaconBlock, Bytes96, Root, Slot} from "@chainsafe/lodestar-types";
import {EMPTY_SIGNATURE, ZERO_HASH} from "../../../constants";
import {IBeaconDb} from "../../../db/api";
import {ITreeStateContext} from "../../../db/api/beacon/stateContextCache";
import {IEth1ForBlockProduction} from "../../../eth1";
import {IBeaconChain} from "../../interface";
import {assembleBody} from "./body";

export async function assembleBlock(
  config: IBeaconConfig,
  chain: IBeaconChain,
  db: IBeaconDb,
  eth1: IEth1ForBlockProduction,
  slot: Slot,
  randaoReveal: Bytes96,
  graffiti = ZERO_HASH
): Promise<BeaconBlock> {
  const head = chain.forkChoice.getHead();
  const stateContext = await chain.regen.getBlockSlotState(head.blockRoot, slot);
  const block: BeaconBlock = {
    slot,
    proposerIndex: stateContext.epochCtx.getBeaconProposer(slot),
    parentRoot: head.blockRoot,
    stateRoot: ZERO_HASH,
    body: await assembleBody(config, db, eth1, stateContext.state, randaoReveal, graffiti),
  };

  const preStateContext = await chain.regen.getBlockSlotState(head.blockRoot, slot - 1);
  block.stateRoot = computeNewStateRoot(config, preStateContext, block);

  return block;
}

function computeNewStateRoot(config: IBeaconConfig, stateContext: ITreeStateContext, block: BeaconBlock): Root {
  // state is cloned from the cache already
  const signedBlock = {
    message: block,
    signature: EMPTY_SIGNATURE,
  };
  const stateTranstionStateContext: IStateContext = {
    epochCtx: stateContext.epochCtx,
    state: createCachedValidatorsBeaconState(stateContext.state),
  };
  const newState = fastStateTransition(stateTranstionStateContext, signedBlock, {
    verifyStateRoot: false,
    verifyProposer: false,
    verifySignatures: true,
  });
  return config.types.BeaconState.hashTreeRoot(newState.state);
}
