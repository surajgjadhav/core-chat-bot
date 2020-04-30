
const { QnAMaker } = require('botbuilder-ai');

class QnAConfig {
    constructor(config) {
        const QnAIsConfigured = config && config.knowledgeBaseId && config.endpointKey && config.host;
        if (QnAIsConfigured) {
            try {
                this.qnaMaker = new QnAMaker(config);
            } catch (err) {
                console.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
            }
        }
    }

    get isConfigured() {
        return (this.qnaMaker !== undefined);
    }

    /**
     * If an answer was received from QnA Maker, Returns the answer.
     * @param {TurnContext} context
     */
    async executeQnAQuery(context) {
        return await this.qnaMaker.getAnswers(context);
    }
}

module.exports.QnAConfig = QnAConfig;
