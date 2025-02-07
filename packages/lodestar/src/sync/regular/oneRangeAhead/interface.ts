import {SignedBeaconBlock} from "@chainsafe/lodestar-types";
import {IRegularSyncModules, ISyncCheckpoint} from "../..";
import {IService} from "../../../node";
import {AbortSignal} from "abort-controller";

export interface IBlockRangeFetcher {
  setLastProcessedBlock(lastProcessedBlock: ISyncCheckpoint): void;
  getNextBlockRange(): Promise<SignedBeaconBlock[]>;
}

export interface IBlockRangeProcessor extends IService {
  processUntilComplete(blocks: SignedBeaconBlock[], signal: AbortSignal): Promise<void>;
}

export type ORARegularSyncModules = IRegularSyncModules & {
  fetcher?: IBlockRangeFetcher;
  processor?: IBlockRangeProcessor;
};
