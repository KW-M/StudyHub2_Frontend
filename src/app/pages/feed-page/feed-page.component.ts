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
  windowSize: any;
  windowSizeObserver;
  classAndGroupObserver;
  currentPosts;

  constructor(public EventBoard: EventBoardService, private dataHolder: DataHolderService, private GSignin: GoogleSigninService, public ServerAPIs: StudyhubServerApisService, public WindowFrame: WindowService) {
    // this.windowSize = this.WindowFrame.getMediaQueries(null);
    this.windowSizeObserver = WindowFrame.mdWindowSize$.subscribe((sizes) => {
      this.windowSize = sizes;
    });
    this.classAndGroupObserver = this.dataHolder.classAndGroupState$.subscribe((classAndGroup) => { })
  }

  ngOnDestroy() {
    this.windowSizeObserver.unsubscribe();
     this.classAndGroupObserver.unsubscribe()
  }

}

