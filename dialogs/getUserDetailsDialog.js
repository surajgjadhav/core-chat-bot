
const { MessageFactory } = require('botbuilder');
const { ConfirmPrompt, NumberPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const fetch = require('node-fetch');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

class GetUserDetailsDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'GetUserDetailsDialog');
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new NumberPrompt(NUMBER_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.userIdStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If User ID has not been provided, prompt for one.
     * @param {*} stepContext
     */
    async userIdStep(stepContext) {
        const getDetails = stepContext.options;

        if (!getDetails.userId) {
            const messageText = 'What is the User ID?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(NUMBER_PROMPT, { prompt: msg });
        }
        return await stepContext.next(getDetails.userId);
    }

    /**
     * Confirm the information the user has provided.
     * @param {*} stepContext
     */
    async confirmStep(stepContext) {
        const getDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        getDetails.userId = stepContext.result;
        const messageText = `Please confirm, You want to get the details of user id ${ getDetails.userId }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Call the get user details service API and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const getDetails = stepContext.options;
            const userId = getDetails.userId;
            const url = `http://127.0.0.1:8080/details/${ userId }`;
            try {
                const response = await fetch(url);
                const statusCode = response.status;
                const json = await response.json();
                console.log(json);
                if (statusCode === 302) {
                    getDetails.message = `The details of given user Id ${ userId } are:\n\n Name : ${ json.userName }\n\nAddress : ${ json.address }\n\nEmail : ${ json.email }\n\nDate of Birth : ${ json.birthDate }`;
                } else {
                    getDetails.message = json.message;
                }
            } catch (error) {
                console.log(error);
            }
            return await stepContext.endDialog(getDetails);
        }
        return await stepContext.endDialog();
    }
}

module.exports.GetUserDetailsDialog = GetUserDetailsDialog;
