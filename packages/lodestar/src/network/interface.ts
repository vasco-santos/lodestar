/**
 * @module network
 */
import {ENR} from "@chainsafe/discv5/lib";
import {
  BeaconBlocksByRangeRequest,
  BeaconBlocksByRootRequest,
  Goodbye,
  Metadata,
  Ping,
  RequestBody,
  SignedBeaconBlock,
  Status,
} from "@chainsafe/lodestar-types";
import {EventEmitter} from "events";
import LibP2p from "libp2p";
import Multiaddr from "multiaddr";
import PeerId from "peer-id";
import StrictEventEmitter from "strict-event-emitter-types";
import {IGossip} from "./gossip/interface";
import {MetadataController} from "./metadata";
import {IPeerMetadataStore} from "./peers/interface";
import {IRpcScoreTracker} from "./peers/score";
import {ReqRespRequest} from "./reqresp";

export interface IReqEvents {
  request: (request: ReqRespRequest<RequestBody>, peerId: PeerId, sink: Sink<unknown, unknown>) => void;
}

export type ReqEventEmitter = StrictEventEmitter<EventEmitter, IReqEvents>;

export interface IReqResp extends ReqEventEmitter {
  status(peerId: PeerId, request: Status): Promise<Status | null>;
  goodbye(peerId: PeerId, request: Goodbye): Promise<void>;
  ping(peerId: PeerId, request: Ping): Promise<Ping | null>;
  metadata(peerId: PeerId): Promise<Metadata | null>;
  beaconBlocksByRange(peerId: PeerId, request: BeaconBlocksByRangeRequest): Promise<SignedBeaconBlock[] | null>;
  beaconBlocksByRoot(peerId: PeerId, request: BeaconBlocksByRootRequest): Promise<SignedBeaconBlock[] | null>;
}

// network

export interface INetworkEvents {
  ["peer:connect"]: (peerId: PeerId, direction: "inbound" | "outbound") => void;
  ["peer:disconnect"]: (peerId: PeerId) => void;
}
export type NetworkEventEmitter = StrictEventEmitter<EventEmitter, INetworkEvents>;

export type PeerSearchOptions = {
  connected: boolean;
  supportsProtocols: string[];
  count?: number;
};

export interface INetwork extends NetworkEventEmitter {
  reqResp: IReqResp;
  gossip: IGossip;
  metadata: MetadataController;
  peerMetadata: IPeerMetadataStore;
  peerRpcScores: IRpcScoreTracker;
  /**
   * Our network identity
   */
  peerId: PeerId;
  localMultiaddrs: Multiaddr[];
  getEnr(): ENR | undefined;
  getPeers(opts?: Partial<PeerSearchOptions>): LibP2p.Peer[];
  getMaxPeer(): number;
  getPeerConnection(peerId: PeerId): LibP2pConnection | null;
  hasPeer(peerId: PeerId): boolean;
  connect(peerId: PeerId, localMultiaddrs?: Multiaddr[]): Promise<void>;
  disconnect(peerId: PeerId): Promise<void>;
  searchSubnetPeers(subnet: string): Promise<void>;
  // Service
  start(): Promise<void>;
  stop(): Promise<void>;
  handleSyncCompleted(): Promise<void>;
}
