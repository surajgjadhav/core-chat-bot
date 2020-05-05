
const { MessageFactory } = require('botbuilder');
const { ChoiceFactory, ChoicePrompt, ConfirmPrompt, NumberPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const fetch = require('node-fetch');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const EMAIL_PROMPT = 'EMAIL_PROMPT';

class GetUserDetailsDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'GetUserDetailsDialog');
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new NumberPrompt(NUMBER_PROMPT))
            .addDialog(new ChoicePrompt(CHOICE_PROMPT))
            .addDialog(new TextPrompt(EMAIL_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.userIdOrEmailStep.bind(this),
                this.actionStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If User ID or Email has not been provided, prompt for choice to select one that user know.
     * @param {*} stepContext
     */
    async userIdOrEmailStep(stepContext) {
        const getDetails = stepContext.options;

        if (!getDetails.userId && !getDetails.email) {
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: 'Please select what do you know about user currently ?',
                choices: ChoiceFactory.toChoices(['User ID', 'Email'])
            });
        } else if (getDetails.userId) {
            return await stepContext.next(getDetails.userId);
        } else {
            return await stepContext.next(getDetails.email);
        }
    }

    /**
     * If user choose User ID or Email prompt for one
     * @param {*} stepContext
     */
    async actionStep(stepContext) {
        const getDetails = stepContext.options;
        getDetails.choice = stepContext.result.value;

        switch (getDetails.choice) {
        case 'User ID' : {
            const messageText = 'What is the User ID of that User?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(NUMBER_PROMPT, { prompt: msg });
        }

        case 'Email' : {
            const messageText = 'What is the Email of that User?';
            const msg = MessageFactory.text(messageText, messageText);
            return await stepContext.prompt(EMAIL_PROMPT, { prompt: msg });
        }
        default : {
            if (getDetails.userId) {
                return await stepContext.next(getDetails.userId);
            } else {
                return await stepContext.next(getDetails.email);
            }
        }
        }
    }

    /**
     * Confirm the information the user has provided.
     * @param {*} stepContext
     */
    async confirmStep(stepContext) {
        const getDetails = stepContext.options;
        let messageText;
        // Capture the response to the previous step's prompt
        if (getDetails.choice === 'User ID' || getDetails.userId) {
            getDetails.userId = stepContext.result;
            messageText = `Please confirm, You want to get the details of user ID ${ getDetails.userId }. Is this correct?`;
        } else if (getDetails.choice === 'Email' || getDetails.email) {
            getDetails.email = stepContext.result;
            messageText = `Please confirm, You want to get the details of user having email ${ getDetails.email }. Is this correct?`;
        }
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
            const email = getDetails.email;
            let url;
            if (userId) {
                url = `http://127.0.0.1:8080/details/userId/${ userId }`;
            } else {
                url = `http://127.0.0.1:8080/details/email/${ email }`;
            }

            try {
                const response = await fetch(url);
                const statusCode = response.status;
                const json = await response.json();
                console.log(json);
                if (statusCode === 302) {
                    getDetails.message = `The details of given user are:\n\nUser ID : ${ json.userId }  \n\nName : ${ json.userName }\n\nAddress : ${ json.address }\n\nEmail : ${ json.email }\n\nDate of Birth : ${ json.birthDate }`;
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
