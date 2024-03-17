import { SFNClient, StartSyncExecutionCommand } from '@aws-sdk/client-sfn';
import {
  ErrorHandler,
  HandlerInput,
  RequestHandler,
} from 'ask-sdk-core';
import {
  Response,
  SessionEndedRequest,
} from 'ask-sdk-model';

const sfnClient = new SFNClient({ region: process.env.AWS_REGION});

const LaunchRequestHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';        
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = `Welcome to ${process.env.SKILL_NAME} skill. Ask me what you want!`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(`Welcome to ${process.env.SKILL_NAME}` , speechText)
      .getResponse();
  },
};

const AskWantItIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;  
    return request.type === 'IntentRequest'
      && request.intent.name === process.env.SKILL_NAME;
  },
  async handle(handlerInput : HandlerInput) : Promise<Response> {
    const item = {
      Id: handlerInput.requestEnvelope.session?.sessionId,
      timestamp: new Date().toISOString(),
      message: (handlerInput.requestEnvelope.request as any)?.intent?.slots?.sentence?.value
    };
    const sfnresponse = await sfnClient.send(new StartSyncExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      input: JSON.stringify(item)
    }));
  
    let speechText = JSON.parse(sfnresponse.output ?? '{}')?.Body?.outputs?.[0]?.text;
    let finalSpeechtext = speechText?.split('Assistant:')[1];

    return handlerInput.responseBuilder
      .speak(finalSpeechtext)
      .reprompt('Are ok with that?')
      .withSimpleCard('You will get it.', finalSpeechtext)
      .getResponse()
  },
};

const HelpIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;    
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'You can ask me waht you want!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Ask waht you want', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
         || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Goodbye!', speechText)
      .withShouldEndSession(true)      
      .getResponse();
  },
};

const SessionEndedRequestHandler : RequestHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;    
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput : HandlerInput) : Response {
    console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler : ErrorHandler = {
  canHandle(handlerInput : HandlerInput, error : Error ) : boolean {
    return true;
  },
  handle(handlerInput : HandlerInput, error : Error) : Response {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I don\'t understand your command. Please say it again.')
      .reprompt('Sorry, I don\'t understand your command. Please say it again.')
      .getResponse();
  }
};

const YesIntentHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'It is great, so lets do it!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Agreement', speechText)
      .getResponse();  
  }
}

const NoIntentHandler = {
  canHandle(handlerInput : HandlerInput) : boolean {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput : HandlerInput) : Response {
    const speechText = 'Ok, You can ask or say what is your preferance and what you propose!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Ask what you want', speechText)
      .getResponse();  }
}

export {
  LaunchRequestHandler,
  AskWantItIntentHandler,
  HelpIntentHandler,
  CancelAndStopIntentHandler,
  SessionEndedRequestHandler,
  ErrorHandler,
  YesIntentHandler,
  NoIntentHandler
}