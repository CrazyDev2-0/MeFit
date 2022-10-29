
const firebase_admin = require("firebase-admin");
const firebase_service_account = require("./firebase_config.json");

class FirebaseClient {
    static instance = null;

    /**
     * 
     * @returns {FirebaseClient}
     */
    static getInstance() {
        if (FirebaseClient.instance == null) {
            FirebaseClient.instance = new FirebaseClient();
            firebase_admin.initializeApp({
                credential: firebase_admin.credential.cert(firebase_service_account),
            })
        }
        return FirebaseClient.instance;
    }

    async sendNotifications(title, body, tokens, data) {
        let payload = {
            "notification": {
                "body": body,
                "title": title
            },
            "tokens": tokens
        }
        if (data != null && data != undefined) {
            payload["data"] = data;
        }
        firebase_admin.messaging().sendMulticast(payload);
    }
}

module.exports = FirebaseClient;