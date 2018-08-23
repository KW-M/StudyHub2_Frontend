import { Component, ViewEncapsulation, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';

import { WindowService } from "../../services/window.service";
import { EventBoardService } from "../../services/event-board.service";
import { DataHolderService } from "../../services/data-holder.service";
import { StudyhubServerApisService } from '../../services/studyhub-server-apis.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-feed-page',
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPageComponent implements OnInit, OnDestroy {
  // visiblePostsObserver: any;
  currentUserObserver;
  windowSize: any;
  classSearchText = "";
  windowSizeObserver;
  classAndGroupObserver;
  selectedFavorites = [];
  recentPosts = [];
  currentPostsGrid = [];

  constructor(public EventBoard: EventBoardService, private DataHolder: DataHolderService, public WindowFrame: WindowService, private ChangeDetector: ChangeDetectorRef, private ServerAPIs: StudyhubServerApisService) {
    this.windowSize = this.WindowFrame.getMediaQueries(null);
    this.windowSizeObserver = WindowFrame.mdWindowSize$.subscribe((sizes) => {
      this.windowSize = sizes;
    });
  }

  ngOnInit() {
    this.currentUserObserver = this.DataHolder.currentUserState$.subscribe((userObj: any) => {
      if (userObj && userObj.recentlyViewed && userObj.recentlyViewed.length != 0) {
        this.DataHolder.getRecentlyViewedPosts().then((posts) => {
          this.recentPosts = posts.filter((post) => {
            return (post.title && post.title.length != 0);
          })
          this.ChangeDetector.detectChanges();
        }).catch(console.warn)
      } else {
        this.recentPosts = null;
        this.ChangeDetector.detectChanges();
      }
      if (userObj && userObj.favorites && Object.keys(userObj.favorites).length !== 0) {
        this.DataHolder.startupCompleteState$.pipe(first()).toPromise().then(() => {
          this.DataHolder.getFeedPosts().then((postGrid) => {
            var counter = 0
            for (const favClass in userObj.favorites) {
              if (userObj.favorites.hasOwnProperty(favClass)) {
                postGrid[counter] = { className: favClass, posts: postGrid[counter].content.hits.map(this.DataHolder.convertAlgoliaHitToPost) }
                counter++
              }
            }
            console.log(postGrid);
            this.currentPostsGrid = postGrid
            this.ChangeDetector.detectChanges();
          }).catch(console.warn)
        })
      } else {
        console.log('startupNullcurposts')
        this.currentPostsGrid = null;
        this.ChangeDetector.detectChanges();
      }
      this.ChangeDetector.detectChanges();
    });
  }

  updateSelectedFavorites(favs) {
    console.log(favs);
    this.selectedFavorites = favs;
    this.ChangeDetector.detectChanges();
  }

  setFavorites() {
    var tempFavs = {}
    this.selectedFavorites.forEach((fav) => {
      tempFavs[fav] = true;
    })
    console.log(tempFavs)
    if (this.selectedFavorites.length !== 0) this.ServerAPIs.setFavorites(tempFavs).then((serverResponse) => {
      console.log(serverResponse)
      this.DataHolder.updateCurrentUserObserver({ favorites: tempFavs })
    }).catch((e) => {
      console.warn(e);
    })
  }

  trackByPostIdFn(index, post) {
    return post.id
  }

  ngOnDestroy() {
    this.windowSizeObserver.unsubscribe();
    this.currentUserObserver.unsubscribe();
  }

}

