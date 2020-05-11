
const { DialogBot } = require('./dialogBot');

class WelcomeAndDialogBot extends DialogBot {
    constructor(conversationState, userState, dialog) {
        super(conversationState, userState, dialog);

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Hey there! Good to see you here.');
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onEvent(async (context, next) => {
            if (context.activity.name === 'webchat/join') {
                await context.sendActivity('Hey there! Good to see you here.');
                await dialog.run(context, conversationState.createProperty('DialogState'));
            }
            await next();
        });
    }
}

module.exports.WelcomeAndDialogBot = WelcomeAndDialogBot;
