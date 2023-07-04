import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ReportCustomType } from "../utils/post_summary/types.ts";

import { buildSummaryBlocks } from "../utils/post_summary/blocks.ts";

export const SummaryFunctionDefinition = DefineFunction({
  callback_id: "summary_function",
  title: "Post report summary",
  description: "Post a summary of all sent reports ",
  source_file: "functions/summary_function.ts",
  input_parameters: {
    properties: {
      reports: {
        type: Schema.types.array,
        items: {
          type: ReportCustomType,
        },
        description: "Array of objects that includes a channel ID and permalink for each report successfully sent",
      },
      channel: {
        type: Schema.slack.types.channel_id,
        description: "The channel where the summary should be posted",
      },
      message_ts: {
        type: Schema.types.string,
        description:
          "Options message timestamp where the summary should be threaded",
      },
    },
    required: [
      "reports",
      "channel",
    ],
  },
  output_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      message_ts: {
        type: Schema.types.string,
      },
    },
    required: ["channel", "message_ts"],
  },
});


export default SlackFunction(
  SummaryFunctionDefinition, 
  async ({ inputs, client }) => {
    const blocks = buildSummaryBlocks(inputs.reports);

    // 1. Post a message in thread to the draft report
    const postResp = await client.chat.postMessage({
      channel: inputs.channel,
      thread_ts: inputs.message_ts || "",
      blocks: blocks,
      unfurl_links: false,
    });

    if (!postResp.ok) {
      const summaryTS = postResp ? postResp.ts : "n/a";
      const postSummaryErrorMsg =
        `Error posting report send summary: ${summaryTS} to channel: ${inputs.channel}. Contact the app maintainers with the following - (Error detail: ${postResp.error})`;
      console.log(postSummaryErrorMsg);

      // 2. Complete function with an error message
      return { error: postSummaryErrorMsg };
    }
    const outputs = {
      channel: inputs.channel,
      message_ts: postResp.ts,
    };

    // 2. Complete function with outputs
    return { outputs: outputs };
  },
);