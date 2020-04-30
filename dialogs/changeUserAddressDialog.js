
const { MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, NumberPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const fetch = require('node-fetch');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

class ChangeUserAddressDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'ChangeUserAddressDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new NumberPrompt(NUMBER_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.userIdStep.bind(this),
                this.newAddressStep.bind(this),
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
        const chnageAddressDetails = stepContext.options;

        if (!chnageAddressDetails.userId) {
            const messageText = 'What is the User ID?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(NUMBER_PROMPT, { prompt: msg });
        }
        return await stepContext.next(chnageAddressDetails.userId);
    }

    /**
     * If new Address has not been provided, prompt for one.
     * @param {*} stepContext
     */
    async newAddressStep(stepContext) {
        const chnageAddressDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        chnageAddressDetails.userId = stepContext.result;
        if (!chnageAddressDetails.newAddress) {
            const messageText = 'What is the new address?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(chnageAddressDetails.newAddress);
    }

    /**
     * Confirm the information the user has provided.
     * @param {*} stepContext
     */
    async confirmStep(stepContext) {
        const chnageAddressDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        chnageAddressDetails.newAddress = stepContext.result;
        const messageText = `Please confirm, You want to change the address of user id ${ chnageAddressDetails.userId } to: ${ chnageAddressDetails.newAddress }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Call the change address service API and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const chnageAddressDetails = stepContext.options;
            const userId = chnageAddressDetails.userId;
            const address = chnageAddressDetails.newAddress;
            const url = `http://127.0.0.1:8080/address/${ userId }?Address=${ address }`;
            try {
                const response = await fetch(url, { method: 'PUT' });
                const statusCode = response.status;
                const json = await response.json();
                console.log(json);
                if (statusCode === 200) {
                    chnageAddressDetails.message = `The address of given user Id ${ userId } changed to ${ address } successfully.`;
                } else {
                    chnageAddressDetails.message = json.message;
                }
            } catch (error) {
                console.log(error);
            }
            return await stepContext.endDialog(chnageAddressDetails);
        }
        return await stepContext.endDialog();
    }
}

module.exports.ChangeUserAddressDialog = ChangeUserAddressDialog;
