import {ICliCommand, ICliCommandOptions} from "../../util";
import {IGlobalArgs} from "../../options";
import {beaconOptions, IBeaconArgs} from "./options";
import {beaconHandler} from "./handler";

export const beacon: ICliCommand<IBeaconArgs, IGlobalArgs> = {
  command: "beacon",
  describe: "Run a beacon chain node",
  examples: [
    {
      command: "beacon --testnet medalla",
      description: "Run a beacon chain node and connect to the Medalla testnet",
    },
  ],
  options: beaconOptions as ICliCommandOptions<IBeaconArgs>,
  handler: beaconHandler,
};
