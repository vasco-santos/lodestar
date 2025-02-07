import {ApiController} from "../types";
import {objectToExpectedCase} from "@chainsafe/lodestar-utils";

export const getPeers: ApiController = {
  url: "/peers",
  opts: {
    schema: {},
  },
  handler: async function (req, resp) {
    const peers = await this.api.node.getPeers();
    resp.status(200).send({
      data: peers.map((peer) => objectToExpectedCase(peer, "snake")),
    });
  },
};
