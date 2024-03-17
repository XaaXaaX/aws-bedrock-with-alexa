import { SkillBuilders } from 'ask-sdk-core';
import { 
  AskWantItIntentHandler, 
  CancelAndStopIntentHandler, 
  ErrorHandler, 
  HelpIntentHandler, 
  LaunchRequestHandler, 
  NoIntentHandler, 
  SessionEndedRequestHandler, 
  YesIntentHandler
} from './skills';
import { CustomSkill } from 'ask-sdk-core/dist/skill/CustomSkill';
import { Context } from 'aws-lambda';
import { RequestEnvelope } from 'ask-sdk-model';

let skill: CustomSkill | null = null;

export const handler = async (event: RequestEnvelope, context: Context) => {
  console.log(`REQUEST++++: ${JSON.stringify(event)}`);
  if (!skill) {
    skill = SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        AskWantItIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        YesIntentHandler,
        NoIntentHandler
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`RESPONSE++++${JSON.stringify(response)}`);

  return response;
};