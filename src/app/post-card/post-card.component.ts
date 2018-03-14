import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
export class PostCardComponent implements OnInit {
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
       private eventBoard:EventBoardService) {
  }

  ngOnInit() {
    this.currentPost = Object.assign({
      "id": null,
      "title": "",
      "link": "",
      "description": "",
      "likes": [],
      "labels": [],
      "classes": [],//<-
      "creator": {
        "email": null,
        "name": null
      },
      "flagged": false,
      "creationDate": new Date().getSeconds(),
      "updateDate": new Date().getSeconds(),
    }, this.inputPost);
    this.currentPost['color'] = this.dataHolder.getClassColor(this.currentPost.classes[0]);
    console.log(this.dataHolder.getClassColor(this.currentPost.classes[0]));

    if (this.currentPost.link) {
      this.currentLinkPreview = this.dataHolder.getCachedLinkPreview(this.currentPost.id) || this.currentLinkPreview
      console.log("gotLinkPreview",this.currentLinkPreview);
      if (this.currentLinkPreview.thumbnail === null) {
        if (this.currentPost.link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)) {
          console.log('driveURL')
        } else {
          this.ExternalAPIs.getWebsitePreview(this.currentPost.link).then((websitePreview) => {
              this.currentLinkPreview['thumbnail'] = websitePreview['image'];
              this.currentLinkPreview['icon'] = websitePreview['icon'];
              this.dataHolder.setCachedLinkPreview(this.currentPost.id, this.currentLinkPreview)
              this.currentPost.attachmentName = websitePreview['title'] || this.currentPost.attachmentName;
              this.changeDetector.detectChanges();
          }).catch((err) => { console.warn(err) })
        }
      }
    }
  }
  deletePost(post) {
    
  }
  editPost(post){
    this.eventBoard.openPostModal(post,'edit')
  };
  debugPost(post){
    console.log(post);
  };

}