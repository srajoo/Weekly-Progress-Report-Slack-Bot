import { Manifest } from "deno-slack-sdk/mod.ts";
import ReportWorkflow from "./workflows/report_workflow.ts";
import DraftDatastore from "./datastores/drafts.ts";
import ReportDatastore from "./datastores/reports.ts"
import { ReportCustomType } from "./utils/post_summary/types.ts";

import GoogleProvider from "./external_auth/google_provider.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/future/manifest
 */
export default Manifest({
  name: "Weekly Progress Report Bot",
  description: "An app to create and send a weekly report to one or more channels.",
  icon: "assets/progress-report.png",
  externalAuthProviders: [GoogleProvider],
  datastores: [DraftDatastore, ReportDatastore],
  workflows: [ReportWorkflow],
  outgoingDomains: ["cdn.skypack.dev", "sheets.googleapis.com"],
  types:[ReportCustomType],
  botScopes: [
    "commands", 
    "chat:write", 
    "chat:write.public", 
    "chat:write.customize",
    "datastore:read",
    "datastore:write",  
  ],
});
