import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFirestore } from 'angularfire2/firestore';
import { Subject } from "rxjs/Subject";
import 'rxjs/add/operator/first';
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Injectable()
export class StudyhubServerApisService {
  serverURLBase: string = 'https://fir-test-156302.firebaseio.com/';
  constructor(private http: HttpClient,
    private sanitizer: DomSanitizer,
    private FireDB: AngularFireDatabase,
    private FireAuth: AngularFireAuth,
    private FireStore: AngularFirestore) { }

  getUserFromServer(email) {
    return new Promise((resolve, reject) => {
      email = this.removeFirebaseKeyIllegalChars(email)
      this.FireDB.object('users/' + email).valueChanges().first().toPromise().then((userObj) => {
        if (userObj === null) {
          let newUserObj = {
            'name': this.FireAuth.auth.currentUser.displayName,
            'uid': this.FireAuth.auth.currentUser.uid,
            'moderator': false,
            'favorites': {
              'Other': true
            },
            'bookmarks': {},
            'visitCount': 1,
            'contributionCount': 0
          }
          this.FireDB.object('users/' + email).set(newUserObj).then((dbResp: any) => {
            resolve(newUserObj)
          }).catch(reject)
        } else {
          resolve(userObj)
          this.FireDB.object('users/' + email + '/visitCount').query.ref.transaction(visits => { return visits ? visits + 1 : 1; }).then(console.log).catch(console.warn)
        }
      })
    })
  }

  getAllPosts(sortBy) {
    return this.FireStore.collection('posts')
  }

  getPosts(postFilters, sortBy, lastPost) {
    console.log({
      filters: postFilters,
      sortingOrder: sortBy,
      lastPost: lastPost
    })
    return this.FireStore.collection("posts", (ref) => {
      console.log(lastPost);
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      if (postFilters.className) { query = query.where("classes." + postFilters.className, "==", true) }
      if (postFilters.userEmail) { query = query.where("creator.email", "==", postFilters.userEmail) }
      if (lastPost) { query = query.startAfter(lastPost) }
      query = query.where("flagged", "==", postFilters.flagged || false)
      query = query.orderBy("updateDate", "desc").limit(4);
      return query
    }).snapshotChanges().map(actions => {
      return actions.map(action => {
        const data = action.payload.doc.data();
        data.id = action.payload.doc.id;
        data.classes = this.objToArray(data.classes)
        return data
      });
    })
  }

  getFeedPosts() {
    const params = new HttpParams().append('idtoken', gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token)
    return this.http.get(this.serverURLBase + "/feedPosts", { 'params': params }).toPromise()
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

  getRecentlyViewedPosts() {
    ///////////not done
    const params = new HttpParams().append('idtoken', gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token)
    return this.http.get(this.serverURLBase + "/lastviewedPosts", { 'params': params }).toPromise()
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

  getLabels() {
    return this.FireDB.object('labels/').valueChanges().first().toPromise()
  }

  submitPost(postObj) { // send a new or updated post object to the server
    postObj.likeCount = postObj.likeUsers.length || 0
    var convertedPost: any = {}
    convertedPost = Object.assign({}, postObj);
    delete convertedPost.id;
    convertedPost.classes = this.arrayToObj(convertedPost.classes)
    convertedPost.updateDate = firebase.firestore.FieldValue.serverTimestamp()
    console.log(convertedPost);
    this.updateLabels(postObj.labels, postObj.classes)
    if (postObj.id) {
      //  return new Promise((resolve, reject) => { this.FireStore.collection('posts').doc(postObj.id).set(convertedPost).then(resolve as any).catch(reject) })
      return this.FireStore.collection('posts').doc(postObj.id).set(convertedPost) as any;
    } else {
      convertedPost.creationDate = firebase.firestore.FieldValue.serverTimestamp()
      return this.FireStore.collection('posts').add(convertedPost)
    }
  }

  updateLabels(labelList, classes) {
    var finalPromise
    for (const label in labelList) {
      console.log(label, classes);
      this.FireDB.object('labels/' + label).query.ref.transaction(labelObj => {
        if (!labelObj) labelObj = { usage: {}, totalUsage: 0 }
        classes.forEach(className => {
          labelObj.usage[className] = labelObj.usage[className] + 1 || 1;
        });
        var totalUsage = 0
        for (const classKey in labelObj.usage) {
          totalUsage = totalUsage + labelObj.usage[classKey];
        }
        labelObj.totalUsage = totalUsage
        return labelObj
      }).then(console.log).catch(console.warn)
    }
  }

  setFavorites(favoritesObj) {
    return this.FireDB.object('users/' + this.removeFirebaseKeyIllegalChars(this.FireAuth.auth.currentUser.email) + "/favorites").set(favoritesObj)
  }

  deletePost(postId) {
    return this.FireStore.collection("posts").doc(postId).delete()
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
}


    // this.FireAuth.auth.currentUser.getIdToken(false).then(function (idToken) {
    //   fireIdToken = idToken;
    //   return this.http.get(this.serverURLBase + "/yorkClasses.json?auth=" + fireIdToken)
    // })
