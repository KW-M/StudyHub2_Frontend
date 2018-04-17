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
  websitePreviewObserver: any;
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
      "likeCount": 0,//<-
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
      "creationDate": new Date(),
      "updateDate": new Date(),
    }, this.inputPost);
    this.currentPost['color'] = this.dataHolder.getClassColor(this.currentPost.classes[0]);
    if (this.currentPost.link) {
      this.currentLinkPreview = this.dataHolder.getCachedLinkPreview(this.currentPost.id) || this.currentLinkPreview
      console.log("gotLinkPreview", this.currentLinkPreview);
      if (this.currentLinkPreview.thumbnail === null) {
        let driveFileId = this.currentPost.link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)
        if (driveFileId) {
          console.log('driveURL', driveFileId)
          // this.ExternalAPIs.getDrivePreview(driveFileId[0])
        } else {
          this.websitePreviewObserver = this.ExternalAPIs.getWebsitePreview(this.currentPost.link).subscribe((websitePreview) => {
            this.currentLinkPreview['thumbnail'] = websitePreview['image'];
            this.currentLinkPreview['icon'] = websitePreview['icon'];
            this.dataHolder.setCachedLinkPreview(this.currentPost.id, this.currentLinkPreview)
            this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
            this.changeDetector.detectChanges();
          }, (err) => { console.warn(err) })
        }
      }
    }
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
    if (this.websitePreviewObserver) this.websitePreviewObserver.unsubscribe()
  }
}
