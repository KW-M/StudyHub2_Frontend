import { Component, ViewEncapsulation, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { WindowService } from "../../services/window.service";
import { EventBoardService } from "../../services/event-board.service";
import { GoogleSigninService } from "../../services/google-signin.service";
import { DataHolderService } from "../../services/data-holder.service";
import { StudyhubServerApisService } from '../../services/studyhub-server-apis.service';

@Component({
  selector: 'app-feed-page',
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPageComponent implements OnDestroy {
  // visiblePostsObserver: any;
  currentUserObserver;
  windowSize: any;
  windowSizeObserver;
  classAndGroupObserver;
  recentPosts = [];
  currentPostsGrid = [];

  constructor(public EventBoard: EventBoardService, private DataHolder: DataHolderService, public WindowFrame: WindowService, private ChangeDetector: ChangeDetectorRef) {
    this.windowSize = this.WindowFrame.getMediaQueries(null);
    this.windowSizeObserver = WindowFrame.mdWindowSize$.subscribe((sizes) => {
      this.windowSize = sizes;
    });
    this.currentUserObserver = DataHolder.currentUserState$.subscribe((userObj: any) => {
      if (userObj.recentlyViewed && userObj.recentlyViewed.length != 0) {
        this.DataHolder.getRecentlyViewedPosts().then((posts) => {
          this.recentPosts = posts
          this.ChangeDetector.detectChanges();
        }).catch(console.warn)
      } else {
        this.recentPosts = null;
      }
      if (userObj.favorites && userObj.favorites.length != 0) {
        this.DataHolder.getFeedPosts().then((postGrid) => {
          var counter = 0
          for (const favClass in userObj.favorites) {
            if (userObj.favorites.hasOwnProperty(favClass)) {
              postGrid[counter] = { className: favClass, posts: postGrid[counter] }
              counter++
            }
          }
          console.log(postGrid);
          this.currentPostsGrid = postGrid
          this.ChangeDetector.detectChanges();
        }).catch(console.warn)
      } else {
        this.currentPostsGrid = null;
      }
    });
  }

  trackByPostIdFn(index, post) {
    return post.id
  }

  ngOnDestroy() {
    this.windowSizeObserver.unsubscribe();
    this.currentUserObserver.unsubscribe();
  }

}

