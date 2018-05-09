// https://firebase.google.com/docs/functions/write-firebase-functions
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const firebaseAdmin = require('firebase-admin');
// A JSON file with the Algolia API key;
var algoliaApiKey = require("./private_stuff/algoliaAdminAPIKey.json");
const algoliasearch = require('algoliasearch');
const searchClient = algoliasearch(algoliaApiKey.app_id, algoliaApiKey.api_key);
// A JSON file with the firebase admin service account keys;
var serviceAccount = require("./private_stuff/serviceAccountKey.json");
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "https://studyhub-2.firebaseio.com"
});

// Updates the search index when new posts are created or updated.
exports.searchIndexEntry = functions.firestore.document('posts/{postId}').onWrite((change, context) => {
    const index = searchClient.initIndex('Posts');
    // Get an object with the current document value. If the document does not exist (Is null), it has been deleted.
    const newDocument = change.after.exists ? change.after.data() : null;
    // Get an object with the previous document value (for update or delete)
    const oldDocument = change.before.exists ? change.before.data() : null;
    console.log('document', { newDoc: newDocument, oldDoc: oldDocument, change: change, index: index })
    if (newDocument !== null) {
        addOrUpdateSearchIndexRecord(index, newDocument, change.after.id)
    } else if (oldDocument) {
        deleteSearchIndexRecord(index, change.before.id)
    }
    return 'done'
});

function addOrUpdateSearchIndexRecord(index, post, postId) {
    post.id = postId
    post.creationDate = new Date(hit.creationDate).getTime()
    post.updateDate = new Date(hit.updateDate).getTime()
    post.ranking = computeRanking(post)
    // Add or update object
    index.saveObject(post, (err, content) => {
        if (err) throw err;
        console.log('Firebase->Algolia post saved', post);
    });
}

function deleteSearchIndexRecord(index, postId) {
    // Remove the object from Algolia
    index.deleteObject(postId, (err, content) => {
        if (err) {
            throw err;
        }
        console.log('Firebase->Algolia post deleted', postId);
    });
}

function computeRanking(post) {
    //console.warn("ranking function")
    return post.title.length;
}