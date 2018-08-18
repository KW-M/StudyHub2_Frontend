import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ExternalApisService } from '../services/external-apis.service';
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
import { DataHolderService } from '../services/data-holder.service';
import { EventBoardService } from '../services/event-board.service';

@Component({
  selector: 'app-post-card-mini',
  templateUrl: './post-card-mini.component.html',
  styleUrls: ['./post-card-mini.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardMiniComponent implements OnInit, OnDestroy {
  @Input('input-post') inputPost;
  currentLinkPreview = {
    thumbnail: null,
    icon: null
  };
  currentPost;
  constructor(private changeDetector: ChangeDetectorRef,
    private ExternalAPIs: ExternalApisService,
    private ServerAPIS: StudyhubServerApisService,
    private dataHolder: DataHolderService,
    private eventBoard: EventBoardService) {
  }

  ngOnInit() {
    this.currentPost = Object.assign({
      "id": null,
      "title": "",
      "link": "",
      "description": "",
      "likeUsers": [],//<-
      "viewCount": 0,//<-
      "ranking": 0,//<-
      "labels": {},
      "classes": [],
      "creator": {
        "email": null,
        "name": null,
      },
      "flagged": false,
      "creationDate": new Date().getTime(),
      "updateDate": new Date().getTime(),
    }, this.inputPost);
    this.currentPost['color'] = this.dataHolder.getClassObj(this.currentPost.classes[0]).color;
    if (this.currentPost.link) this.ExternalAPIs.getPreview(this.currentPost.link).then((websitePreview) => {
      this.currentLinkPreview.thumbnail = websitePreview['thumbnail'];
      this.currentLinkPreview.icon = websitePreview['icon'];
      this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
      this.changeDetector.detectChanges();
    }, (err) => { console.warn(err) })
  }
  viewPost() {
    this.ServerAPIS.viewPost(this.currentPost.id).then(console.log).catch(console.warn)
    if (this.currentPost.link) {
      window.open(this.currentPost.link)
    } else {
      this.eventBoard.openPostModal(this.currentPost, 'view')
    }
  }
  ngOnDestroy() {
  }
}
