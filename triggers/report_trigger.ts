import { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import ReportWorkflow from '../workflows/report_workflow.ts';

/*
 * This is a definition file for a shortcut link trigger
 */

const reportTrigger: Trigger<typeof ReportWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Create a weekly report",
  description: "Create and send a weekly report to one or more channels.",
  workflow: `#/workflows/${ReportWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    created_by: {
      value: TriggerContextData.Shortcut.user_id,
    }
  },
};

export default reportTrigger;