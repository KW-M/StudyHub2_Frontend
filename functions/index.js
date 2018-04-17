// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const firebaseAdmin = require('firebase-admin');

const algoliasearch = require('algoliasearch');
const searchClient = algoliasearch(functions.config().algolia.app_id, functions.config().algolia.api_key);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
var serviceAccount = require("path/to/serviceAccountKey.json");
firebaseAdmin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-test-156302.firebaseio.com"
});
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

// Updates the search index when new blog entries are created or updated.
exports.searchIndexEntry = functions.firestore.document('posts/{postId}').onWrite((change, context) => {
    const index = client.initIndex(ALGOLIA_POSTS_INDEX_NAME);
    // Get an object with the current document value. If the document does not exist (Is null), it has been deleted.
    const document = change.after.exists ? change.after.data() : null;
    // Get an object with the previous document value (for update or delete)
    const oldDocument = change.before.data();
    if (document !== null) {
        addOrUpdateSearchIndexRecord(index, document, change.after.id)
    } else if (oldDocument) {
        deleteSearchIndexRecord(index, change.before.id)
    }
});
// Starts a search query whenever a query is requested (by adding one to the `/search/queries`
// element. Search results are then written under `/search/results`.

function addOrUpdateSearchIndexRecord(index, post, postId) {
    post.id = postId
    // Add or update object
    index.saveObject(post, function (err, content) {
        if (err) {
            throw err;
        }
        console.log('Firebase<>Algolia object saved', post);
    });
}

function deleteSearchIndexRecord(index, postId) {
    // Remove the object from Algolia
    index.deleteObject(postId, function (err, content) {
        if (err) {
            throw err;
        }
        console.log('Firebase<>Algolia object deleted', objectID);
    });
}

function computeRanking(post) {

}