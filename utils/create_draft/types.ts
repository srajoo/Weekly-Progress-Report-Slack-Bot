import { Block, KnownBlock } from "https://cdn.skypack.dev/@slack/types?dts";

export enum DraftStatus {
  Draft = "draft",
  Sent = "sent",
}

export type ChatPostMessageParams = {
  channel: string;
  thread_ts?: string;
  blocks: (KnownBlock | Block)[];
  text?: string;
};