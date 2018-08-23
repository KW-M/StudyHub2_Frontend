import { Component, ViewEncapsulation, Input, ViewChild, ViewChildren, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

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
      "creationDate": new Date().getTime(),
      "updateDate": new Date().getTime(),
    }
    this.signedinUserObserver = this.DataHolder.currentUserState$.subscribe((userObj) => {
      this.signedinUser = userObj;
    })
  }

  ngOnInit() {
    this.currentPost = this.inputPost
    this.currentPost['color'] = this.DataHolder.getClassObj(this.currentPost.classes[0]).color;
    console.log(this.currentPost);
    if (this.currentPost.link) {
      this.ExternalAPIs.getPreview(this.currentPost.link).then((websitePreview) => {
        this.currentLinkPreview.thumbnail = websitePreview['thumbnail'] || this.currentLinkPreview.thumbnail;
        this.currentLinkPreview.icon = websitePreview['icon'] || this.currentLinkPreview.icon;
        this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
        this.ChangeDetector.markForCheck()
      }, (err) => { console.warn(err) })
    }
  }

  openLink() {
    if (this.currentPost.link) {
      window.open(this.currentPost.link)
    }
  }

  closeModal() {
    this.EventBoard.closePostModal()
  }

  // getClassColorString(className: string) {
  //   let colorObj = this.DataHolder.getClassObj(className).color
  //   if (colorObj) return 'hsl(' + colorObj.h + ',' + colorObj.s + '%,40%)'
  // }

  ngOnDestroy() {
    this.signedinUserObserver.unsubscribe()
  }
}


