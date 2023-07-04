import { ReportType } from "./types.ts";
import {
  Block,
  ContextBlock,
  KnownBlock,
  MrkdwnElement,
  SectionBlock
} from "https://cdn.skypack.dev/@slack/types?dts";

export const MAX_BLOCKS_LENGTH = 50;
export const SUCCESS_MATCHER = ":white_check_mark:";
export const ERROR_MATCHER = ":no_entry:";

const GOOGLE_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1X46HVUfQIGVa5jIGZC6Z_fnBaqPw8-fcEweaL4kZQW4/edit?ouid=117956134448797095619";


export const buildSummaryBlocks = (
  reportSummaries: ReportType[],
) : (KnownBlock | Block)[] => {

  const blocks: KnownBlock[] = [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Summary:*`,
      },
    },
  ];

  for (const report of reportSummaries) {
    if (blocks.length == MAX_BLOCKS_LENGTH - 1) {
      blocks.push(
        truncationBlock(),
      );
      break;
    }

    if (report.success) {
      const successMessage = `${SUCCESS_MATCHER} <${report.permalink}| Weekly Report> sent to <#${report.channel_id}> and being collected <${GOOGLE_SPREADSHEET_URL} | here>!`;

      blocks.push(contextBlock(mrkdwnElement(successMessage)),
      );
    } else {
      const errorMessage =
        `${ERROR_MATCHER} \`${report.error}\` error sending to <#${report.channel_id}>`;

        blocks.push(
          contextBlock(mrkdwnElement(errorMessage)),
        );
    }
  }
  return blocks;
};

export function contextBlock(...elements: any): ContextBlock {
  return {
    "type": "context",
    "elements": elements,
  };
}

export function mrkdwnElement(text: string): MrkdwnElement {
  return {
    "type": "mrkdwn",
    "text": text,
  };
}

export function truncationBlock(): KnownBlock {
  return contextBlock(mrkdwnElement(".... and more"));
}

export function fieldBlock(...fields: any): SectionBlock{
  return {
    "type": "section",
    "fields": fields,
  };  
}

