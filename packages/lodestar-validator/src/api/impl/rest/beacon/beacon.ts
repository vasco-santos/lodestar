import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {BeaconBlock, BeaconState, Genesis} from "@chainsafe/lodestar-types";
import {ILogger} from "@chainsafe/lodestar-utils";
import {Json} from "@chainsafe/ssz";
import {HttpClient, urlJoin} from "../../../../util";
import {IBeaconApi, IBeaconBlocksApi, IBeaconStateApi, IBeaconPoolApi} from "../../../interface/beacon";
import {RestBeaconBlocksApi} from "./blocks";
import {RestBeaconStateApi} from "./state";
import {RestBeaconPoolApi} from "./pool";

export class RestBeaconApi implements IBeaconApi {
  public readonly state: IBeaconStateApi;
  public readonly blocks: IBeaconBlocksApi;
  public readonly pool: IBeaconPoolApi;

  private readonly clientV2: HttpClient;
  private readonly logger: ILogger;
  private readonly config: IBeaconConfig;

  public constructor(config: IBeaconConfig, restUrl: string, logger: ILogger) {
    this.clientV2 = new HttpClient({urlPrefix: urlJoin(restUrl, "/eth/v1/beacon")}, {logger});
    this.logger = logger;
    this.config = config;
    this.state = new RestBeaconStateApi(this.config, this.clientV2, this.logger);
    this.blocks = new RestBeaconBlocksApi(this.config, this.clientV2, this.logger);
    this.pool = new RestBeaconPoolApi(this.config, this.clientV2, this.logger);
  }

  public async getGenesis(): Promise<Genesis | null> {
    try {
      const genesisResponse = await this.clientV2.get<{data: Json}>("/genesis");
      return this.config.types.Genesis.fromJson(genesisResponse.data, {case: "snake"});
    } catch (e) {
      this.logger.error("Failed to obtain genesis time", {reason: e.message});
      return null;
    }
  }

  public async getChainHead(): Promise<BeaconBlock> {
    throw new Error("Method not implemented.");
  }
  public async getBeaconState(): Promise<BeaconState> {
    throw new Error("Method not implemented.");
  }
}
