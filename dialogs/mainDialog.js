
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, QnAMaker, changeUserAddressDialog, changeUserEmailDialog, getUserAddressDialog, getUserEmailDialog, getUserDetailsDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!QnAMaker) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.QnAMaker = QnAMaker;

        if (!changeUserAddressDialog) throw new Error('[MainDialog]: Missing parameter \'changeUserAddressDialog\' is required');
        if (!changeUserEmailDialog) throw new Error('[MainDialog]: Missing parameter \'changeUserEmailDialog\' is required');
        if (!getUserAddressDialog) throw new Error('[MainDialog]: Missing parameter \'getUserAddressDialog\' is required');
        if (!getUserEmailDialog) throw new Error('[MainDialog]: Missing parameter \'getuserEmailDialog\' is required');
        if (!getUserDetailsDialog) throw new Error('[MainDialog]: Missing parameter \'getUserDetailsDialog\' is required');

        // Define the main dialog and its related components.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(changeUserAddressDialog)
            .addDialog(changeUserEmailDialog)
            .addDialog(getUserAddressDialog)
            .addDialog(getUserEmailDialog)
            .addDialog(getUserDetailsDialog)
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actionStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured && !this.QnAMaker.isConfigured) {
            const messageText = 'NOTE: LUIS and QnA is not configured. To enable all capabilities, add `AppId`, `APIKey` and `HostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'What can I help you with today?\n\nSay something like "I want the details of user having userid 1"';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the required Data.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actionStep(stepContext) {
        const changeAddressDetails = {};

        if (!this.luisRecognizer.isConfigured && !this.QnAMaker.isConfigured) {
            // If LUIS and QnA is not configured, we just run the changeUserAddressDialog path.
            return await stepContext.beginDialog('changeUserAddressDialog', changeAddressDetails);
        }

        // Call LUIS and gather any potential details.
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'ChangeAddress': {
            // Extract the values for entities from the LUIS result.
            const userId = this.luisRecognizer.getUserId(luisResult);
            const address = this.luisRecognizer.getAddress(luisResult);
            console.log(JSON.stringify(luisResult));
            // Initialize ChangeAddressDetails with any entities we may have found in the response.
            changeAddressDetails.userId = userId;
            changeAddressDetails.newAddress = address;
            console.log('LUIS extracted these booking details:', JSON.stringify(changeAddressDetails));

            // Run the changeUserAddressDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('changeUserAddressDialog', changeAddressDetails);
        }

        case 'ChangeEmail': {
            const changeEmailDetails = {};
            // Extract the values for entities from the LUIS result.
            const userId = this.luisRecognizer.getUserId(luisResult);
            const email = this.luisRecognizer.getEmail(luisResult);

            // Initialize ChangeEmailDetails with any entities we may have found in the response.
            changeEmailDetails.userId = userId;
            changeEmailDetails.newEmail = email;
            console.log('LUIS extracted these booking details:', JSON.stringify(changeEmailDetails));

            // Run the changeUserEmailDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('changeUserEmailDialog', changeEmailDetails);
        }

        case 'GetUserDetails': {
            const getDetails = {};
            // Extract the values for entities from the LUIS result.
            const userId = this.luisRecognizer.getUserId(luisResult);
            const email = this.luisRecognizer.getEmail(luisResult);

            // Initialize ChangeDetails with any entities we may have found in the response.
            getDetails.userId = userId;
            getDetails.email = email;
            console.log('LUIS extracted these booking details:', JSON.stringify(getDetails));

            // Run the getUserDetailsDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('getUserDetailsDialog', getDetails);
        }

        case 'GetAddress': {
            const getAddressDetails = {};
            // Extract the values for entities from the LUIS result.
            console.log(JSON.stringify(luisResult));
            const userId = this.luisRecognizer.getUserId(luisResult);

            // Initialize getAddressDetails with any entities we may have found in the response.
            getAddressDetails.userId = userId;
            console.log('LUIS extracted these booking details:', JSON.stringify(getAddressDetails));

            // Run the getUserAddressDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('getUserAddressDialog', getAddressDetails);
        }

        case 'GetEmail': {
            const getEmailDetails = {};
            // Extract the values for entities from the LUIS result.
            const userId = this.luisRecognizer.getUserId(luisResult);

            // Initialize getEmailDetails with any entities we may have found in the response.
            getEmailDetails.userId = userId;
            console.log('LUIS extracted these booking details:', JSON.stringify(getEmailDetails));

            // Run the getuserEmailDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('getUserEmailDialog', getEmailDetails);
        }

        default: {
            // Catch all for unhandled intents and pass it to the QnA.
            // if the intent is not identified then the given input is for QnA or the input has no meaning
            const qnaResults = await this.QnAMaker.executeQnAQuery(stepContext.context);

            // if no answer is received from QnA Maker, send this message to the user.
            let MessageText = 'Sorry, I didn\'t get that. Please try asking in a different way';

            // If an answer was received from QnA Maker, send the answer back to the user.
            if (qnaResults[0]) {
                MessageText = qnaResults[0].answer;
            }

            await stepContext.context.sendActivity(MessageText, MessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the interaction with a simple message.
     */
    async finalStep(stepContext) {
        // If the child dialog (eg. "changeAddressDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;

            // If the result was received successfully, tell the user.
            const msg = result.message;
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        // Restart the main dialog with a different message the second time around.
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainDialog = MainDialog;
