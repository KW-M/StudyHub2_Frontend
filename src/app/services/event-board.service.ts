import { Injectable } from "@angular/core";
import { Router,NavigationEnd } from '@angular/router';
import "rxjs/add/operator/filter";
import { Subject } from "rxjs/Subject";

@Injectable()
export class EventBoardService {
  constructor(private router: Router) {
    // router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {

    // });
  }
  private sideMenuOpen: boolean = true;
  private sideMenuOpenSource = new Subject<boolean>();
  sideMenuOpen$ = this.sideMenuOpenSource.asObservable();
  setSideMenuOpen(open: boolean) {
      this.sideMenuOpen = open;
      this.sideMenuOpenSource.next(open);
  }
  toggleSideMenuOpen() {
    this.sideMenuOpen = !this.sideMenuOpen;
    this.sideMenuOpenSource.next(this.sideMenuOpen);
  }
  private postModalSource = new Subject<any>();
  postModal$ = this.postModalSource.asObservable();
  openPostModal(postObj:any,action:string) {
    this.postModalSource.next({'action':action,'postObj':postObj});
  }
  closePostModal() {
    this.postModalSource.next({'action':'close'});
  }

  // private appLoadedSource = new Subject<boolean>();
  // appLoaded$ = this.appLoadedSource.asObservable();
  // setAppLoaded(appLoaded: boolean) {
  //   this.appLoadedSource.next(appLoaded);
  // }
}
