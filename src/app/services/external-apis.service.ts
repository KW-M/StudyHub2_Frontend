import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from "rxjs/Subject";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map, filter, scan } from 'rxjs/operators';

declare var google;

@Injectable()
export class ExternalApisService {
  driveFilePickerRef;
  linkPreviewCache = {};
  quizletApiClientId = 'ZvJPu87NPA'
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {

  }

  getWebsitePreview(url) {
    return this.http.get("https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url=" + url + "&rule=AvoidLandingPageRedirects&screenshot=true&strategy=desktop&fields=screenshot(data%2Cmime_type)%2Ctitle&key=AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").pipe(map((previewJSON: any) => {
      return {
        title: previewJSON.title,
        image: this.sanitizer.bypassSecurityTrustUrl('data:' + previewJSON.screenshot.mime_type + ';base64,' + previewJSON.screenshot.data.replace(/_/g, "/").replace(/-/g, '+')),
        icon: 'https://www.google.com/s2/favicons?domain_url=' + url,
      }
    }))
  }

  getDrivePreview(fileId) {
    return this.http.post("https://script.google.com/macros/s/AKfycbxYwLgFvov0RfCPgUr_rTc5heMLBLFBaERo43kLlSYjLsGp5lfp/exec?fileId=" + fileId + "&returnPermissions=true&returnPreview=true", {}, {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
      })
    })
  }

  getPreview(link, getSharing) {
    return new Promise((resolve, reject) => {
      var currentLinkPreview = this.linkPreviewCache[link] || {}
      if (currentLinkPreview.thumbnail === undefined) {
        let driveFileId = link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)
        if (driveFileId && driveFileId[1]) {
          //this.getDrivePreview(driveFileId[1]).first().toPromise().then((Response) => { console.log('drive preview:', Response); resolve(currentLinkPreview) })
          resolve(currentLinkPreview)
        } else {
          this.getWebsitePreview(link).first().toPromise().then((websitePreview) => {
            currentLinkPreview.thumbnail = websitePreview['image'];
            currentLinkPreview.icon = websitePreview['icon'];
            currentLinkPreview.attachmentName = websitePreview['title'] || '';
            this.linkPreviewCache[link] = currentLinkPreview;
            resolve(currentLinkPreview)
          }, reject)
        }
      } else {
        resolve(currentLinkPreview)
      }
    })
  }

  openShareDialog(fileID) {
    return new Promise(function (resolve, reject) {
      console.log(fileID);
      if (gapi['drive'] && gapi['drive']['share']) {
        showDialog()
      } else {
        gapi.load('drive-share', showDialog);
      }
      function showDialog() {
        let s = new gapi['drive'].share.ShareClient();
        s.setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
        s.setItemIds(['0B5NVuDykezpkems3SEhhLVpYWWs']);
        s.showSettingsDialog();
        console.log(s)
        console.log(gapi)
      }
    })
  }

  openDriveFilePicker() {
    console.log('pickinhg', this.driveFilePickerRef);
    return new Promise((resolve, reject) => {
      console.log('picking', this.driveFilePickerRef);
      if (this.driveFilePickerRef) {
        this.driveFilePickerRef.setVisible(true);
      } else {
        gapi.load('picker', () => {
          //var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
          var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setParent("root");
          var sharedView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setOwnedByMe(false);
          var recentsView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(false).setSelectFolderEnabled(true).setLabel('Recents');
          var staredView = new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setStarred(true).setLabel('Stared');
          this.driveFilePickerRef = new google.picker.PickerBuilder()
            .setAppId("848371898392-ghhd3b6ac0ilqddq12d2a96tm7joonpj")
            .setDeveloperKey("AIzaSyCXA0gp81xAySIOrD9uHBcQKtgwneWc_Rg")
            .setOrigin(window.location.protocol + '//' + window.location.host)
            .setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
            .setCallback(resolve)
            .addView(docsView).addView(sharedView).addView(recentsView).addView(staredView).build();
          this.driveFilePickerRef.setVisible(true);
        });
      }
    })
  }

  getQuizletUser(userName) {
    return this.http.jsonp("https://api.quizlet.com/2.0/users/" + userName + "?client_id=" + this.quizletApiClientId, 'callback').first().toPromise()
  }

  quizletUserSearch(userName) {
    return this.http.jsonp("https://api.quizlet.com/2.0/search/universal?q=" + userName + "&autocomplete=true&client_id=" + this.quizletApiClientId, 'callback').first().toPromise()
  }
}