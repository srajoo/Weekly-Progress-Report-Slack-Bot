import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetGoogleAccessFunctionDefinition = DefineFunction({
  callback_id: "get_google_access",
  title: "Get google access token",
  description: "Get google access token",
  source_file: "functions/get_google_access.ts",
  input_parameters: {
    properties: {
      google_access_token_id: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google",
      },
    },
    required: ["google_access_token_id"],
  },
  output_parameters: {
    properties: {
      creator_access_token_id: {
        type: Schema.types.string,
        description: "The Google access token ID of the creator",
      },
    },
    required: ["creator_access_token_id"],
  },
});

export default SlackFunction(
  GetGoogleAccessFunctionDefinition,
  async({ inputs, client }) => {

    console.log(inputs);
    
    const auth = await client.apps.auth.external.get({
      external_token_id: inputs.google_access_token_id,
    });

    

    if (!auth.ok) {
      return {
        error: `Failed to collect Google auth token: ${auth.error}`,
      };
    }

    return {
      outputs: {
        creattor_access_token_id: inputs.google_access_token_id,
      },
    };
  },
);