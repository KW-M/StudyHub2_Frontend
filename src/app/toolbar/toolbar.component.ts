//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { DataHolderService } from '../services/data-holder.service';
import { WindowService } from "../services/window.service";
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent implements OnInit {
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
    public WindowFrame: WindowService,
    private ChangeDetector: ChangeDetectorRef,
  ) {
    this.windowSize = this.WindowFrame.getMediaQueries(null);
    WindowFrame.mdWindowSize$.subscribe(sizes => {
      console.log(sizes);
      this.windowSize = sizes;
      ChangeDetector.detectChanges()
    });
    DataHolder.currentUserState$.subscribe((userObj: any) => {
      console.log(userObj);
      this.user = userObj || { profilePhoto: 'http://studyhub.york.org/images/accountPic.jpg', name: 'York Student', email: ' . . . @york.org' };
      ChangeDetector.detectChanges()
    });
    router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {
      this.searchText = this.router.routerState.snapshot.root.queryParams.query || null;
      ChangeDetector.detectChanges()
    });
  }

  updateSearch(query) {
    clearTimeout(this.throttleTimer['onSearchInput']);
    this.throttleTimer['onSearchInput'] = setTimeout(() => {
      console.log('searching');
      console.log(this.router.navigate(['/all posts'], { queryParams: { 'query': query } }));
    }, 1100)
  }

  clearSearch() {

  }

  toggleSideMenu() {
    this.EventBoard.toggleSideMenuOpen();
  }

  signIn() {
    this.GSignin.handleSignInClick()
  }
  signOut() {
    this.GSignin.handleSignOutClick()
  }

  ngOnInit() {
    this.searchText = this.router.routerState.snapshot.root.queryParams.query || null;
  }

}

