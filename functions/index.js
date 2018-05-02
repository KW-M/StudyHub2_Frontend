// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const firebaseAdmin = require('firebase-admin');
// Google APIs client library used to call Google Drive
var { google } = require('googleapis');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
var serviceAccount = require("./private_stuff/serviceAccountKey.json");
var testServiceAccount = require("./private_stuff/testServiceAccount.json");
var algoliaApiKey = require("./private_stuff/algoliaAdminAPIKey.json");
// firebaseAdmin.initializeApp({
//     credential: firebaseAdmin.credential.cert(serviceAccount),
//     databaseURL: "https://studyhub-2.firebaseio.com"
// });
// let jwtClient = new googleApis.auth.JWT();
// jwtClient.fromJSON(testServiceAccount);
// jwtAccess.scopes = 'https://www.googleapis.com/auth/cloud-platform';
// // Create an oAuth2 client to authorize the API call
// const client = new google.auth.OAuth2(
//     keys.web.client_id,
//     keys.web.client_secret,
//     keys.web.redirect_uris[0]
// )

//authenticate request


function getDrivePreview() {
    const jwtClient = new google.auth.JWT(serviceAccount.client_email, null, serviceAccount.private_key, ['https://www.googleapis.com/auth/drive'], null);
    jwtClient.authorize((authErr) => {
        if (authErr) {
            console.log(authErr);
            return;
        }
        // Make an authorized requests
        // List Drive files.
        var drive = google.drive({
            version: 'v3',
            auth: jwtClient,
        });
        drive.files.list({}, (listErr, resp) => {
            if (listErr) {
                console.log(listErr);
                return;
            }
            console.log(resp)
            resp.data.files.forEach(element => {
                console.log(element)
            });
        })
        // drive.files.get({ fileId: '103yR8k461vPZ1WrqV_eCOffccchFu7OG' }, (listErr, resp) => {
        //     if (listErr) {
        //         console.log(listErr);
        //         return;
        //     }
        //     console.log(resp)
        // });
        // drive.files.create({
        //     resource: {
        //         'name': 'StudyHub Uploaded Files Storage',
        //         'mimeType': 'application/vnd.google-apps.folder'
        //     },
        // }, function (err, file) {
        //     if (err) {
        //         // Handle error
        //         console.error(err);
        //     } else {
        //         console.log('Folder Id: ', file);
        //     }
        // });
        // drive.permissions.create({
        //     resource: {
        //         // 'type': 'user',
        //         // 'role': 'writer',
        //         // 'emailAddress': 'worcester-moorek2018test@york.org'
        //         // domain: 'york.org',
        //         // type: 'domain',
        //         // role: 'reader',
        //         // sendNotificationEmail: false,
        //         // allowFileDiscovery: true,
        //         // domain: 'york.org',
        //     },
        //     fileId: '1EVWKoKGzFfSwZutCPT0k2MwTW7QJ4FCF',
        // }, (listErr, resp) => {
        //     if (listErr) {
        //         console.log(listErr);
        //         return;
        //     }
        //     console.log(resp)
        // })
    })
}
getDrivePreview()

// functions.https.onCall((data, context) => {
//     // Message text passed from the client.
//     const text = data.text;
//     // Authentication / user information is automatically added to the request.
//     const uid = context.auth.uid;
//     const name = context.auth.token.name || null;
//     const picture = context.auth.token.picture || null;
//     const email = context.auth.token.email || null;
// });


// const algoliasearch = require('algoliasearch');
// const searchClient = algoliasearch(algoliaApiKey.app_id, algoliaApiKey.api_key);
// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
// exports.addIndex = functions.https.onCall((req, res) => {
//     // Grab the text parameter.
//     const original = req.query.text;
//     // Push the new message into the Realtime Database using the Firebase Admin SDK.
//     return firebaseAdmin.database().ref('/messages').push({ original: original }).then((snapshot) => {
//         // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//         return res.redirect(303, snapshot.ref.toString());
//     });
// });

// Name fo the algolia index for Blog posts content.
const ALGOLIA_POSTS_INDEX_NAME = 'posts';

// // Updates the search index when new blog entries are created or updated.
// exports.searchIndexEntry = functions.firestore.document('posts/{postId}').onWrite((change, context) => {
//     const index = client.initIndex(ALGOLIA_POSTS_INDEX_NAME);
//     // Get an object with the current document value. If the document does not exist (Is null), it has been deleted.
//     const document = change.after.exists ? change.after.data() : null;
//     // Get an object with the previous document value (for update or delete)
//     const oldDocument = change.before.data();
//     console.log('document', document)
//     console.log('olddocument', oldDocument)
//     console.log('index', index)
//     if (document !== null) {
//         addOrUpdateSearchIndexRecord(index, document, change.after.id)
//     } else if (oldDocument) {
//         deleteSearchIndexRecord(index, change.before.id)
//     }
// });
// // Starts a search query whenever a query is requested (by adding one to the `/search/queries`
// // element. Search results are then written under `/search/results`.

// function addOrUpdateSearchIndexRecord(index, post, postId) {
//     post.id = postId
//     // Add or update object
//     index.saveObject(post, (err, content) => {
//         if (err) {
//             throw err;
//         }
//         console.log('Firebase<>Algolia object saved', post);
//     });
// }

// function deleteSearchIndexRecord(index, postId) {
//     // Remove the object from Algolia
//     index.deleteObject(postId, (err, content) => {
//         if (err) {
//             throw err;
//         }
//         console.log('Firebase<>Algolia object deleted', objectID);
//     });
// }

// function computeRanking(post) {

// }