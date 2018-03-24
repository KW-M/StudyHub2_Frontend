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
  visiblePostsObserver: any;
  windowSize: any;
  windowSizeObserver;
  classAndGroupObserver;
  currentPostsGrid;

  constructor(public EventBoard: EventBoardService, private DataHolder: DataHolderService, public WindowFrame: WindowService, private ChangeDetector: ChangeDetectorRef) {
    this.windowSize = this.WindowFrame.getMediaQueries(null);
    this.windowSizeObserver = WindowFrame.mdWindowSize$.subscribe((sizes) => {
      this.windowSize = sizes;
    });
    // this.classAndGroupObserver = this.DataHolder.classAndGroupState$.subscribe((classAndGroup) => { })
    this.visiblePostsObserver = this.DataHolder.feedPostsState$.subscribe((posts) => {
      console.log("feed posts from server", posts);
      if (posts[0][0]) {
        this.currentPostsGrid = posts;
        this.ChangeDetector.detectChanges();
      }
    })
  }

  trackByPostIdFn(index, post) {
    return post.id
  }

  ngOnDestroy() {
    this.windowSizeObserver.unsubscribe();
    this.visiblePostsObserver.unsubscribe();
    // this.classAndGroupObserver.unsubscribe()
  }

}

