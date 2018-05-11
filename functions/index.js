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

exports.reRankPosts = functions.https.onCall((data, context) => {
    if (context.auth.token.email.indexOf("@york.org") !== -1) {
        firebaseAdmin.database().ref('/startupInfo/lastReRankDate').once('value').then((snapshot) => {
            if (snapshot.val() && (new Date().getTime() - snapshot.val()) > 86000000) {
                var tempList = []
                firebaseAdmin.firestore().collection("posts").where("flagged", "==", false).get().then((querySnapshot) => {
                    firebaseAdmin.database().ref('/startupInfo/lastReRankDate').set(new Date().getTime());
                    querySnapshot.forEach((doc) => {
                        tempList.push({
                            objectID: doc.id,
                            ranking: computeRanking(doc.data())
                        })
                    });
                    searchClient.initIndex('Posts').partialUpdateObjects(tempList, false, (result) => {
                        console.log("reRanking Posts Completed", result)
                    })
                    return null
                }).catch((error) => {
                    console.warn("Error listing firestore documents: ", error);
                });
            }
            return null
        }).catch((error) => {
            console.warn("Error retrieving lastReRankDate: ", error);
        })
    }
});

function addOrUpdateSearchIndexRecord(index, post, postId) {
    post.objectID = postId
    post.creationDate = new Date(post.creationDate).getTime()
    post.updateDate = new Date(post.updateDate).getTime()
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
    //see: https://www.desmos.com/calculator/m8ace3kaeb
    const daysSinceBeginingOfYear = (date) => {
        const start = new Date(date.getFullYear(), 0, 0).getTime();
        return Math.floor((date.getTime() - start) / 86400000);
    }
    const likesComponent = (likeCount) => {
        return 2 * Math.pow(likeCount, 1.5);
    }
    const recencyComponent = (date) => {
        const days = date.getTime() / 86400000
        return 50 / (days + 1);
    }
    const recurringComponent = (date) => {
        //based on how recently updated the post was realative to the start of the year.
        const dayDifference = Math.abs(daysSinceBeginingOfYear(date) - daysSinceBeginingOfYear(new Date()))
        return 0.3 + Math.pow(1.5, (0.25 * dayDifference) + 9)
    }
    const updateDate = new Date(post.updateDate)
    return likesComponent(post.likeUsers.length) + recencyComponent(updateDate) + recurringComponent(updateDate);
}