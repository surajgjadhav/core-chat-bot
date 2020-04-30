
const { MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, NumberPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const fetch = require('node-fetch');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

class ChangeUserEmailDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'ChangeUserEmailDialog');
        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new NumberPrompt(NUMBER_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.userIdStep.bind(this),
                this.newEmailStep.bind(this),
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
        const chnageEmailDetails = stepContext.options;

        if (!chnageEmailDetails.userId) {
            const messageText = 'What is the User ID?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(NUMBER_PROMPT, { prompt: msg });
        }
        return await stepContext.next(chnageEmailDetails.userId);
    }

    /**
     * If new Email has not been provided, prompt for one.
     * @param {*} stepContext
     */
    async newEmailStep(stepContext) {
        const chnageEmailDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        chnageEmailDetails.userId = stepContext.result;
        if (!chnageEmailDetails.newEmail) {
            const messageText = 'What is the new Email?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(chnageEmailDetails.newEmail);
    }

    /**
     * Confirm the information the user has provided.
     * @param {*} stepContext
     */
    async confirmStep(stepContext) {
        const chnageEmailDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        chnageEmailDetails.newEmail = stepContext.result;
        const messageText = `Please confirm, You want to change the email of user id ${ chnageEmailDetails.userId } to: ${ chnageEmailDetails.newEmail }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Call the change email service API and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const chnageEmailDetails = stepContext.options;
            const userId = chnageEmailDetails.userId;
            const email = chnageEmailDetails.newEmail;
            const url = `http://127.0.0.1:8080/email/${ userId }?Email=${ email }`;
            try {
                const response = await fetch(url, { method: 'PUT' });
                const statusCode = response.status;
                const json = await response.json();
                console.log(json);
                if (statusCode === 200) {
                    chnageEmailDetails.message = `The email of given user Id ${ userId } changed to ${ email } successfully.`;
                } else {
                    chnageEmailDetails.message = json.message;
                }
            } catch (error) {
                console.log(error);
            }
            return await stepContext.endDialog(chnageEmailDetails);
        }
        return await stepContext.endDialog();
    }
}

module.exports.ChangeUserEmailDialog = ChangeUserEmailDialog;
