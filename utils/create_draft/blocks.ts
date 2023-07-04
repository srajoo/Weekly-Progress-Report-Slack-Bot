import {
  Block,
  KnownBlock,
  ModalView,
} from "https://cdn.skypack.dev/@slack/types?dts";

import { dividerBlock, mrkdwnSectionBlock, codeBlock, HeaderBlock } from "../send_report/blocks.ts";
import { contextBlock, mrkdwnElement} from "../post_summary/blocks.ts";

export const buildDraftBlocks = (
  draft_id: string,
  created_by: string,
  project: string,
  manager: string,
  hours: number,
  sprint_status: string,
  green: string,
  yellow: string,
  red: string,
  channels: string[],
): (KnownBlock | Block)[] => {
  
  const initialBlocks: KnownBlock[] = [
    mrkdwnSectionBlock(
      `:pencil: *This is a draft report and has NOT been sent.*\n\n*Created by:* <@${created_by}>\n*Sent to:* <#${channels.join(">, <#")}>`,
    ),
    {
      "type": "actions",
      "block_id": `${draft_id}`,
      "elements": [  
        {
          "type": "button",
          "style": "primary",
          "text": {
            "type": "plain_text",
            "text": "Send Report",
          },
          "value": `send`,
          "action_id": "send_button",
        },
        {
          "type": "overflow",
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": "Edit the draft report",
              },
              "value": "edit_message_overflow",
            },
          ],
          "action_id": "preview_overflow",
        },
      ],
    },
    dividerBlock(),
    contextBlock(mrkdwnElement("*_Draft Begin_*")),
    HeaderBlock("Weekly Project Status"),
  ];

  const preview_blocks: KnownBlock[] = [
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*Project:*\n${project}`,
        },
        {
          "type": "mrkdwn",
          "text": `*Project Manager:*\n${manager}`,
        },
        {
          "type": "mrkdwn",
          "text": `*Projected billable hours:*\n${hours}`,
        },
        
      ]
     },
     mrkdwnSectionBlock(`\n:hourglass_flowing_sand: *Project Status:* ${sprint_status}`),
     dividerBlock(),
     mrkdwnSectionBlock(":star2: *Success Stories:*"),
     codeBlock(green),
     mrkdwnSectionBlock(":construction: *Minor Issues:*"),
     codeBlock(yellow),
     mrkdwnSectionBlock(":exclamation: *Critical Issues:*"),
     codeBlock(red),
  ];

  let draftBlocks: KnownBlock[] = initialBlocks.concat(preview_blocks);
  
  draftBlocks.push(
    contextBlock(mrkdwnElement("\n*_Draft End_*")),
  );
  
  return draftBlocks;
};


export const buildEditModal = (
  id: string,
  project: string,
  manager: string,
  hours: number,
  sprint_status: string,
  green: string,
  yellow: string,
  red: string,
  thread_ts: string,
): ModalView => {
  
  const view: ModalView = {
    "type": "modal",
    "callback_id": "edit_message_modal",
    "private_metadata": JSON.stringify({
      id: id,
      thread_ts: thread_ts,
    }),
    "title": {
      "type": "plain_text",
      "text": "Edit the draft report",
    },
    "submit": {
      "type": "plain_text",
      "text": "Save",
    },
    "close": {
      "type": "plain_text",
      "text": "Cancel",
    },
    "blocks": [
      {
        "type": "input",
        "block_id": "project_block",
        "element": {
          "type": "plain_text_input",
          "action_id": "project_input",
          "initial_value": project,
        },
        "label": {
          "type": "plain_text",
          "text": "Project",
          "emoji": true
        },
      },
      {
        "type": "input",
        "block_id": "manager_block",
        "element": {
          "type": "plain_text_input",
          "action_id": "manager_input",
          "initial_value": manager,
        },
        "label": {
          "type": "plain_text",
          "text": "Project Manager",
          "emoji": true
        },
      },
      {
        "type": "input",
        "block_id": "hours_block",
        "element": {
          "type": "number_input",
          "is_decimal_allowed": true,
          "action_id": "hours_input",
          "initial_value": hours.toString(),
        },
        "label": {
          "type": "plain_text",
          "text": "Projected billable hours for the next week",
          "emoji": true
        },
      },
      {
        "type": "input",
        "block_id": "sprint_status_block",
        "label": {
          "type": "plain_text",
          "text": "Project Status",
          "emoji": true
        },
        "element": {
          "type": "static_select",
          "action_id": "sprint_status_input",
          "initial_option": {
            "text": {
              "type": "plain_text",
              "text": sprint_status,
              "emoji": true
            },
            "value": sprint_status
          },
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": ":green-flag:",
                "emoji": true
              },
              "value": ":green-flag:"
            },
            {
              "text": {
                "type": "plain_text",
                "text": ":yellow-flag:",
                "emoji": true
              },
              "value": ":yellow-flag:"
            },
            {
              "text": {
                "type": "plain_text",
                "text": ":red-flag:",
                "emoji": true
              },
              "value": ":red-flag:"
            },
          ],
        },
      },
      {
        "type": "input",
        "block_id": "green_block",
        "element": {
          "type": "plain_text_input",
          "multiline": true,
          "action_id": "green_input",
          "initial_value": green
        },
        "label": {
          "type": "plain_text",
          "text": "Success Stories",
          "emoji": true
        },
      },
      {
        "type": "input",
        "block_id": "yellow_block",
        "element": {
          "type": "plain_text_input",
          "multiline": true,
          "action_id": "yellow_input",
          "initial_value": yellow
        },
        "label": {
          "type": "plain_text",
          "text": "Minor Issues",
          "emoji": true
        },
      },
      {
        "type": "input",
        "block_id": "red_block",
        "element": {
          "type": "plain_text_input",
          "multiline": true,
          "action_id": "red_input",
          "initial_value": red
        },
        "label": {
          "type": "plain_text",
          "text": "Critical Issues",
          "emoji": true
        },
      },
    ],
  };

  return view;

};


export const buildConfirmSendModal = (
  id: string,
  channels: string[],
): ModalView => {
  const view: ModalView = {
    "type": "modal",
    "callback_id": "confirm_send_modal",
    "private_metadata": JSON.stringify({
      id: id,
    }),
    "title": {
      "type": "plain_text",
      "text": "Send your report",
    },
    "submit": {
      "type": "plain_text",
      "text": "Submit",
    },
    "close": {
      "type": "plain_text",
      "text": "Keep editing",
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text":
            `*Are you sure you want to send this report?* `,
        },
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `The report will be posted in the following channels:_\n<#${channels.join(">, <#")}>`,
        },  
      },
    ],
  };

  return view;
};
