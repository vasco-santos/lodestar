import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {IBeaconSync} from "../../sync";
import {ApiError} from "./errors/api";

export async function checkSyncStatus(config: IBeaconConfig, sync: IBeaconSync): Promise<void> {
  if (!sync.isSynced()) {
    let syncStatus;
    try {
      syncStatus = await sync.getSyncStatus();
    } catch (e) {
      throw new ApiError(503, "Node is stopped");
    }
    if (syncStatus.syncDistance > config.params.SLOTS_PER_EPOCH) {
      throw new ApiError(
        503,
        `Node is syncing, status: ${JSON.stringify(config.types.SyncingStatus.toJson(syncStatus))}`
      );
    }
  }
}
