// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const path = require('path');
const restify = require('restify');

// Import required bot services.
const { BotFrameworkAdapter, ConversationState, MemoryStorage, UserState } = require('botbuilder');

// Import LUIS Service
const { LuisConfig } = require('./dialogs/luisConfig');

// Import QnA Service
const { QnAConfig } = require('./dialogs/QnAConfig');

// This bot's main dialog.
const { WelcomeAndDialogBot } = require('./bots/welcomeAndDialogBot');
const { MainDialog } = require('./dialogs/mainDialog');

// This bot's change address dialog.
const { ChangeUserAddressDialog } = require('./dialogs/changeUserAddressDialog');
const CHANGE_USER_ADDRESS_DIALOG = 'changeUserAddressDialog';

// This bot's change email dialog.
const { ChangeUserEmailDialog } = require('./dialogs/changeUserEmailDialog');
const CHANGE_USER_EMAIL_DIALOG = 'changeUserEmailDialog';

// This bot's get user's address dialog.
const { GetUserAddressDialog } = require('./dialogs/getUserAddressDialog');
const GET_USER_ADDRESS_DIALOG = 'getUserAddressDialog';

// This bot's get user's email dialog.
const { GetUserEmailDialog } = require('./dialogs/getUserEmailDialog');
const GET_USER_EMAIL_DIALOG = 'getUserEmailDialog';

// This bot's get user's detail dialog.
const { GetUserDetailsDialog } = require('./dialogs/getUserDetailsDialog');
const GET_USER_DETAILS_DIALOG = 'getUserDetailsDialog';

// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppID,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// getting properties of LUIS from .env file and configure that properties
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = { applicationId: LuisAppId, endpointKey: LuisAPIKey, endpoint: `https://${ LuisAPIHostName }` };

const luisRecognizer = new LuisConfig(luisConfig);

// getting properties of QnA from .env file and configure that properties
const { QnAKnowledgebaseId, QnAEndpointKey, QnAEndpointHostName } = process.env;
const qnaConfig = { knowledgeBaseId: QnAKnowledgebaseId, endpointKey: QnAEndpointKey, host: QnAEndpointHostName };

const QnAMaker = new QnAConfig(qnaConfig);

// Create the main dialog.
const changeUserAddressDialog = new ChangeUserAddressDialog(CHANGE_USER_ADDRESS_DIALOG);
const changeUserEmailDialog = new ChangeUserEmailDialog(CHANGE_USER_EMAIL_DIALOG);
const getUserAddressDialog = new GetUserAddressDialog(GET_USER_ADDRESS_DIALOG);
const getUserEmailDialog = new GetUserEmailDialog(GET_USER_EMAIL_DIALOG);
const getUserDetailsDialog = new GetUserDetailsDialog(GET_USER_DETAILS_DIALOG);
const dialog = new MainDialog(luisRecognizer, QnAMaker, changeUserAddressDialog, changeUserEmailDialog, getUserAddressDialog, getUserEmailDialog, getUserDetailsDialog);
const coreBot = new WelcomeAndDialogBot(conversationState, userState, dialog);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await coreBot.run(context);
    });
});
