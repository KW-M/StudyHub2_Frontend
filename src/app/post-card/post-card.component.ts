import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ExternalApisService } from '../services/external-apis.service';
import { DataHolderService } from '../services/data-holder.service';
import { EventBoardService } from '../services/event-board.service';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss', '../post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent implements OnInit, OnDestroy {
  websitePreviewObserver: any;
  @Input('input-post') inputPost;
  postBodyTextShown: boolean = false;
  currentLinkPreview = {
    thumbnail: null,
    icon: null
  };
  currentPost;

  constructor(private changeDetector: ChangeDetectorRef,
    private ExternalAPIs: ExternalApisService,
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
      "labels": [],
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
  likePost() {
    var emailIndex = this.currentPost.likeUsers.indexOf(this.dataHolder.signedinUser.email)
    if (emailIndex !== -1) {
      this.currentPost.likeUsers.splice(emailIndex, 1)
    } else {
      this.currentPost.likeUsers.push(this.dataHolder.signedinUser.email)
    }
    this.currentPost.likeCount = this.currentPost.likeUsers.length
  }

  viewPost() {

  }

  viewLink() {
    window.open()
  }

  editPost(post) {
    this.eventBoard.openPostModal(post, 'edit')
  };
  deletePost(post) {
    this.dataHolder.deletePost(post)
  }
  debugPost(post) {
    console.log(post);
  };

  ngOnDestroy() {
    if (this.websitePreviewObserver) this.websitePreviewObserver.unsubscribe();
  }

}