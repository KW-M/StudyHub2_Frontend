//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { DataHolderService } from '../services/data-holder.service';
import { WindowService } from "../services/window.service";
import { Router, NavigationEnd } from '@angular/router';
import { connectSearchBox } from 'instantsearch.js/es/connectors';
import { ExternalApisService } from '../services/external-apis.service';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent implements OnInit {
  algoliaSearchState: any;
  mobileSearchOpen: boolean = false;
  windowSize;
  searchText;
  user = {
    name: 'York Student',
    email: ' . . . @york.org',
    profilePhoto: 'http://studyhub.york.org/images/accountPic.jpg',
  };
  throttleTimer = {

  };
  constructor(
    private router: Router,
    private GSignin: GoogleSigninService,
    public EventBoard: EventBoardService,
    private DataHolder: DataHolderService,
    private ExternalAPIs: ExternalApisService,
    public WindowFrame: WindowService,
    private ChangeDetector: ChangeDetectorRef,
  ) {
    this.windowSize = this.WindowFrame.getMediaQueries(null);
    WindowFrame.mdWindowSize$.subscribe(sizes => {
      this.windowSize = sizes;
      if (this.windowSize.sm) this.mobileSearchOpen = false;
      ChangeDetector.detectChanges()
    });
    DataHolder.currentUserState$.subscribe((userObj: any) => {
      this.user = userObj || { photoURL: 'http://studyhub.york.org/images/accountPic.jpg', name: 'York Student', email: ' . . . @york.org' };
      ChangeDetector.detectChanges()
    });
    router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {
      this.searchText = this.router.routerState.snapshot.root.queryParams.q || null;
      ChangeDetector.detectChanges()
    });
  }

  updateSearch(query) {
    this.algoliaSearchState.refine(query)
    // clearTimeout(this.throttleTimer['onSearchInput']);
    // this.throttleTimer['onSearchInput'] = setTimeout(() => {
    //   console.log('searching');
    //   console.log(this.router.navigate(['/all posts'], { queryParams: { 'query': query } }));
    // }, 1100)
  }

  clearSearch() {
    this.searchText = ''
    this.algoliaSearchState.refine('')
    this.ChangeDetector.detectChanges()
  }

  setMobileSearchOpen(open) {
    this.mobileSearchOpen = open
    this.ChangeDetector.detectChanges()
  }

  toggleSideMenu() {
    this.EventBoard.toggleSideNavOpen();
  }

  signIn() {
    this.GSignin.handleSignInClick()
  }
  signOut() {
    this.GSignin.handleSignOutClick()
  }

  ngOnInit() {
    const widget = connectSearchBox((state, isFirstRendering) => {
      // asynchronous update of the state
      // avoid `ExpressionChangedAfterItHasBeenCheckedError`
      if (isFirstRendering) {
        return Promise.resolve(null).then(() => {
          this.algoliaSearchState = state;
        });
      } else {
        this.algoliaSearchState = state;
      }
    });
    this.ExternalAPIs.algoliaSearch.addWidget(widget());
    this.searchText = this.router.routerState.snapshot.root.queryParams.q || null;
  }

}

