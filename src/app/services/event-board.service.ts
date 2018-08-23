import { Injectable } from "@angular/core";
import { Router } from '@angular/router';
import { Subject } from "rxjs";

@Injectable()
export class EventBoardService {
  constructor(private router: Router) {

  }
  sideNavOpen: boolean = true;
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
  openPostModal(postObj: any, action: string) {
    this.postModalSource.next({ 'action': action, 'postObj': postObj });
  }
  closePostModal() {
    this.postModalSource.next({ 'action': 'close' });
  }
}
