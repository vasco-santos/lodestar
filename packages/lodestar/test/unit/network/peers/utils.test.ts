import sinon, {SinonStub, SinonStubbedInstance} from "sinon";
import {getSyncProtocols, INetwork, IReqResp, Libp2pNetwork} from "../../../../src/network";
import PeerId from "peer-id";
import {expect} from "chai";
import {
  findMissingSubnets,
  getImportantPeers,
  handlePeerMetadataSequence,
  gossipPeersToDisconnect,
  syncPeersToDisconnect,
} from "../../../../src/network/peers/utils";
import * as peersUtil from "../../../../src/sync/utils/peers";
import {IPeerMetadataStore} from "../../../../src/network/peers/interface";
import {silentLogger} from "../../../utils/logger";
import {Libp2pPeerMetadataStore} from "../../../../src/network/peers/metastore";
import {ReqResp} from "../../../../src/network/reqresp/reqResp";
import {IRpcScoreTracker, SimpleRpcScoreTracker} from "../../../../src/network/peers";

describe("network peer utils", function () {
  const logger = silentLogger;
  let networkStub: SinonStubbedInstance<INetwork>;
  let peerMetadataStoreStub: SinonStubbedInstance<IPeerMetadataStore>;
  let scoreTrackerStub: SinonStubbedInstance<IRpcScoreTracker>;
  let getSyncPeersStub: SinonStub;
  beforeEach(() => {
    peerMetadataStoreStub = sinon.createStubInstance(Libp2pPeerMetadataStore);
    networkStub = sinon.createStubInstance(Libp2pNetwork);
    scoreTrackerStub = sinon.createStubInstance(SimpleRpcScoreTracker);
    networkStub.peerRpcScores = scoreTrackerStub;
    networkStub.peerMetadata = peerMetadataStoreStub;
    getSyncPeersStub = sinon.stub(peersUtil, "getSyncPeers");
  });
  afterEach(() => {
    sinon.restore();
  });

  describe("handlePeerMetadataSequence", function () {
    let reqRespStub: SinonStubbedInstance<IReqResp>;
    let peer: PeerId;

    beforeEach(async () => {
      reqRespStub = sinon.createStubInstance(ReqResp);
      networkStub.reqResp = reqRespStub;
      peer = await PeerId.create();
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should not call metadata, peerSeq is null", async () => {
      await handlePeerMetadataSequence(networkStub, logger, peer, null);
      expect(reqRespStub.metadata.called).to.be.false;
    });

    it("should not call metadata, peerSeq is same to ReputationStore", async () => {
      peerMetadataStoreStub.getMetadata.returns({
        seqNumber: BigInt(10),
        attnets: Array(64).fill(true),
      });
      await handlePeerMetadataSequence(networkStub, logger, peer, BigInt(10));
      expect(reqRespStub.metadata.called).to.be.false;
    });

    it("should call metadata, peerSeq is bigger than ReputationStore", async () => {
      peerMetadataStoreStub.getMetadata.returns({
        seqNumber: BigInt(9),
        attnets: Array(64).fill(true),
      });
      await handlePeerMetadataSequence(networkStub, logger, peer, BigInt(10));
      expect(reqRespStub.metadata.calledOnce).to.be.true;
    });
  });

  describe("findMissingSubnets", function () {
    it("should return all subnets, no peer", function () {
      networkStub.getPeers.returns([]);
      const missingSubnets = findMissingSubnets(networkStub);
      for (let i = 0; i < 64; i++) {
        expect(missingSubnets[i]).to.be.equal(i);
      }
    });

    it("should return all subnets, peers exist", async function () {
      const peers: PeerId[] = [];
      peers.push(await PeerId.create());
      peers.push(await PeerId.create());
      peerMetadataStoreStub.getMetadata.returns(null);
      peerMetadataStoreStub.getMetadata.returns({
        seqNumber: BigInt(1),
        attnets: Array(64).fill(false),
      });

      networkStub.getPeers.returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      const missingSubnets = findMissingSubnets(networkStub);
      for (let i = 0; i < 64; i++) {
        expect(missingSubnets[i]).to.be.equal(i);
      }
    });

    it("should return no missing subnets", async function () {
      const peers: PeerId[] = [];
      peers.push(await PeerId.create());
      peers.push(await PeerId.create());
      peerMetadataStoreStub.getMetadata.returns(null);
      peerMetadataStoreStub.getMetadata.returns({
        seqNumber: BigInt(1),
        attnets: Array(64).fill(true),
      });
      networkStub.getPeers.returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      const missingSubnets = findMissingSubnets(networkStub);
      expect(missingSubnets).to.be.deep.equal([]);
    });

    it("should return some missing subnets", async function () {
      const peers: PeerId[] = [];
      peers.push(await PeerId.create());
      peers.push(await PeerId.create());
      const attnets0 = Array(64).fill(false);
      attnets0[0] = true;
      attnets0[1] = true;
      peerMetadataStoreStub.getMetadata.withArgs(peers[0]).returns({
        seqNumber: BigInt(1),
        attnets: attnets0,
      });
      const attnets1 = Array(64).fill(false);
      attnets1[2] = true;
      attnets1[3] = true;

      peerMetadataStoreStub.getMetadata.withArgs(peers[1]).returns({
        seqNumber: BigInt(1),
        attnets: attnets1,
      });
      networkStub.getPeers.returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      const missingSubnets = findMissingSubnets(networkStub);
      const expected: number[] = [];
      for (let i = 4; i < 64; i++) {
        expected.push(i);
      }
      expect(missingSubnets).to.be.deep.equal(expected);
    });
  });

  describe("syncPeersToDisconnect", function () {
    let peer1: PeerId, peer2: PeerId, peer3: PeerId;
    let peers: PeerId[];
    beforeEach(async () => {
      peer1 = await PeerId.create();
      peer2 = await PeerId.create();
      peer3 = await PeerId.create();
      peers = [peer1, peer2, peer3];
    });
    afterEach(() => {
      sinon.restore();
    });

    it("should return all non sync peers", async () => {
      networkStub.getPeers.withArgs({connected: true}).returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      // non of peers are sync peers
      networkStub.getPeers
        .withArgs({
          connected: true,
          supportsProtocols: getSyncProtocols(),
        })
        .returns([]);
      // so non of them are good score sync peers
      getSyncPeersStub.returns([]);

      expect(syncPeersToDisconnect(networkStub)).to.be.deep.equal(peers);
    });

    it("should return half of bad score sync peers", async () => {
      networkStub.getPeers.withArgs({connected: true}).returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      // all peers are sync peers
      networkStub.getPeers
        .withArgs({
          connected: true,
          supportsProtocols: getSyncProtocols(),
        })
        .returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      // non of them are good score sync peers
      getSyncPeersStub.returns([]);
      scoreTrackerStub.getScore.withArgs(peers[0]).returns(10);
      scoreTrackerStub.getScore.withArgs(peers[1]).returns(20);
      scoreTrackerStub.getScore.withArgs(peers[2]).returns(30);
      expect(syncPeersToDisconnect(networkStub)).to.be.deep.equal([peer1, peer2]);
    });

    it("should return non sync peers and half of bad score sync peers", async () => {
      networkStub.getPeers.withArgs({connected: true}).returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      // peer 2 and peer3 are sync peers
      networkStub.getPeers
        .withArgs({
          connected: true,
          supportsProtocols: getSyncProtocols(),
        })
        .returns([peer2, peer3].map((peerId) => ({id: peerId} as LibP2p.Peer)));
      // non of them are good score sync peers
      getSyncPeersStub.returns([]);
      scoreTrackerStub.getScore.withArgs(peers[1]).returns(20);
      scoreTrackerStub.getScore.withArgs(peers[2]).returns(30);
      // peer1 is not sync peer, peer2 is half of bad score sync peers
      expect(syncPeersToDisconnect(networkStub)).to.be.deep.equal([peer1, peer2]);
    });
  });

  describe("gossipPeersToDisconnect", function () {
    let peer1: PeerId, peer2: PeerId;
    let peers: PeerId[];
    beforeEach(async () => {
      peer1 = await PeerId.create();
      peer2 = await PeerId.create();
      peers = [peer1, peer2];
      networkStub.getPeers.returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
    });
    afterEach(() => {
      sinon.restore();
    });

    it("should return important peers", async () => {
      const attnets1 = Array(64).fill(false);
      attnets1[0] = true;
      attnets1[1] = true;
      peerMetadataStoreStub.getMetadata.withArgs(peer1).returns({
        seqNumber: BigInt(1),
        attnets: attnets1,
      });
      const attnets2 = Array(64).fill(false);
      attnets2[1] = true;
      peerMetadataStoreStub.getMetadata.withArgs(peer2).returns({
        seqNumber: BigInt(1),
        attnets: attnets2,
      });
      const importantPeers = getImportantPeers(peers, peerMetadataStoreStub);
      expect(importantPeers).to.be.deep.equal(new Set([peer1]));
    });

    it("should return empty array, not enough peers to disconnect", async () => {
      // peers are not at 90%
      expect(gossipPeersToDisconnect(networkStub, 5, 3)).to.be.deep.equal([]);
    });

    it("should return empty array, no need to disconnect", async () => {
      // still have 3 empty slots for 3 subnets
      expect(gossipPeersToDisconnect(networkStub, 3, 5, 0)).to.be.deep.equal([]);
    });

    it("should disconnect unimportant peers", async () => {
      // peer1 is important
      const attnets1 = Array(64).fill(false);
      attnets1[0] = true;
      attnets1[1] = true;
      peerMetadataStoreStub.getMetadata.withArgs(peer1).returns({
        seqNumber: BigInt(1),
        attnets: attnets1,
      });
      // peer2 is not imporant
      const attnets2 = Array(64).fill(false);
      attnets2[1] = true;
      peerMetadataStoreStub.getMetadata.withArgs(peer2).returns({
        seqNumber: BigInt(1),
        attnets: attnets2,
      });
      // need to disconnect 1 peer and it's peer2
      expect(gossipPeersToDisconnect(networkStub, 1, 2, 0)).to.be.deep.equal([peer2]);
    });

    it("should disconnect peers with less supported protocols", async () => {
      networkStub.getPeers.onSecondCall().returns([{id: peer1} as LibP2p.Peer]);
      // need to disconnect 1 peer and it's peer2
      expect(gossipPeersToDisconnect(networkStub, 1, 2, 0)).to.be.deep.equal([peer2]);
    });

    it("should disconnect peers without metadata", async () => {
      // don't want to delete peers that are waiting for CheckPeerAlive task
      peerMetadataStoreStub.getMetadata.withArgs(peer1).returns({
        attnets: Array(64).fill(false),
        seqNumber: BigInt(1),
      });
      // peer2 has no metadata
      expect(gossipPeersToDisconnect(networkStub, 1, 2, 0)).to.be.deep.equal([peer2]);
    });

    it("should disconnect peers that have less subnets", async () => {
      const peer3 = await PeerId.create();
      peers.push(peer3);
      networkStub.getPeers.returns(peers.map((peerId) => ({id: peerId} as LibP2p.Peer)));
      const attnets3 = Array(64).fill(true);
      peerMetadataStoreStub.getMetadata.withArgs(peer3).returns({
        seqNumber: BigInt(1),
        attnets: attnets3,
      });
      const attnet1 = Array(64).fill(true);
      attnet1[0] = false;
      peerMetadataStoreStub.getMetadata.withArgs(peer1).returns({
        seqNumber: BigInt(1),
        attnets: attnet1,
      });
      const attnet2 = Array(64).fill(true);
      attnet2[0] = false;
      attnet2[1] = false;
      peerMetadataStoreStub.getMetadata.withArgs(peer3).returns({
        seqNumber: BigInt(1),
        attnets: attnet2,
      });
      // peer1 and peer2 are all not important but peer1 is connected to more subnets
      // if we have to choose 1 peer to disconnect, it's peer2
      expect(gossipPeersToDisconnect(networkStub, 1, 3, 0)).to.be.deep.equal([peer2]);
    });
  });
});
