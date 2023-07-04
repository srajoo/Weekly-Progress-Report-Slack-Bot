import { DefineFunction, Schema, SlackFunction} from "deno-slack-sdk/mod.ts";
import { ReportCustomType } from "../utils/post_summary/types.ts";

import { SlackAPIClient } from "deno-slack-sdk/types.ts";

import { buildReportBlocks} from "../utils/send_report/blocks.ts";
import { ReportType } from "../utils/post_summary/types.ts";
import { ChatPostMessageParams, DraftStatus } from "../utils/create_draft/types.ts";

import DraftDatastore from "../datastores/drafts.ts"
import ReportsDatastore from "../datastores/reports.ts"

// Configuration information for the storing spreadsheet
const GOOGLE_SPREADSHEET_RANGE = "Responses!A1:W1";
const GOOGLE_SPREADSHEET_ID = "1X46HVUfQIGVa5jIGZC6Z_fnBaqPw8-fcEweaL4kZQW4";

export const ReportFunctionDefinition = DefineFunction(
  {
    callback_id: "report_function",
    title: "Send report",
    description: "Sends weekly progress report to one or more channels.",
    source_file: "functions/report_function.ts",
    input_parameters: {
      properties: {
        created_by: {
          type: Schema.slack.types.user_id,
          description: "The user that created the report draft",
        },
        google_access_token_id: {
          type: Schema.slack.types.oauth2,
          oauth2_provider_key: "google",
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
        sprint_progress_1: {
          type: Schema.types.boolean
        },
        sprint_progress_2: {
          type: Schema.types.boolean
        },
        sprint_progress_3: {
          type: Schema.types.boolean
        },
        sprint_progress_4: {
          type: Schema.types.boolean
        },
        sprint_progress_5: {
          type: Schema.types.boolean
        },
        sprint_plan_1: {
          type: Schema.types.boolean
        },
        sprint_plan_2: {
          type: Schema.types.boolean
        },
        sprint_plan_3: {
          type: Schema.types.boolean
        },
        quality: {
          type: Schema.types.boolean
        },
        cost_and_time_1: {
          type: Schema.types.boolean
        },
        cost_and_time_2: {
          type: Schema.types.boolean
        },
        cost_and_time_3: {
          type: Schema.types.boolean
        },
        resource_1: {
          type: Schema.types.boolean
        },
        resource_2: {
          type: Schema.types.boolean
        },
        resource_3: {
          type: Schema.types.boolean
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
        channels: {
          type: Schema.types.array,
          items: {
            type: Schema.slack.types.channel_id,
          },
          description: "The destination channels of the report",
        },
        draft_id: {
          type: Schema.types.string,
          description: "The datastore ID of the draft report if one was created",
        },
      },
      required: [
        "google_access_token_id",
        "project", 
        "manager",
        "hours",
        "sprint_progress_1",
        "sprint_progress_2",
        "sprint_progress_3",
        "sprint_progress_4",
        "sprint_progress_5",
        "sprint_plan_1",
        "sprint_plan_2",
        "sprint_plan_3",
        "quality",
        "cost_and_time_1",
        "cost_and_time_2",
        "cost_and_time_3",
        "resource_1",
        "resource_2",
        "resource_3",
        "sprint_status",
        "green",
        "yellow",
        "red",
        "channels",
      ],
    },
    output_parameters: {
      properties: {
        reports: {
          type: Schema.types.array,
          items: {
            type: ReportCustomType,
          },
          description: "Array of objects that includes a channel ID and permalink for each report successfully sent",
        },
      },
      required: ["reports"],
    },
  }
);

export default SlackFunction(
  ReportFunctionDefinition,
  async ({inputs, client}) => {
  
    const chatPostMessagePromises: Promise<any>[] = [];

    const draft_id = inputs.draft_id || crypto.randomUUID();

    // Save responses to a google sheet
    
    const blocks = buildReportBlocks(
      inputs.project,
      inputs.manager,
      inputs.hours,
      inputs.sprint_status,
      inputs.green,
      inputs.yellow,
      inputs.red,
    );

    for (const channel of inputs.channels) {
      const params: ChatPostMessageParams = {
        channel: channel,
        blocks: blocks,
        text: `A report was posted`,
      };

      const reportRes = sendAndSaveReport(params, draft_id, client);
      chatPostMessagePromises.push(reportRes);
    }

    const reports = await Promise.all(chatPostMessagePromises);


    // Update draft if one was created
    /*if (inputs.draft_id) {
      const { item } = await client.apps.datastore.update<
        typeof DraftDatastore.definition
      >({
        datastore: DraftDatastore.name,
        item: {
          id: inputs.draft_id,
          status: DraftStatus.Sent,
        },
      });

      const blocks = buildSentBlocks(
        item.created_by,
        inputs.project,
        inputs.manager,
        inputs.hours,
        inputs.sprint_status,
        inputs.green,
        inputs.yellow,
        inputs.red,
        inputs.channels
      );

      await client.chat.update({
        channel: item.channel,
        ts: item.message_ts,
        blocks: blocks,
      });
    } */

  
    // Delete Draft message
    
    const { item } = await client.apps.datastore.update<
        typeof DraftDatastore.definition
      >({
        datastore: DraftDatastore.name,
        item: {
          id: inputs.draft_id,
          status: DraftStatus.Sent,
        },
      });
    
    await client.chat.delete({
        channel: item.channel,
        ts: item.message_ts,
      });
    
    saveResponsesGoogleSheet(
      inputs.google_access_token_id,
      inputs.project,
      inputs.manager,
      inputs.hours,
      inputs.sprint_progress_1,
      inputs.sprint_progress_2,
      inputs.sprint_progress_3,
      inputs.sprint_progress_4,
      inputs.sprint_progress_5,
      inputs.sprint_plan_1,
      inputs.sprint_plan_2,
      inputs.sprint_plan_3,
      inputs.quality,
      inputs.cost_and_time_1,
      inputs.cost_and_time_2,
      inputs.cost_and_time_3,
      inputs.resource_1,
      inputs.resource_2,
      inputs.resource_3,
      inputs.sprint_status,
      inputs.green,
      inputs.yellow,
      inputs.red,
      client
    );

    return { outputs: { reports: reports } };

  },
);

async function sendAndSaveReport(
  params:ChatPostMessageParams,
  draft_id: string,
  client: SlackAPIClient,
  ):Promise<ReportType> {

    let report: ReportType;

    // Send it
    const post = await client.chat.postMessage(params);

    if (post.ok) {
      console.log(`Sent to ${params.channel}`);

    // Get permalink to message for use in summary
      const { permalink } = await client.chat.getPermalink({
        channel: params.channel,
        message_ts: post.ts,
      });
    

    report = {
      channel_id: params.channel,
      success: true,
      permalink: permalink,
    };
  } // There was an error sending the announcement
  else {
    console.log(`Error sending to ${params.channel}: ${post.error}`);
    report = {
      channel_id: params.channel,
      success: false,
      error: post.error,
    };
  }

  await client.apps.datastore.put<typeof ReportsDatastore.definition>({
    datastore: ReportsDatastore.name,
    item: {
      id: crypto.randomUUID(),
      draft_id: draft_id,
      success: post.ok,
      error_message: post.error,
      channel: post.channel,
      message_ts: post.ts,
    },
  });

  return report;
  
}

async function saveResponsesGoogleSheet(
  google_access_token_id: string,
  project: string,
  manager: string,
  hours: number,
  sprint_progress_1: boolean,
  sprint_progress_2: boolean,
  sprint_progress_3: boolean,
  sprint_progress_4: boolean,
  sprint_progress_5: boolean,
  sprint_plan_1: boolean,
  sprint_plan_2: boolean,
  sprint_plan_3: boolean,
  quality: boolean,
  cost_and_time_1: boolean,
  cost_and_time_2: boolean,
  cost_and_time_3: boolean,
  resource_1: boolean,
  resource_2: boolean,
  resource_3: boolean,
  sprint_status: string,
  green: string,
  yellow: string,
  red: string,
  client: SlackAPIClient
) {
  
  const submissionTime = new Date().toISOString();

  const auth = await client.apps.auth.external.get({
    external_token_id: google_access_token_id,
  });


  if (!auth.ok) {
    return { error: `Failed to collect Google auth token: ${auth.error}` };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SPREADSHEET_ID}/values/${GOOGLE_SPREADSHEET_RANGE}:append?valueInputOption=USER_ENTERED`;
  


  const response = await fetch(url, {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${auth.external_token}`,
    },
    body: JSON.stringify({
      range: GOOGLE_SPREADSHEET_RANGE,
      majorDimension: "ROWS",
      values: [[
        submissionTime, 
        project, 
        manager,
        hours,
        sprint_progress_1,
        sprint_progress_2,
        sprint_progress_3,
        sprint_progress_4,
        sprint_progress_5,
        sprint_plan_1,
        sprint_plan_2,
        sprint_plan_3,
        quality,
        cost_and_time_1,
        cost_and_time_2,
        cost_and_time_3,
        resource_1,
        resource_2,
        resource_3,
        sprint_status.slice(1, -1),
        green,
        yellow,
        red
      ]],
    }),
  });
  

  if (!response.ok) {
    return {
      error: `Failed to save response: ${response.statusText}`,
    };
  }
  return { outputs: {} };
  
}