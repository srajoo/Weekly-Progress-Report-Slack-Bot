import {
  BlockActionHandler,
  ViewSubmissionHandler,
} from "deno-slack-sdk/functions/interactivity/types.ts";

import { DraftFunctionDefinition as CreateDraftFunction } from "../../functions/draft_function.ts";
import { buildConfirmSendModal, buildDraftBlocks, buildEditModal } from "./blocks.ts";
import DraftDatastore from "../../datastores/drafts.ts";


export const openDraftEditView: BlockActionHandler<
  typeof CreateDraftFunction.definition
> = async ({ body, action, client }) => {
  if (action.selected_option.value == "edit_message_overflow") {
    const id = action.block_id;
  
    // Get the draft
    const putResp = await client.apps.datastore.get<
      typeof DraftDatastore.definition
    >(
       {
        datastore: DraftDatastore.name,
        id: id,
       },
    );



    if (!putResp.ok) {
      const draftGetErrorMsg =
        `Error getting draft with id ${id}. Contact the app maintainers with the following - (Error detail: ${putResp.error})`;
      console.log(draftGetErrorMsg);

      await client.functions.completeError({
        function_execution_id: body.function_data.execution_id,
        error: draftGetErrorMsg,
      });
    }

    // Prepare the draft edit view

    const editModalView = buildEditModal(
      id,
      putResp.item.project,
      putResp.item.manager,
      putResp.item.hours,
      putResp.item.sprint_status,    
      putResp.item.green,
      putResp.item.yellow,
      putResp.item.red,
      body.message?.ts || "",
    );


    // Open the draft edit modal view
    const viewsOpenResp = await client.views.open({
      interactivity_pointer: body.interactivity.interactivity_pointer,
      view: editModalView,
    });


    if (!viewsOpenResp.ok) {
      const draftEditModalErrorMsg =
        `Error opening up the draft edit modal view. Contact the app maintainers with the following - (Error detail: ${viewsOpenResp.error}`;
      console.log(draftEditModalErrorMsg);

      await client.functions.completeError({
        function_execution_id: body.function_data.execution_id,
        error: draftEditModalErrorMsg,
      });
    }
  }
};

export const saveDraftEditSubmission: ViewSubmissionHandler<
  typeof CreateDraftFunction.definition
> = async ({ inputs, view, client },) => {


  const { id, thread_ts } = JSON.parse(view.private_metadata || "");

  const project = view.state.values.project_block.project_input.value;
  const manager = view.state.values.manager_block.manager_input.value;
  const hours = Number(view.state.values.hours_block.hours_input.value);
  const sprint_status = view.state.values.sprint_status_block.sprint_status_input.selected_option.value;
  const green = view.state.values.green_block.green_input.value;
  const yellow = view.state.values.yellow_block.yellow_input.value;
  const red = view.state.values.red_block.red_input.value;
  
  

  const putResp = await client.apps.datastore.update({
    datastore: DraftDatastore.name,
    item: {
      id: id,
      project: project,
      manager: manager,
      hours: hours,
      sprint_status: sprint_status,
      green: green,
      yellow: yellow,
      red: red,
    },
  });

  if (!putResp.ok) {
    const updateDraftMessageErrorMsg =
      `Error updating draft ${id} report. Contact the app maintainers with the following - (Error detail: ${putResp.error})`;
    console.log(updateDraftMessageErrorMsg);
    return;
  }

  const blocks = buildDraftBlocks(
    id,
    inputs.created_by,
    project,
    manager,
    hours,
    sprint_status,
    green,
    yellow,
    red,
    inputs.channels,
  );

  const updateResp = await client.chat.update({
    channel: inputs.channel,
    ts: thread_ts,
    blocks: blocks,
  });

  if (!updateResp.ok) {
    const updateDraftPreviewErrorMsg =
      `Error updating report: ${thread_ts} in channel ${inputs.channel}. Contact the app maintainers with the following - (Error detail: ${updateResp.error})`;
    console.log(updateDraftPreviewErrorMsg);
  }
};


export const confirmReportForSend: BlockActionHandler<
  typeof CreateDraftFunction.definition
> = async ( { inputs, body, action, client },) => {

  const id = action.block_id;

  const view = buildConfirmSendModal(id, inputs.channels);

  await client.views.open({
    interactivity_pointer: body.interactivity.interactivity_pointer,
    view: view,
  });
};

export const prepareSendReport: ViewSubmissionHandler<
  typeof CreateDraftFunction.definition
> = async ({ body, view, client }) => {
  const { id } = JSON.parse(view.private_metadata || "");

  // Fetch latest version of the message from the datastore
  const getResp = await client.apps.datastore.get<
    typeof DraftDatastore.definition
  >(
    {
      datastore: DraftDatastore.name,
      id: id,
    },
  );


  if (!getResp.ok) {
    const draftGetErrorMsg =
      `Failed to fetch draft report id: ${id} for send. Contact the app maintainers with the following - (Error detail: ${getResp.error})`;
    console.log(draftGetErrorMsg);
    return;
  }

  const { item } = getResp;


  // Build function outputs
  const outputs = {
    project: item.project,
    manager: item.manager,
    hours: item.hours,
    sprint_status: item.sprint_status,
    green: item.green,
    yellow: item.yellow,
    red: item.red,
    message_ts: item.message_ts,
    draft_id: id,
  };

  const complete = await client.functions.completeSuccess({
    function_execution_id: body.function_data.execution_id,
    outputs,
  });

  if (!complete.ok) {
    console.error("Error completing function", complete);

    await client.functions.completeError({
      function_execution_id: body.function_data.execution_id,
      error: "Error completing function",
    });
  }
};