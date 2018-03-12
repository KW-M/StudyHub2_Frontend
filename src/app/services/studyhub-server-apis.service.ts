import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from "rxjs/Subject";
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable()
export class StudyhubServerApisService {
  serverURLBase: string = 'http://192.168.0.25:3000'
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {

  }

  getUserFromServer(authToken) {
    return this.http.post(this.serverURLBase + "/usersignin", { idtoken: authToken }).toPromise()
  }

  submitPost(postObj) { // send a new or updated post object to the server
    console.log(postObj);
    if (postObj.id === null) postObj.id = undefined;
    let promise = new Promise((resolve, reject) => {
      this.http.post(this.serverURLBase + "/savePost", {
        post: postObj,
        idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
      }).subscribe((responseJSON: any) => {
        console.log(responseJSON)
        resolve(responseJSON);
      }, reject);
    });
    return promise;
  }

  getAllPosts(sortBy) {
    const params = new HttpParams({
      fromObject: {
        sortingOrder: sortBy,
        idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
      }
    })
    let promise = new Promise((resolve, reject) => {
      this.http.get(this.serverURLBase + "/allPosts", { 'params': params }).subscribe(resolve, reject);
    });
    return promise;
  }

  getQueryPosts(postFilters) {
    const params = new HttpParams({
      fromObject: {
        filters: JSON.stringify(postFilters),
        idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
      }
    });
    return this.http.get(this.serverURLBase + "/search", { 'params': params }).toPromise();
  }

  getClassPosts(className, sortBy) {
    const params = new HttpParams({
      fromObject: {
        class: className,
        sortingOrder: sortBy,
        idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
      }
    });
    let promise = new Promise((resolve, reject) => {
      this.http.get(this.serverURLBase + "/classPosts", { 'params': params }).subscribe(resolve, reject);
    });
    return promise;
  }

  getPosts(postFilters, sortBy) {

    const params = new HttpParams({
      fromObject: {
        filters: JSON.stringify(postFilters),
        sortingOrder: sortBy,
        idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
      }
    });
    console.log(JSON.stringify({
      filters: postFilters,
      sortingOrder: sortBy,
      idtoken: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
    }))
    return this.http.get(this.serverURLBase + "/filteredPosts", { 'params': params }).toPromise()
  }

  getClassAndGroupList() {
    return this.http.get(this.serverURLBase + "/classesandgroups")
  }

  getLabels() {
    return this.http.get(this.serverURLBase + "/labels")
  }

  setFavorites(favoritesArray) {
    return this.http.post(this.serverURLBase + "/setFavorites", {
      'favorites': favoritesArray,
      'idtoken': gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token
    })
  }



  // getUser(gauthToken) {
  //   this.http.post(this.serverURLBase + "/usersignin", { idtoken: userId })
  // }
}
