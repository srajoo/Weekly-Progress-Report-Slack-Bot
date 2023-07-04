import {
  Block,
  DividerBlock,
  KnownBlock,
  SectionBlock,
  HeaderBlock
} from "https://cdn.skypack.dev/@slack/types?dts";


export const buildReportBlocks = (
  project: string,
  manager: string,
  hours: number,
  sprint_status: string,
  green: string,
  yellow: string,
  red: string,
): KnownBlock[]  => {

  const blocks: KnownBlock[] = [
    HeaderBlock("Weekly Project Status"),
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

  return blocks;
};

/*
export const buildSentBlocks = (
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

  const initialText = `:white_check_mark: *This weekly progress report was sent*\n*Created by:*<@${created_by}>\n*Sent to:*<#${channels.join(">, <#")}>`;

  const initialBlocks = [
    mrkdwnSectionBlock(initialText),
    dividerBlock(),
  ];

  const reportBlock = [
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


  
  let sentBlocks = initialBlocks.concat(reportBlock);
  
  return sentBlocks;
};

*/

export function HeaderBlock(message: string): HeaderBlock {
  return {
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": message,
    },
  };
}

export function mrkdwnSectionBlock(message: string): SectionBlock {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": message,
    },
  };
}

export function dividerBlock(): DividerBlock {
  return {
    "type": "divider",
  };
}

export function codeBlock(text: string): SectionBlock {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "```"+text+"```"
    }
  }
}