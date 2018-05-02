import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ExternalApisService } from '../services/external-apis.service';
import { DataHolderService } from '../services/data-holder.service';
import { EventBoardService } from '../services/event-board.service';
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
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
    private ServerAPIS: StudyhubServerApisService,
    private dataHolder: DataHolderService,
    private eventBoard: EventBoardService) {
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    this.currentLinkPreview.thumbnail = '/assets/Material_Backgrounds/' + getRandomInt(1, 15) + '.png'
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
    this.currentPost['color'] = this.dataHolder.getClassObj(this.currentPost.classes[0]).color;
    console.log(this.currentPost.link);

    if (this.currentPost.link) this.ExternalAPIs.getPreview(this.currentPost.link, false).then((websitePreview) => {
      console.log(websitePreview);
      this.currentLinkPreview.thumbnail = websitePreview['thumbnail'] || this.currentLinkPreview.thumbnail;
      this.currentLinkPreview.icon = websitePreview['icon'] || this.currentLinkPreview.icon;
      this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
      this.changeDetector.detectChanges();
    }, (err) => { console.warn(err) })
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