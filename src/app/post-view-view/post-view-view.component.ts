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
    this.currentPost['color'] = this.DataHolder.getClassObj(this.currentPost.classes[0]).color;
    console.log(this.currentPost);
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
    if (this.websitePreviewObserver) this.websitePreviewObserver.unsubscribe();
  }
}


