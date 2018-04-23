import { Component, ViewEncapsulation, Input, ViewChild, ViewChildren, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { WindowService } from "../services/window.service";
import { EventBoardService } from "../services/event-board.service";
import { DataHolderService } from "../services/data-holder.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';

@Component({
  selector: 'app-post-view-view',
  templateUrl: './post-view-view.component.html',
  styleUrls: ['./post-view-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostViewViewComponent implements OnInit, OnDestroy {
  websitePreviewObserver;
  @Input('input-post') inputPost;
  labelChipList = [];
  currentPost;
  currentLinkPreview = {
    thumbnail: null,
    icon: null
  };
  signedinUser;
  signedinUserObserver;
  throttleTimer = {

  };
  constructor(private EventBoard: EventBoardService,
    private ExternalAPIs: ExternalApisService,
    private ServerAPIs: StudyhubServerApisService,
    private componentElem: ElementRef,
    private ChangeDetector: ChangeDetectorRef,
    private DataHolder: DataHolderService,
    public snackBar: MatSnackBar
  ) {
    this.currentPost = {
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
      "attachmentName": null,
      "flagged": false,
      "creationDate": new Date(),
      "updateDate": new Date(),
    }
    this.signedinUserObserver = this.DataHolder.currentUserState$.subscribe((userObj) => {
      this.signedinUser = userObj;
    })
  }

  ngOnInit() {
    this.currentPost = this.inputPost
    // this.currentPost['color'] = this.DataHolder.getClassColor(this.currentPost.classes[0]);
    console.log(this.currentPost);

    // if (this.currentPost.link) {
    //   this.currentLinkPreview = this.DataHolder.getCachedLinkPreview(this.currentPost.id) || this.currentLinkPreview
    //   console.log("gotLinkPreview", this.currentLinkPreview);
    //   if (this.currentLinkPreview.thumbnail === null) {
    //     let driveFileId = this.currentPost.link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)
    //     if (driveFileId) {
    //       console.log('driveURL', driveFileId)
    //       // this.ExternalAPIs.getDrivePreview(driveFileId[0])
    //     } else {
    //       this.websitePreviewObserver = this.ExternalAPIs.getWebsitePreview(this.currentPost.link).subscribe((websitePreview) => {
    //         this.currentLinkPreview['thumbnail'] = websitePreview['image'];
    //         this.currentLinkPreview['icon'] = websitePreview['icon'];
    //         this.DataHolder.setCachedLinkPreview(this.currentPost.id, this.currentLinkPreview)
    //         this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
    //         this.ChangeDetector.detectChanges();
    //       }, (err) => { console.warn(err) })
    //     }
    //   }
    // }
  }

  closeModal() {
    this.EventBoard.closePostModal()
  }

  getClassColorString(className: string) {
    let colorObj = this.DataHolder.getClassObj(className).color
    if (colorObj) return 'hsl(' + colorObj.h + ',' + colorObj.s + '%,40%)'
  }

  ngOnDestroy() {
    this.signedinUserObserver.unsubscribe()
    if (this.websitePreviewObserver) this.websitePreviewObserver.unsubscribe();
  }
}


