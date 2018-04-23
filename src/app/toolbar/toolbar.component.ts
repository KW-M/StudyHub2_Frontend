//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { DataHolderService } from '../services/data-holder.service';
import { WindowService } from "../services/window.service";
import { Router, NavigationEnd } from '@angular/router';
import { ExternalApisService } from '../services/external-apis.service';
import { AlgoliaApisService } from '../services/algolia-apis.service';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent implements OnInit {
  mobileSearchOpen: boolean = false;
  currentPage;
  lastState = {
    sideNavOpen: true,
    page: "Feed"
  };
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
    private AlgoliaApis: AlgoliaApisService,
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
      console.log(this);

      var newPath = this.Router.routerState.snapshot.root.firstChild.url[0].path || "Feed";
      if (newPath !== this.currentPage) this.lastState = {
        page: this.currentPage || "Feed",
        sideNavOpen: this.EventBoard.sideNavOpen,
      };
      if (newPath === 'Search') this.EventBoard.setSideNavOpen(false)
      this.currentPage = newPath
      this.searchText = this.AlgoliaApis.getSearchQuery() || '';
      ChangeDetector.detectChanges()
    });
  }

  updateSearch(query) {
    console.log(query);
    this.AlgoliaApis.searchHelper.setQuery(query)
    this.AlgoliaApis.updateURLQueryParams()
    this.AlgoliaApis.runSearch()
  }

  clearSearch() {
    this.searchText = ''
    this.AlgoliaApis.searchHelper.setQuery('')
    this.ChangeDetector.detectChanges()
  }

  setSearchModeOpen(open) {
    if (open === true && this.currentPage !== 'Search') {
      this.Router.navigate(['Search'], { queryParamsHandling: 'preserve' })
    } else if (open === false) {
      this.clearSearch()
      console.log(this.lastState)
      this.Router.navigate([this.lastState.page || "Feed"], { queryParamsHandling: 'preserve' })
      this.EventBoard.setSideNavOpen(this.lastState.sideNavOpen)
    }
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
    this.searchText = this.AlgoliaApis.getSearchQuery() || '';
  }
}

