
const { LuisRecognizer } = require('botbuilder-ai');

class LuisConfig {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            const recognizerOptions = {
                apiVersion: 'v3'
            };

            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    /**
     * Returns an userId from the LUIS result
     * @param {*} result
     */
    getUserId(result) {
        const userId = result.entities.number;
        console.log(userId);// for testing ourpose
        return userId;
    }

    /**
     * Returns an Email from the LUIS result
     * @param {*} result
     */
    getEmail(result) {
        const email = result.entities.email;
        let newEmail;
        if (!email || !email[0]) {
            newEmail = undefined;
        } else {
            newEmail = email[0];
        }
        console.log(newEmail);// for testing ourpose
        return newEmail;
    }

    /**
     * Returns an Address from the LUIS result
     * @param {*} result
     */
    getAddress(result) {
        const address = result.entities.geographyV2;
        let newAddress;
        if (!address || !address[0].location) {
            newAddress = undefined;
        } else {
            newAddress = address[0].location;
        }
        console.log(newAddress);// for testing ourpose
        return newAddress;
    }
}

module.exports.LuisConfig = LuisConfig;
