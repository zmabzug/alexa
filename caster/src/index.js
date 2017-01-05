/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 * - Web service: communicate with an external web service to get tide data from NOAA CO-OPS API (http://tidesandcurrents.noaa.gov/api/)
 * - Multiple optional slots: has 2 slots (city and date), where the user can provide 0, 1, or 2 values, and assumes defaults for the unprovided values
 * - DATE slot: demonstrates date handling and formatted date responses appropriate for speech
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 *   If the user provides an incorrect slot in a one-shot model, it will direct to the dialog model. See the
 *   examples section for sample interactions of these models.
 * - Pre-recorded audio: Uses the SSML 'audio' tag to include an ocean wave sound in the welcome response.
 *
 * Examples:
 * One-shot model:
 *  User:  "Alexa, ask Tide Pooler when is the high tide in Seattle on Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 * Dialog model:
 *  User:  "Alexa, open Tide Pooler"
 *  Alexa: "Welcome to Tide Pooler. Which city would you like tide information for?"
 *  User:  "Seattle"
 *  Alexa: "For which date?"
 *  User:  "this Saturday"
 *  Alexa: "Saturday June 20th in Seattle the first high tide will be around 7:18 am,
 *          and will peak at ...""
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * Caster is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Caster = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Caster.prototype = Object.create(AlexaSkill.prototype);
Caster.prototype.constructor = Caster;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

Caster.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

Caster.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

Caster.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
Caster.prototype.intentHandlers = {
    "OneShot": function (intent, session, response) {
        handleOneShot(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- Caster Domain Specific Business Logic --------------------------

function handleWelcomeRequest(response) {
    var whichCityPrompt = "What would you like to watch?",
        speechOutput = {
            speech: "<speak>Welcome to Caster. "
                + whichCityPrompt
                + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        };

    response.ask(speechOutput);
}

function handleHelpRequest(response) {
    var repromptText = "What would you like to watch?";
    var speechOutput = "I am currently equipped to "
        + "stream shows and movies from Netflix, Hulu, and HBO Go. "  
        + "Or you can say exit. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

/**
 * Handle no slots, or slot(s) with no values.
 * In the case of a dialog based skill with multiple slots,
 * when passed a slot with no value, we cannot have confidence
 * it is the correct slot type so we rely on session state to
 * determine the next turn in the dialog, and reprompt.
 */
function handleNoSlotDialogRequest(intent, session, response) {
    if (intent.slots.Query) {
        // get date re-prompt
        var repromptText = "Help me! ";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    } else {
        var repromptText = "I can't understand your request. Please tell Zack!";
        var speechOutput = repromptText;

        response.ask(speechOutput, repromptText);
    }
}

/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneShot(intent, session, response) {
	
	var serviceSlot = intent.slots.Service.value;
	var querySlot = intent.slots.Query.value;

    
    var payload = JSON.stringify({ 
        "value1" : serviceSlot,
		"value2" : querySlot
    });
    var post_options = {
        host: 'maker.ifttt.com',
        port: 80,
        path: '/trigger/caster/with/key/fcxi3_Oyxpy0GkTocUN5Q',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
    };
    var req = http.request(post_options, (ress) => {
         console.log(`STATUS: ${ress.statusCode}`);
         console.log(`HEADERS: ${JSON.stringify(ress.headers)}`);
         ress.setEncoding('utf8');
         ress.on('data', (chunk) => {
             console.log(`BODY: ${chunk}`);
         });
         ress.on('end', () => {
             console.log('No more data in response.');
         });
     });
     req.on('error', (e) => {
          console.log(`problem with request: ${e.message}`);
          });

      req.write(payload);
      req.end();
	  
	  var speechOutput = "Searching " + serviceSlot + " for " + querySlot + ".";
      response.tellWithCard(speechOutput, "Caster", speechOutput)	  
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var caster = new Caster();
    caster.execute(event, context);
};

