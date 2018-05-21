import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFirestore } from 'angularfire2/firestore';
import { Subject } from "rxjs";
import { first, map } from 'rxjs/operators';
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import '@firebase/functions'


@Injectable()
export class StudyhubServerApisService {
  serverURLBase: string = 'https://studyhub-2.firebaseio.com/';
  constructor(private http: HttpClient,
    private sanitizer: DomSanitizer,
    private FireDB: AngularFireDatabase,
    private FireAuth: AngularFireAuth,
    private FireStore: AngularFirestore) {
    FireStore.firestore.app.firestore().settings({ timestampsInSnapshots: true });
  }

  getUserFromServer(email) {
    return new Promise((resolve, reject) => {
      email = this.removeFirebaseKeyIllegalChars(email)
      console.log(email);
      this.FireDB.object('users/' + email).valueChanges().pipe(first()).toPromise().then((userObj: any) => {
        if (userObj === null || !userObj.uid) {
          userObj = userObj || {}
          let newUserObj = {
            'name': this.FireAuth.auth.currentUser.displayName,
            'uid': this.FireAuth.auth.currentUser.uid,
            'moderator': userObj.moderator === undefined ? false : userObj.moderator,
            'favorites': userObj.favorites === undefined ? {} : userObj.favorites,
            'bookmarks': userObj.bookmarks === undefined ? {} : userObj.bookmarks,
            'visitCount': userObj.visitCount === undefined ? 1 : userObj.visitCount,
            'contributionCount': userObj.contributionCount === undefined ? 0 : userObj.contributionCount
          }
          console.log(newUserObj);
          this.FireDB.object('users/' + email).set(newUserObj).then((dbResp: any) => {
            resolve(newUserObj)
          }).catch(console.log)//reject)
        } else {
          resolve(userObj)
          this.FireDB.object('users/' + email + '/visitCount').query.ref.transaction(visits => { return visits ? visits + 1 : 1; }).then(console.log).catch(console.warn)
        }
      })
    })
  }

  getStartupInfo() {
    return this.FireDB.object('startupInfo').valueChanges().pipe(first()).toPromise()
  }

  getAllPosts(sortBy) {
    return this.FireStore.collection('posts')
  }

