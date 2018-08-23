import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ExternalApisService } from '../services/external-apis.service';
import { DataHolderService } from '../services/data-holder.service';
import { EventBoardService } from '../services/event-board.service';
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent implements OnInit, OnDestroy {
  currentEmail: any;
  deleted: boolean;
  randomInt: any;
  @Input('input-post') inputPost;
  postBodyTextShown: boolean = false;
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
    this.randomInt = Math.floor(Math.random() * (15 - 1 + 1)) + 1;
    this.currentLinkPreview.thumbnail = '/assets/Material_Backgrounds/' + this.randomInt + '.png'
  }

  ngOnInit() {
    this.currentEmail = this.dataHolder.signedinUser.email
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
      "creationDate": new Date().getTime(),
      "updateDate": new Date().getTime(),
    }, this.inputPost);
    if (this.currentPost.link) {
      this.ExternalAPIs.getPreview(this.currentPost.link).then((websitePreview) => {
        this.currentLinkPreview.thumbnail = websitePreview['thumbnail'] || this.currentLinkPreview.thumbnail;
        this.currentLinkPreview.icon = websitePreview['icon'] || this.currentLinkPreview.icon;
        this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
        this.changeDetector.markForCheck()
      }, (err) => { console.warn(err) })
    }
    this.currentPost.likeCount = this.currentPost.likeUsers.length;
    if (this.dataHolder.yorkGroups) {
      this.currentPost['color'] = this.dataHolder.getClassObj(this.currentPost.classes[0]).color;
    } else {
      this.dataHolder.classAndGroupState$.pipe(first()).toPromise().then(() => { this.currentPost['color'] = this.dataHolder.getClassObj(this.currentPost.classes[0]).color; this.changeDetector.markForCheck() })
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
    this.ServerAPIS.updateLikes(this.currentPost.id, this.dataHolder.signedinUser.email)
    this.changeDetector.detectChanges()
  }

  viewPost() {
    this.eventBoard.openPostModal(this.currentPost, 'view')
    this.ServerAPIS.viewPost(this.currentPost.id).then(console.log).catch(console.warn)
  }

  viewLink() {
    if (this.currentPost.link) {
      this.ServerAPIS.viewPost(this.currentPost.id).then(console.log).catch(console.warn)
      window.open(this.currentPost.link)
    } else {
      this.viewPost()
    }
  }

  copyPostURL(currentPost) {
    this.dataHolder.copyString('https://studyhub.york.org/Feed#' + currentPost.id)
  }

  editPost(post) {
    this.eventBoard.openPostModal(post, 'edit')
  };
  deletePost() {
    this.deleted = true;
    this.dataHolder.deletePost(this.currentPost)
  }
  debugPost(post) {
    console.log(post);
  };

  ngOnDestroy() {
  }

}