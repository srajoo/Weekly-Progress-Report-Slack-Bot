import { DefineType, Schema } from "deno-slack-sdk/mod.ts";

export const ReportCustomType = DefineType({
  name: "Report",
  type: Schema.types.object,
  properties: {
    channel_id: {
      type: Schema.slack.types.channel_id,
    },
    success: {
      type: Schema.types.boolean,
    },
    permalink: {
      type: Schema.types.string,
    },
    error: {
      type: Schema.types.string,
    },
  },
  required: ["channel_id", "success"],
});

export type ReportType = {
  channel_id: string;
  success: boolean;
  permalink?: string;
  error?: string;
};