import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from "rxjs/Subject";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map, filter, scan } from 'rxjs/operators';
import instantsearch from 'instantsearch.js/es';

declare var google;

@Injectable()
export class ExternalApisService {

  driveFilePickerRef;
  algoliaSearch = instantsearch({
    appId: 'latency',
    apiKey: '3d9875e51fbd20c7754e65422f7ce5e1',
    indexName: 'bestbuy',
    urlSync: true
  });
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }

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
    return this.http.get("https://script.google.com/a/york.org/macros/s/AKfycbxYwLgFvov0RfCPgUr_rTc5heMLBLFBaERo43kLlSYjLsGp5lfp/exec?fileId=" + fileId + "&returnPermissions=true&returnPreview=true", {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token
      })
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
        console.log('fileID');
        let s = new gapi['drive'].share.ShareClient();
        s.setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token);
        s.setItemIds([fileID]);
        s.showSettingsDialog();
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
            .setAppId("191304458473")
            .setDeveloperKey("AIzaSyBpJyrgXYqBYUG5iKlTE--8z8ZaiAJRqL0")
            .setOrigin(window.location.protocol + '//' + window.location.host)
            .setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token)
            .setCallback(resolve)
            .addView(docsView).addView(sharedView).addView(recentsView).addView(staredView).build();
          this.driveFilePickerRef.setVisible(true);
        });
      }
    })
  }
}