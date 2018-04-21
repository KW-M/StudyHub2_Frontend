//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { DataHolderService } from '../services/data-holder.service';
import { WindowService } from "../services/window.service";
import { Router, NavigationEnd } from '@angular/router';
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
  currentPage
  windowSize;
  searchText;
  user = {
    name: 'York Student',
    email: ' . . . @york.org',
    photoURL: 'http://studyhub.york.org/images/accountPic.jpg',
  };
  throttleTimer = {

  };
  constructor(
    private Router: Router,
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
    Router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {
      this.currentPage = this.Router.routerState.snapshot.root.firstChild.url[0].path || "My Feed";
      this.searchText = this.Router.routerState.snapshot.root.queryParams.q || null;
      ChangeDetector.detectChanges()
    });
  }

  updateSearch(query) {
    this.ExternalAPIs.searchHelper.setQuery(query).search()
    // clearTimeout(this.throttleTimer['onSearchInput']);
    // this.throttleTimer['onSearchInput'] = setTimeout(() => {
    //   console.log('searching');
    //   console.log(this.router.navigate(['/all posts'], { queryParams: { 'query': query } }));
    // }, 1100)
  }

  clearSearch() {
    this.searchText = ''
    this.ExternalAPIs.searchHelper.setQuery('')
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
    this.searchText = this.Router.routerState.snapshot.root.queryParams.q || null;
    if (this.searchText) this.ExternalAPIs.searchHelper.setQuery(this.searchText).search()
  }

}

