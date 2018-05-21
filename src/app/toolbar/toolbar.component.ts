//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { DataHolderService } from '../services/data-holder.service';
import { WindowService } from "../services/window.service";
import { Router, NavigationEnd } from '@angular/router';
import { ExternalApisService } from '../services/external-apis.service';
import { AlgoliaApisService } from '../services/algolia-apis.service';
import { filter, first } from 'rxjs/operators';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent {
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
    photoURL: 'assets/defaultAccount.jpg',
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
      this.user = userObj || { photoURL: 'assets/defaultAccount.jpg', name: 'York Student', email: ' . . . @york.org' };
      ChangeDetector.detectChanges()
    });
    Router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((newRoute) => {
      var newPath = this.Router.routerState.snapshot.root.firstChild.url[0].path || "Feed";
      if (newPath !== this.currentPage) this.lastState = {
        page: this.currentPage || "Feed",
        sideNavOpen: this.EventBoard.sideNavOpen,
      };
      if (newPath === 'Search') this.EventBoard.setSideNavOpen(false)
      this.currentPage = newPath
      this.DataHolder.startupCompleteState$.pipe(first()).toPromise().then(() => {
        this.searchText = this.AlgoliaApis.getSearchQuery() || '';
      })
      ChangeDetector.detectChanges()
    });
    this.DataHolder.startupCompleteState$.pipe(first()).toPromise().then(() => {
      this.searchText = this.AlgoliaApis.getSearchQuery() || '';
      this.ChangeDetector.detectChanges()
    })
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
      console.log('searchOpening');
      if (this.currentPage !== "All Posts" && this.currentPage !== "My Posts" && this.currentPage !== "Bookmarks" && this.currentPage !== "Feed") {
        this.AlgoliaApis.setClassFilter([this.currentPage])
      } else {
        this.AlgoliaApis.clearFilter('classes')
      }
      this.Router.navigate(['Search'], { queryParamsHandling: 'preserve' }).then(() => { this.AlgoliaApis.updateURLQueryParams() })
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

  openFeedback() {
    var top = (window.innerHeight || document.documentElement.clientHeight || screen.height) / 2 + (window.screenTop || window.screenY) - 300;
    var left = (window.innerWidth || document.documentElement.clientWidth || screen.width) / 2 + (window.screenLeft || window.screenX) - 300;
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSctToJKWAnKR_Y0alWolQtreBJP-GLlxsD20zbAYgKaMcVXNQ/viewform?usp=sf_link', "_blank", 'status=no,menubar=no,toolbar=no,width=600,height=600,top=' + top + ',left=' + left)
  }

  // signIn() {
  //   this.GSignin.handleSignInClick()
  // }

  signOut() {
    this.GSignin.handleSignOutClick()
  }
}

