import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ExternalApisService } from '../services/external-apis.service';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss','../post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent implements OnInit {
  @Input('input-post') inputPost;
  postBodyTextShown: boolean = false;
  currentPost;
  currentLinkPreview = {
    thumbnail: null,
    icon: null
  };
  constructor(private changeDetector:ChangeDetectorRef, private ExternalAPIs: ExternalApisService) {
  }

  ngOnInit() {
    this.currentPost = Object.assign({
      "id": null,
      "title": "",
      "link": "",
      "type": "noLink",
      "description": "",
      "likes": [],
      "labels": [],
     // "teachers": [],
      "classes": [],//<-
      "creator": {
        "email": null,
        "name": null
      },
      "flagged": false,
      "creationDate": new Date().getSeconds(),
      "updateDate": new Date().getSeconds(),
    }, this.inputPost);
    if (this.currentPost.link) if (this.currentPost.link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)) {
      console.log('driveURL')
    } else {
      this.ExternalAPIs.getWebsitePreview(this.currentPost.link).then((websitePreview) => {
        this.currentPost.type = "Link"
        this.currentPost.link = this.currentPost.link;
        this.currentPost.attachmentName = websitePreview['title'];
        this.currentLinkPreview.thumbnail = websitePreview['image'];
        this.currentLinkPreview.icon = websitePreview['icon'];
        this.changeDetector.detectChanges();
      }).catch((err) => {console.warn(err)})
    }
  }
}