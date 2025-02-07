import {IEventsApi} from "./interfaces";
import {ApiNamespace, IApiModules} from "../interface";
import {IBeaconConfig} from "@chainsafe/lodestar-config";
import {ChainEvent, IBeaconChain, IChainEvents} from "../../../chain";
import {IApiOptions} from "../../options";
import {
  ChainEventListener,
  handleBeaconAttestationEvent,
  handleBeaconBlockEvent,
  handleBeaconHeadEvent,
  handleChainReorgEvent,
  handleFinalizedCheckpointEvent,
  handleVoluntaryExitEvent,
} from "./handlers";
import {LodestarEventIterator} from "@chainsafe/lodestar-utils";
import {BeaconEventType, BeaconEvent} from "./types";

export class EventsApi implements IEventsApi {
  public namespace: ApiNamespace;

  private readonly config: IBeaconConfig;
  private readonly chain: IBeaconChain;

  public constructor(opts: Partial<IApiOptions>, modules: Pick<IApiModules, "config" | "chain">) {
    this.namespace = ApiNamespace.EVENTS;
    this.config = modules.config;
    this.chain = modules.chain;
  }

  public getEventStream(topics: BeaconEventType[]): LodestarEventIterator<BeaconEvent> {
    return new LodestarEventIterator<BeaconEvent>(({push}) => {
      const eventHandlerMapping = getEventHandlerMapping(this.config, push);

      topics.forEach((topic) => {
        const eventHandler = eventHandlerMapping[topic];
        if (eventHandler) {
          this.chain.emitter.on(eventHandler.chainEvent, eventHandler.handler);
        }
      });
      return () => {
        topics.forEach((topic) => {
          const eventHandler = eventHandlerMapping[topic];
          this.chain.emitter.removeListener(eventHandler.chainEvent, eventHandler.handler);
        });
      };
    });
  }
}

function getEventHandlerMapping(
  config: IBeaconConfig,
  push: (value: BeaconEvent) => void
): Record<BeaconEventType, {chainEvent: keyof IChainEvents; handler: ChainEventListener<keyof IChainEvents>}> {
  return {
    [BeaconEventType.HEAD]: {
      chainEvent: ChainEvent.forkChoiceHead,
      handler: handleBeaconHeadEvent(config, push),
    },
    [BeaconEventType.BLOCK]: {
      chainEvent: ChainEvent.block,
      handler: handleBeaconBlockEvent(config, push),
    },
    [BeaconEventType.ATTESTATION]: {
      chainEvent: ChainEvent.attestation,
      handler: handleBeaconAttestationEvent(config, push),
    },
    [BeaconEventType.VOLUNTARY_EXIT]: {
      chainEvent: ChainEvent.block,
      handler: handleVoluntaryExitEvent(config, push),
    },
    [BeaconEventType.FINALIZED_CHECKPOINT]: {
      chainEvent: ChainEvent.finalized,
      handler: handleFinalizedCheckpointEvent(config, push),
    },
    [BeaconEventType.CHAIN_REORG]: {
      chainEvent: ChainEvent.forkChoiceReorg,
      handler: handleChainReorgEvent(config, push),
    },
  };
}
