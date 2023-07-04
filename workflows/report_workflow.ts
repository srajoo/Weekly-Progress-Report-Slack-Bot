import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ReportFunctionDefinition } from "../functions/report_function.ts";
import { DraftFunctionDefinition } from "../functions/draft_function.ts";
import { SummaryFunctionDefinition } from "../functions/summary_function.ts";


/**
 * A workflow is a set of steps that are executed in order
 * Each step in a workflow is a function.
 * This workflow uses interactivity.
 */

const ReportWorkflow = DefineWorkflow({
  callback_id: "report_workflow",
  title: "Create a weekly report",
  description: "Create and send a weekly report to one or more channels.",
  input_parameters: {
    properties: {
      created_by: {
        type: Schema.slack.types.user_id,
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      }
    },
    required: ["created_by", "interactivity"],
  },
});

// Step 1: Open a form to create a report using built-in function, OpenForm

const formStep = ReportWorkflow.addStep(Schema.slack.functions.OpenForm, 
  {
    title: "Create a weekly report",
    description: "Create a draft report. You will have the opportunity to preview & edit it in channel before sending.\n\n Use the form to estimate the progress of your project and provide details in the end.",
    interactivity: ReportWorkflow.inputs.interactivity,
    submit_label: "Preview",
    fields: {
      elements: [
        {
          name: "project",
          title: "Project Name",
          type: Schema.types.string,
        },
        {
	        name: "manager",
	        title: "Project Manager",
	        type: Schema.types.string,
        },
        {
	        name: "hours",
	        title: "Projected billable hours for next week",
	        type: Schema.types.number,
          description: "Enter 0 if none."
        },
        {
          name: "sprint_progress_1",
          title: "Were all the tasks planned for the sprint is on tracker or completed within the scheduled timeframe?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_progress_2",
          title: "Do you foresee any significant delays for the upcoming releases or the final delivery?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_progress_3",
          title: "Did the sprint encounter a notable number of bugs?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_progress_4",
          title: "Were any planned milestones successfully achieved?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_progress_5",
          title: "Were there any instances of miscommunication or misunderstandings with the client?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_plan_1",
          title: "Do we have an adequate number of tasks lined up for the next sprint?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_plan_2",
          title: "In terms of task allocation for the next sprint, do you foresee any potential bottlenecks arising from an excessive number of tasks, resource limitations, or a lack of expertise among the assigned resources?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_plan_3",
          title: "Did we have or will we have any idle resources/staff in the project for the next sprint?",
          type: Schema.types.boolean
        },
        {
          name: "quality",
          title: "Did any system failures, technical glitches, or critical issues arise during production or were reported by the client?",
          type: Schema.types.boolean
        },
        {
          name: "cost_and_time_1",
          title: "Was there excessive moderation required for the hour logs in the past week?",
          type: Schema.types.boolean
        },
        {
          name: "cost_and_time_2",
          title: "Did any unexpected expenses occur due to non-billable tasks?",
          type: Schema.types.boolean
        },
        {
          name: "cost_and_time_3",
          title: "Do you anticipate any significant changes in the financial projections for the month?",
          type: Schema.types.boolean
        },
        {
          name: "resource_1",
          title: "Did the team face difficulties in handling the workload due to a shortage of resources?",
          type: Schema.types.boolean
        },
        {
          name: "resource_2",
          title: "Were you able to identify any skill or expertise gaps within your team?",
          type: Schema.types.boolean
        },
        {
          name: "resource_3",
          title: "Were there any team members who were overloaded with tasks?",
          type: Schema.types.boolean
        },
        {
          name: "sprint_status",
          title: "Current Project Status",
          type: Schema.types.string,
          enum: [
            ":green-flag:",
            ":yellow-flag:",
            ":red-flag:"
          ],
          description: ":green-flag: there are no issues or overruns.\n\n:yellow-flag: there are minor issues.\n\n:red-flag: there are significant issues."
        },
        {
          name: "green",
          title: "Success stories",
          type: Schema.types.string,
          long: true
        },
        {
          name: "yellow",
          title: "Minor issues",
          type: Schema.types.string,
          long: true
        },
        {
          name: "red",
          title: "Critical issues",
          type: Schema.types.string,
          long: true
        },
        {
          name: "channel",
          title: "Draft channel",
          type: Schema.slack.types.channel_id,
          default: ReportWorkflow.inputs.channel,
          description:
            "The channel where you and your team can preview & edit the report before sending",
        },
        {
          name: "channels",
          title: "Destination channel(s)",
          type: Schema.types.array,
          items: {
            type: Schema.slack.types.channel_id,
          },
          description: "The channels where your report will be posted",
        }
      ],
      required: [
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
        "channel"
      ],
    },
  }
);

// Step 2: Create a draft report
// This step uses a custom function 

const draftStep = ReportWorkflow.addStep(
  DraftFunctionDefinition,
  {
    created_by: ReportWorkflow.inputs.created_by,
    project: formStep.outputs.fields.project,
    manager: formStep.outputs.fields.manager,
    hours: formStep.outputs.fields.hours,
    sprint_status: formStep.outputs.fields.sprint_status,
    green: formStep.outputs.fields.green,
    yellow: formStep.outputs.fields.yellow,
    red: formStep.outputs.fields.red,
    channels: formStep.outputs.fields.channels,
    channel: formStep.outputs.fields.channel
  }
);


// Step 3: Send report to slack and save response to google sheets.

const sendStep = ReportWorkflow.addStep(
  ReportFunctionDefinition, 
  {
    created_by: ReportWorkflow.inputs.created_by, 
    google_access_token_id: {
      credential_source: "DEVELOPER",
    },
    project: draftStep.outputs.project,
    manager: draftStep.outputs.manager,
    hours: draftStep.outputs.hours,
    sprint_progress_1: formStep.outputs.fields.sprint_progress_1,
    sprint_progress_2: formStep.outputs.fields.sprint_progress_1,
    sprint_progress_3: formStep.outputs.fields.sprint_progress_1,
    sprint_progress_4: formStep.outputs.fields.sprint_progress_1,
    sprint_progress_5: formStep.outputs.fields.sprint_progress_1, 
    sprint_plan_1: formStep.outputs.fields.sprint_plan_1,
    sprint_plan_2: formStep.outputs.fields.sprint_plan_2,
    sprint_plan_3: formStep.outputs.fields.sprint_plan_3,
    quality: formStep.outputs.fields.quality,
    cost_and_time_1: formStep.outputs.fields.cost_and_time_1,
    cost_and_time_2: formStep.outputs.fields.cost_and_time_2,
    cost_and_time_3: formStep.outputs.fields.cost_and_time_3,
    resource_1: formStep.outputs.fields.resource_1,
    resource_2: formStep.outputs.fields.resource_2,
    resource_3: formStep.outputs.fields.resource_3,
    sprint_status: draftStep.outputs.sprint_status,
    green: draftStep.outputs.green,
    yellow: draftStep.outputs.yellow,
    red: draftStep.outputs.red,
    channels: formStep.outputs.fields.channels,
    draft_id: draftStep.outputs.draft_id,
  }
);

// Step 4: Post message summary of report.
ReportWorkflow.addStep(
  SummaryFunctionDefinition, 
  {
    reports: sendStep.outputs.reports,
    channel: formStep.outputs.fields.channel,
    message_ts: draftStep.outputs.message_ts,
  }
);


export default ReportWorkflow;