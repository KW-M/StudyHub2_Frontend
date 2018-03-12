import { Injectable } from "@angular/core";
import { Router,NavigationEnd } from '@angular/router';
import "rxjs/add/operator/filter";
import { Subject } from "rxjs/Subject";

@Injectable()
export class EventBoardService {
  constructor(private router: Router) {
    // router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {});
  }
  private sideNavOpen: boolean = true;
  private sideNavOpenSource = new Subject<boolean>();
  sideNavOpen$ = this.sideNavOpenSource.asObservable();
  setSideNavOpen(open: boolean) {
      this.sideNavOpen = open;
      this.sideNavOpenSource.next(open);
  }
  toggleSideNavOpen() {
    this.sideNavOpen = !this.sideNavOpen;
    this.sideNavOpenSource.next(this.sideNavOpen);
  }
  private postModalSource = new Subject<any>();
  postModal$ = this.postModalSource.asObservable();
  openPostModal(postObj:any,action:string) {
    this.postModalSource.next({'action':action,'postObj':postObj});
  }
  closePostModal() {
    this.postModalSource.next({'action':'close'});
  }
}
