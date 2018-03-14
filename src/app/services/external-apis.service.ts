import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from "rxjs/Subject";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class ExternalApisService {

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }

  getWebsitePreview(url) {
    return this.http.get("https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url=" + url + "&rule=AvoidLandingPageRedirects&screenshot=true&strategy=desktop&fields=screenshot(data%2Cmime_type)%2Ctitle&key=AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo").map((previewJSON: any) => {
      return {
        title: previewJSON.title,
        image: this.sanitizer.bypassSecurityTrustUrl('data:' + previewJSON.screenshot.mime_type + ';base64,' + previewJSON.screenshot.data.replace(/_/g, "/").replace(/-/g, '+')),
        icon: 'https://www.google.com/s2/favicons?domain_url=' + url,
      }
    })
  }
}
