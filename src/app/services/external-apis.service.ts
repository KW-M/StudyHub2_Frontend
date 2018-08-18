import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map, filter, scan, first } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import * as Queue from 'p-queue'
import { GoogleSigninService } from './google-signin.service';

declare var google;

@Injectable()
export class ExternalApisService {
  gDriveRequestQueue: any;
  driveFilePickerRef;
  fileUploadPickerRef;
  linkPreviewCache = {};
  quizletApiClientId = 'ZvJPu87NPA'
  constructor(private http: HttpClient, private sanitizer: DomSanitizer, public snackBar: MatSnackBar, private GSignin: GoogleSigninService) {
    this.gDriveRequestQueue = new Queue({
      autoStart: false, // autostart the queue
      concurrency: 1,
    });
    GSignin.signinState$.subscribe((signedIn) => {
      const startQueue = () => {
        if (signedIn) {
          this.gDriveRequestQueue.start()
        } else {
          this.gDriveRequestQueue.pause()
        }
      }
      if (gapi.client) { startQueue() } else { gapi.load('client', startQueue) }
    })
  }

  getWebsitePreview(url) {
    return this.http.get("https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url=" + url + "&rule=AvoidLandingPageRedirects&screenshot=true&strategy=desktop&fields=screenshot(data%2Cmime_type)%2Ctitle%2CpageStats(htmlResponseBytes%2CimageResponseBytes)&key=AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").pipe(map((previewJSON: any) => {
      return {
        title: previewJSON.title,
        image: (previewJSON.pageStats.imageResponseBytes > 10 && !previewJSON.pageStats.htmlResponseBytes) ? url : this.sanitizer.bypassSecurityTrustUrl('data:' + previewJSON.screenshot.mime_type + ';base64,' + previewJSON.screenshot.data.replace(/_/g, "/").replace(/-/g, '+')),
        icon: 'https://www.google.com/s2/favicons?domain_url=' + url,
      }
    }))
  }

  getDrivePreview(fileId) {
    return this.gDriveRequestQueue.add(() => {
      return gapi.client.request({
        path: 'https://www.googleapis.com/drive/v3/files/' + fileId,
        params: {
          "acknowledgeAbuse": false,
          "supportsTeamDrives": true,
          "fields": "thumbnailLink,iconLink,name"//capabilities/canShare,permissions(domain,kind,role,teamDrivePermissionDetails),
        }
      })
    })
  }

