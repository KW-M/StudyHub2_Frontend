// const admin = require('./node_modules/firebase-admin');
// const serviceAccount = require("./private_stuff/serviceAccountKey.json");

// const data = require("./allPosts.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://studyhub-2.firebaseio.com"
// });
// var count = 0
// function uploadPost() {
//     var key = data[count]
//     delete key.likes
//     delete key.ranking
//     key.updateDate = new Date(key.updateDate).getTime()
//     key.creationDate = new Date(key.creationDate).getTime()
//     console.log(key)
//     admin.firestore()
//         .collection('posts').add(key)
//         .then((res) => {
//             console.log("Document successfully written!");
//         })
//         .catch((error) => {
//             console.error("Error writing document: ", error);
//         });
//     count++
//     setTimeout(uploadPost, 1000)
// }
// uploadPost()