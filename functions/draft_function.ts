import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

import DraftDatastore from "../datastores/drafts.ts";
import { DraftStatus, ChatPostMessageParams } from "../utils/create_draft/types.ts";
import { buildDraftBlocks } from "../utils/create_draft/blocks.ts";

import { confirmReportForSend, 
          openDraftEditView, 
          prepareSendReport,
          saveDraftEditSubmission 
      } from "../utils/create_draft/interactivity_handler.ts";

/**
 * This is a custom function manifest definition which
 * creates and sends a draft report to a channel.
 */

export const DraftFunctionDefinition = DefineFunction({
  callback_id: "draft_function",
  title: "Create a draft report",
  description: "Creates and sends a draft report to channel for review before sending",
  source_file: "functions/draft_function.ts",
  input_parameters: {
    properties: {
      created_by: {
        type: Schema.slack.types.user_id,
        description: "The user that created the report draft",
      },
      project: {
        type: Schema.types.string,
        description: "Project Name"
      },
      manager: {
        type: Schema.types.string,
        description: "Project Manager"
      },
      hours: {
        type: Schema.types.number,
        description: "Projected billable hours for next week"
      },
      sprint_status: {
        type: Schema.types.string,
        description: "Current sprint status"
      },
      green: {
        type: Schema.types.string,
        description: "Success stories"
      },
      yellow: {
        type: Schema.types.string,
        description: "Minor issues"
      },
      red: {
        type: Schema.types.string,
        description: "Critical issues"
      },
      channel: {
        type: Schema.slack.types.channel_id,
        description: "The channel where the report will be drafted",
      },
      channels: {
        type: Schema.types.array,
        items: {
          type: Schema.slack.types.channel_id,
        },
        description: "The channels where the report will be posted",
      },
    },
    required: [
      "created_by",
      "project", 
      "manager",
      "hours",
      "sprint_status",
      "green",
      "yellow",
      "red",
      "channel",
      "channels",
    ],
  },
  output_parameters: {
    properties: {
      draft_id: {
        type: Schema.types.string,
        description: "Datastore identifier for the draft",
      },
      project: {
        type: Schema.types.string,
        description: "Project Name"
      },
      manager: {
        type: Schema.types.string,
        description: "Project Manager"
      },
      hours: {
        type: Schema.types.number,
        description: "Projected billable hours for next week"
      },
      sprint_status: {
        type: Schema.types.string,
        description: "Current sprint status"
      },
      green: {
        type: Schema.types.string,
        description: "Success stories"
      },
      yellow: {
        type: Schema.types.string,
        description: "Minor issues"
      },
      red: {
        type: Schema.types.string,
        description: "Critical issues"
      },
      message_ts: {
        type: Schema.types.string,
        description: "The timestamp of the draft report in the Slack channel",
      },
    },
    required: [
      "draft_id",
      "project", 
      "manager", 
      "hours",
      "sprint_status",
      "green",
      "yellow",
      "red",
      "message_ts",
    ],
  }
});

/**
 * This is the handling code for the CreateDraftFunction. It will:
 * 1. Create a new datastore record with the draft
 * 2. Build a Block Kit message with the draft and send it to input channel
 * 3. Update the draft record with the successful sent drafts timestamp
 * 4. Pause function completion until user interaction
 */

export default SlackFunction(
  DraftFunctionDefinition, 
  async ({ inputs, client }) => {

    const draftId = crypto.randomUUID();

    // 1. Create a new datastore record with the draft

    const putResp = await client.apps.datastore.put<
      typeof DraftDatastore.definition
    >({
      datastore: DraftDatastore.name,
      item: {
        id: draftId,
        created_by: inputs.created_by,
        project: inputs.project,
        manager: inputs.manager,
        hours: inputs.hours,
        sprint_status: inputs.sprint_status,
        green: inputs.green,
        yellow: inputs.yellow,
        red: inputs.red,
        channels: inputs.channels,
        channel: inputs.channel,
        status: DraftStatus.Draft,
      }
    });

    if (!putResp.ok) {
      const draftSaveErrorMsg =
        `Error saving draft report. Contact the app maintainers with the following information - (Error detail: ${putResp.error})`;
      console.log(draftSaveErrorMsg);

      return { error: draftSaveErrorMsg };
    }

    // 2. Build a Block Kit message with draft report and send it to input channel

    const blocks = buildDraftBlocks(
      draftId,
      inputs.created_by,
      inputs.project,
      inputs.manager,
      inputs.hours,
      inputs.sprint_status,
      inputs.green,
      inputs.yellow,
      inputs.red,
      inputs.channels
    );

    const params: ChatPostMessageParams = {
      channel: inputs.channel,
      blocks: blocks,
      text: `A report draft was posted`,
    };

    const postDraftResp = await client.chat.postMessage(params);
    if (!postDraftResp.ok) {
      const draftPostErrorMsg =
        `Error posting draft report to ${params.channel}. Contact the app maintainers with the following information - (Error detail: ${postDraftResp.error})`;
      console.log(draftPostErrorMsg);

      return { error: draftPostErrorMsg };
    }
    
    // 3. Update the draft record with the successful sent drafts timestamp

    const putResp2 = await client.apps.datastore.update<
      typeof DraftDatastore.definition
    >({
      datastore: DraftDatastore.name,
      item: {
        id: draftId,
        message_ts: postDraftResp.ts,
      },
    });


    if (!putResp2.ok) {
      const draftUpdateErrorMsg =
        `Error updating draft report timestamp for ${draftId}. Contact the app maintainers with the following information - (Error detail: ${putResp2.error})`;
      console.log(draftUpdateErrorMsg);

      return { error: draftUpdateErrorMsg };
    }

    /**
     * IMPORTANT! Set `completed` to false in order to pause function's complete state
     * since we will wait for user interaction in the button handlers below.
     * Steps after this step in the workflow will not execute until we
     * complete our function.
     */

    return { completed: false };
  },
).addBlockActionsHandler(
  "preview_overflow",
  openDraftEditView,
).addViewSubmissionHandler(
  "edit_message_modal",
  saveDraftEditSubmission,
).addBlockActionsHandler(
  "send_button",
  confirmReportForSend,
).addViewSubmissionHandler(
  "confirm_send_modal",
  prepareSendReport,
);