  getDriveSharingPermisions(link) {
    let driveFileId = link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)
    return this.gDriveRequestQueue.add(() => {
      return new Promise((resolve, reject) => {
        const getDriveFile = () => {
          return gapi.client.request({
            path: 'https://www.googleapis.com/drive/v3/files/' + driveFileId[1],
            params: {
              "acknowledgeAbuse": false,
              "supportsTeamDrives": true,
              "fields": "capabilities/canShare"
            }
          }).then((response: any) => {
            console.log("Response", response);
            if (response.result.capabilities.canShare === true) {
              this.openShareDialog(driveFileId[1])
              this.snackBar.open('Please enable link sharing on the attached file, so other students can view it.', 'Ok', {
                duration: 20000,
                horizontalPosition: "center",
              })
            } else {
              this.snackBar.open('Please ask the owner of the attached file to enable link sharing, so other students can view it.', 'Ok', {
                duration: 10000,
                horizontalPosition: "start"
              })
              resolve(true)
            }
            // Handle the results here (response.result has the parsed body).
          }).catch(function (err) { console.error("Execute error", err); });
        }
        if (driveFileId && driveFileId[1]) {
          this.getDriveFileIsShared(driveFileId[1]).then((shared) => {
            console.log(shared)
            if (shared === true) {
              resolve(true)
            } else {
              getDriveFile()
            }
          }).catch(function (err) { console.error("Execute error o", err); })
        } else {
          resolve(true)
        }
      })
    })
  }

  getPreview(link) {
    return new Promise((resolve, reject) => {
      var currentLinkPreview = this.linkPreviewCache[link] || {}
      if (currentLinkPreview.thumbnail === undefined) {
        let driveFileId = link.match(/(?:(?:\/(?:d|s|file|folder|folders|projects)\/)|(?:id=)|(?:open=))([-\w]{25,})/)
        if (driveFileId && driveFileId[1]) {
          this.getDrivePreview(driveFileId[1]).then((fileResponse: any) => {
            currentLinkPreview.thumbnail = (fileResponse.result['thumbnailLink'] || '').replace("=s220", "=s540");//.replace(/sz=s+\d+/, "sz=s540")
            currentLinkPreview.icon = fileResponse.result['iconLink'];
            currentLinkPreview.attachmentName = fileResponse.result['name'] || '';
            this.linkPreviewCache[link] = currentLinkPreview;
            resolve(currentLinkPreview)
          })
        } else {
          this.getWebsitePreview(link).pipe(first()).toPromise().then((websitePreview) => {
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
        console.log(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
        s.setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
        s.setItemIds([fileID]);//['0B5NVuDykezpkems3SEhhLVpYWWs'])//
        s.showSettingsDialog();
        console.log(s)
        console.log(gapi)
        resolve(true)
      }
    })
  }

  openDriveFilePicker() {
    return new Promise((resolve, reject) => {
      if (this.driveFilePickerRef) {
        this.driveFilePickerRef.setVisible(true);
      } else {
        const createDrivePicker = () => {
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
            .setCallback((data) => {
              var action = data[google.picker.Response.ACTION];
              if (action == google.picker.Action.PICKED) {
                var doc = data[google.picker.Response.DOCUMENTS][0];
                resolve({
                  link: doc[google.picker.Document.URL],
                  title: doc[google.picker.Document.NAME],
                  attachmentName: doc[google.picker.Document.NAME],
                })
              } else if (action == google.picker.Action.CANCEL) {
                resolve(false)
              }
            })
            .addView(docsView).addView(sharedView).addView(recentsView).addView(staredView).build();
          this.driveFilePickerRef.setVisible(true);
        }
        if (window['google'] && google.picker) {
          createDrivePicker()
        } else {
          gapi.load('picker', createDrivePicker);
        }
      }
    })
  }

  openFileUploadPicker() {
    return new Promise((resolve, reject) => {
      if (this.fileUploadPickerRef) {
        this.fileUploadPickerRef.setVisible(true);
      } else {
        const createUploadPicker = () => {
          var uploadView = new google.picker.DocsUploadView().setParent("0B5NVuDykezpkUGd0LTRGc2hzM2s");
          this.fileUploadPickerRef = new google.picker.PickerBuilder()
            .setAppId("848371898392-ghhd3b6ac0ilqddq12d2a96tm7joonpj")
            .setDeveloperKey("AIzaSyCXA0gp81xAySIOrD9uHBcQKtgwneWc_Rg")
            .setOrigin(window.location.protocol + '//' + window.location.host)
            .setOAuthToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token)
            .setCallback((data) => {
              var action = data[google.picker.Response.ACTION];
              if (action == google.picker.Action.PICKED) {
                var doc = data[google.picker.Response.DOCUMENTS][0];
                resolve({
                  link: doc[google.picker.Document.URL],
                  title: doc[google.picker.Document.NAME],
                  attachmentName: doc[google.picker.Document.NAME],
                })
              } else if (action == google.picker.Action.CANCEL) {
                resolve(false)
              }
            })
            .addView(uploadView).enableFeature(google.picker.Feature.NAV_HIDDEN).hideTitleBar().build();
          this.fileUploadPickerRef.setVisible(true);
        }
        if (window['google'] && google.picker) {
          createUploadPicker()
        } else {
          gapi.load('picker', createUploadPicker);
        }
      }
    })
  }

  getDriveFileIsShared(fileId) {
    return this.http.jsonp("https://script.google.com/macros/s/AKfycbxYwLgFvov0RfCPgUr_rTc5heMLBLFBaERo43kLlSYjLsGp5lfp/exec?fileId=" + fileId, 'callback').pipe(first()).toPromise()
  }

  getQuizletUser(userName) {
    return this.http.jsonp("https://api.quizlet.com/2.0/users/" + userName + "?client_id=" + this.quizletApiClientId, 'callback').pipe(first()).toPromise()
  }

  quizletUserSearch(userName) {
    return this.http.jsonp("https://api.quizlet.com/2.0/search/universal?q=" + userName + "&client_id=" + this.quizletApiClientId, 'callback').pipe(first()).toPromise()
  }
}