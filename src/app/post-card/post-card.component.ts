import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';
import { ExternalApisService } from '../services/external-apis.service';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss', '../post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent implements OnInit {
  @Input('input-post') inputPost;
  @Output('preview-loaded') linkPreview = new EventEmitter();
  postBodyTextShown: boolean = false;
  currentPost;
  constructor(private changeDetector: ChangeDetectorRef, private ExternalAPIs: ExternalApisService) {
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
      "linkPreview":{
        thumbnail:null,
        icon:null
      },
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
    console.log(this.currentPost.linkPreview.thumbnail);
    if (this.currentPost.link && this.currentPost.linkPreview.thumbnail === null) {
      if (this.currentPost.link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)) {
        console.log('driveURL')
      } else {
        this.ExternalAPIs.getWebsitePreview(this.currentPost.link).then((websitePreview) => {
          if(this.changeDetector) {
          this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
          this.currentPost.linkPreview.thumbnail = websitePreview['image'];
          this.currentPost.linkPreview.icon = websitePreview['icon'];
          this.linkPreview.emit(this.currentPost.linkPreview)
          console.log('emmiting',this.currentPost.linkPreview);
          this.changeDetector.detectChanges();
          }
        }).catch((err) => { console.warn(err) })
      }
    }
  }
}