  getPosts(postFilters, sortBy, lastPost, pageSize) {
    console.log({
      filters: postFilters,
      sortingOrder: sortBy,
      lastPost: lastPost
    })
    return this.FireStore.collection("posts", (ref) => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      if (!postFilters.userEmail) query = query.where("flagged", "==", postFilters.flagged || false)
      if (postFilters.className) {
        query = query.where("classes." + postFilters.className, "==", true).orderBy("updateDate", "desc");
      } else {
        if (postFilters.userEmail) {
          query = query.where("creator.email", "==", postFilters.userEmail).orderBy("updateDate", "desc");
        } else {
          query = query.orderBy(sortBy || "updateDate", "desc")
        }
      }
      if (lastPost) { query = query.startAfter(lastPost) }
      return query.limit(pageSize || 4);
    }).snapshotChanges().pipe(map(actions => {
      return actions.map((changeSnapshot) => {
        const data: any = changeSnapshot.payload.doc.data();
        data.id = changeSnapshot.payload.doc.id;
        data.updateDate = data.updateDate.toDate();
        data.creationDate = data.creationDate.toDate();
        console.log(data, changeSnapshot);
        return data
      })
    }))
  }

  getPostChangeFeed(postFilters, sortBy, lastPost, pageSize) {
    console.log({
      filters: postFilters,
      sortingOrder: sortBy,
      lastPost: lastPost
    })
    return this.FireStore.collection("posts", (ref) => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      query = query.orderBy("updateDate", "desc")
      query = query.startAfter(new Date())
      return query.limit(2);
    }).snapshotChanges().pipe(map(actions => {
      return actions.map((changeSnapshot) => {
        const data: any = changeSnapshot.payload.doc.data();
        data.id = changeSnapshot.payload.doc.id;
        data.updateDate = data.updateDate.toDate();
        data.creationDate = data.creationDate.toDate();
        console.log(data, changeSnapshot);
        return data
      });
    }))
  }

  getUserBookmarks(email) {
    return new Promise((resolve, reject) => {
      email = this.removeFirebaseKeyIllegalChars(email)
      this.FireDB.object('users/' + email + '/bookmarks')
    })
  }

  getSearchPosts(postFilters, startingId) {
    const params = new HttpParams({
      fromObject: {
        filters: JSON.stringify(postFilters),
        idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
      }
    });
    return this.http.get(this.serverURLBase + "/search", { 'params': params }).toPromise();
  }

  getPostsFromIds(postIdArray) {
    var requestArray = []
    postIdArray.forEach(postId => {
      requestArray.push(this.FireStore.collection('posts').doc(postId).snapshotChanges().pipe(map((changeSnapshot) => {
        const data: any = changeSnapshot.payload.data();
        if (data) {
          data.id = changeSnapshot.payload.id;
          data.updateDate = data.updateDate.toDate();
          data.creationDate = data.creationDate.toDate();
          console.log(data, changeSnapshot);
        }
        return data || {}
      })).pipe(first()).toPromise())
    });
    return Promise.all(requestArray)
  }

  getClassAndGroupList() {
    return new Promise((resolve, reject) => {
      var classGroupObj = { classes: {}, formattedClasses: [{ category: 'English' }, { category: 'Math' }], groups: {} };
      this.http.get(this.serverURLBase + "/yorkClasses.json").toPromise().then((classes) => {
        classGroupObj.classes = classes;
        // generate nested tree: [{category,color,classes:[className]}]
        for (var className in classes) {
          var classObj = classes[className]
          var categoryArrayIndex = function () {
            for (let categoryPos = 0; categoryPos < classGroupObj.formattedClasses.length; categoryPos++) {
              if (classGroupObj.formattedClasses[categoryPos].category === classObj.category) return categoryPos
            }
            return classGroupObj.formattedClasses.push({ category: classObj.category }) - 1
          }()
          if (!classGroupObj.formattedClasses[categoryArrayIndex]['classes']) classGroupObj.formattedClasses[categoryArrayIndex] = { category: classObj.category, color: classObj.color, classes: [] } as any;
          classGroupObj.formattedClasses[categoryArrayIndex]['classes'].push({ name: className });
        }
        return this.http.get(this.serverURLBase + "/yorkGroups.json").toPromise()
      }).then((groups) => {
        classGroupObj['groups'] = groups;
        resolve(classGroupObj)
      }).catch(reject)
    })
  }

  submitPost(postObj) { // send a new or updated post object to the server
    var convertedPost: any = {}
    convertedPost = Object.assign({}, postObj);
    delete convertedPost.id;
    convertedPost.updateDate = firebase.firestore.FieldValue.serverTimestamp()
    console.log(convertedPost);
    if (postObj.id) {
      return this.FireStore.collection('posts').doc(postObj.id).set(convertedPost) as any;
    } else {
      convertedPost.creationDate = firebase.firestore.FieldValue.serverTimestamp()
      return this.FireStore.collection('posts').add(convertedPost)
    }
  }

  updateLikes(postId, userEmail) {
    return this.FireStore.firestore.runTransaction((transaction) => {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(this.FireStore.collection("posts").doc(postId).ref).then((post) => {
        if (!post.exists) {
          throw "Document does not exist!";
        } else {
          var likeUsers = post.data().likeUsers
          console.log(likeUsers)
          var index = likeUsers.indexOf(userEmail)
          if (index === -1) {
            likeUsers.push(userEmail)
          } else {
            likeUsers.splice(index, 1)
          }
        }
        transaction.update(this.FireStore.collection("posts").doc(postId).ref, { likeUsers: likeUsers });
      });
    })
  }

  viewPost(postId) {
    return this.FireStore.firestore.runTransaction((transaction) => {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(this.FireStore.collection("posts").doc(postId).ref).then((post) => {
        if (!post.exists) {
          throw "Document does not exist!";
        }
        transaction.update(this.FireStore.collection("posts").doc(postId).ref, { viewCount: post.data().viewCount + 1 || 0 });
      });
    }).then(() => {
      return this.FireDB.object('users/' + this.removeFirebaseKeyIllegalChars(this.FireAuth.auth.currentUser.email) + '/recentlyViewed').query.ref.transaction(recents => {
        recents = recents || []
        var indexOf = recents.indexOf(postId)
        if (indexOf !== -1) recents.splice(indexOf, 1)
        recents.splice(0, 0, postId)
        if (recents.length > 5) { recents.pop(1) }
        return recents;
      })
    })
  }

  getQuizletUsername(name) {
    return this.FireDB.object('quizletUsers/' + name + "/username").valueChanges().pipe(first()).toPromise()
  }

  setQuizletUsername(userName) {
    return this.FireDB.object('quizletUsers/' + this.removeFirebaseKeyIllegalChars(this.FireAuth.auth.currentUser.email) + "/username").set(userName)
  }

  setFavorites(favoritesObj) {
    return this.FireDB.object('users/' + this.removeFirebaseKeyIllegalChars(this.FireAuth.auth.currentUser.email) + "/favorites").set(favoritesObj)
  }

  addGroup(groupName) {
    return this.FireDB.object('yorkGroups/' + groupName).set({ creator: this.FireAuth.auth.currentUser.displayName })
  }

  deletePost(postId) {
    return this.FireStore.collection("posts").doc(postId).delete()
  }

  runReRankCloudFunction() {
    var cloudFunction = this.FireStore.firestore.app['functions']().httpsCallable('testCall')
    cloudFunction().then(console.log);
  }

  removeFirebaseKeyIllegalChars(inputString) {
    return inputString.replace('.', '').replace('\\', '').replace('#', '').replace('$', '').replace('[', '').replace(']', '')
  }

  objToArray(input) {
    var output = []
    for (var key in input) {
      output.push(key);
    }
    return output;
  }
  arrayToObj(input) {
    var output = {}
    for (let arrayIndex = 0; arrayIndex < input.length; arrayIndex++) {
      output[input[arrayIndex]] = true;
    }
    return output;
  }

  calculatePostRanking(post) {

  }
}
