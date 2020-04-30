
const { MessageFactory } = require('botbuilder');
const { ConfirmPrompt, NumberPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const fetch = require('node-fetch');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

class GetUserAddressDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'GetUserAddressDialog');
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
        const getAddressDetails = stepContext.options;

        if (!getAddressDetails.userId) {
            const messageText = 'What is the User ID?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(NUMBER_PROMPT, { prompt: msg });
        }
        return await stepContext.next(getAddressDetails.userId);
    }

    /**
     * Confirm the information the user has provided.
     * @param {*} stepContext
     */
    async confirmStep(stepContext) {
        const getAddressDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        getAddressDetails.userId = stepContext.result;
        const messageText = `Please confirm, You want to get the address details of user id ${ getAddressDetails.userId }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Call the get address service API and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const getAddressDetails = stepContext.options;
            const userId = getAddressDetails.userId;
            const url = `http://127.0.0.1:8080/address/${ userId }`;
            try {
                const response = await fetch(url);
                const statusCode = response.status;
                const json = await response.json();
                console.log(json);
                if (statusCode === 302) {
                    getAddressDetails.message = `The address of given userId ${ userId } is ${ json.message }`;
                } else {
                    getAddressDetails.message = json.message;
                }
            } catch (error) {
                console.log(error);
            }
            return await stepContext.endDialog(getAddressDetails);
        }
        return await stepContext.endDialog();
    }
}

module.exports.GetUserAddressDialog = GetUserAddressDialog;
