//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ElementRef, ViewChild, NgZone, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { EventBoardService } from "../services/event-board.service";
import { DataHolderService } from "../services/data-holder.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent implements OnInit {
  sidenavOpen: boolean = false;
  touchDragStartPos: number; //Variable to be x postion of a touchDown
  //Variables to be HTML Element Refrences.
  sideNavElm;
  sideNavOverlayElm;
  sideNavContainerElm;

  sideNavDimensions;
  @ViewChild('stickyHeader') stickyHeaderElm: ElementRef;

  showAllClasses: boolean = true;
  showAllGroups: boolean = false;
  editingFavorites: boolean = false;
  stickyHeaderOffset: number = null;
  classSearchText: string;

  signedinUser: any;
  yorkGroups = {};
  formattedYorkClasses: Array<any> = [];
  favoriteClasses: Array<any> = [];
  throttleTimer = {

  };

  constructor(private EventBoard: EventBoardService, private ServerAPIs: StudyhubServerApisService, private DataHolder: DataHolderService, public sideNavComponentElem: ElementRef, private zone: NgZone, private ChangeDetector: ChangeDetectorRef, private Router: Router) {
    //Get notified by the event board service of the sideNavOpen Observable and set it to the local variable sidenavOpen.
    EventBoard.sideNavOpen$.subscribe((open) => {
      this.sidenavOpen = open;
      this.ChangeDetector.detectChanges();
    });

    DataHolder.classAndGroupState$.pipe(first()).toPromise().then((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      this.yorkGroups = classesAndGroups['groups'];
      this.ChangeDetector.detectChanges();
    });

    DataHolder.currentUserState$.subscribe((user) => {
      if (user) {
        this.favoriteClasses = user['favorites'] || {};
        this.ChangeDetector.detectChanges();
      }
    })
  }


  ngOnInit() {
    this.EventBoard.setSideNavOpen(window.matchMedia("(min-width: 960px)").matches) //sync the initial state with the eventboard service
    window.matchMedia("(min-width: 960px)").addListener((event) => {
      if (window.location.pathname !== "/Search") this.EventBoard.setSideNavOpen(event.matches)
    });
    //Establish Element refrences.
    this.sideNavContainerElm = this.sideNavComponentElem.nativeElement.children[0];
    this.sideNavElm = this.sideNavContainerElm.children[0];
    this.sideNavOverlayElm = this.sideNavContainerElm.children[1];
    this.zone.runOutsideAngular(() => {
      // Watch for touchStarts on the left 20px of screen (left edge drag).
      document.ontouchstart = (event: any) => {
        if (event.touches[0].clientX < 20) this.touchStart(event);
      };
      document.ontouchmove = (event) => {
        if (this.touchDragStartPos < 20) this.touchDrag(event);
      };
      document.ontouchend = (event) => {
        if (this.touchDragStartPos < 20) this.touchEnd(event);
      };
      //Watch for touches on the opened sidenav
      this.sideNavContainerElm.ontouchstart = (event) => { this.touchStart(event); };
      this.sideNavContainerElm.ontouchmove = (event) => { this.touchDrag(event); };
      this.sideNavContainerElm.ontouchend = (event) => { this.touchEnd(event); };
      //Watch for scroll on sidenav
      this.sideNavElm.onscroll = (event) => { this.sidenavScroll(event) }
    })
  }

  touchStart(touchEvent) {
    this.touchDragStartPos = touchEvent.targetTouches[0].clientX;
    this.sideNavDimensions = this.sideNavElm.getBoundingClientRect();
    this.sideNavContainerElm.classList.add('draging');
    document.body.style.overflow = 'hidden';
  }
  touchDrag(touchEvent) {
    var newSideNavPos = Math.round(this.sideNavDimensions.left + touchEvent.targetTouches[0].clientX - this.touchDragStartPos);
    if (newSideNavPos <= 2) {
      this.sideNavOverlayElm.style.opacity = (0.6 - (-newSideNavPos * 0.6 / this.sideNavDimensions.width));
      this.sideNavElm.style.left = newSideNavPos + 'px';
    }
  }
  touchEnd(touchEvent) {
    this.sideNavDimensions = this.sideNavElm.getBoundingClientRect();
    this.zone.run(() => {
      if (this.sidenavOpen && (-this.sideNavDimensions.left > this.sideNavDimensions.width / 4)) {
        this.EventBoard.setSideNavOpen(false);
      } else if (!this.sidenavOpen && (-this.sideNavDimensions.left < this.sideNavDimensions.width - (this.sideNavDimensions.width / 4))) {
        this.EventBoard.setSideNavOpen(true);
      }
    })
    this.sideNavContainerElm.classList.remove('draging');
    this.sideNavElm.style.left = null;
    this.sideNavOverlayElm.style.opacity = null;
    document.body.style.overflow = 'auto';
    this.touchDragStartPos = undefined;
  }

  trackByClassNameFn(index, classObj) {
    return classObj.name
  }

  sidenavScroll(event) {
    let topPadding = parseFloat(window.getComputedStyle(event.target).getPropertyValue('padding-top'));
    if (this.stickyHeaderOffset === null && (event.target.scrollTop >= this.stickyHeaderElm.nativeElement.offsetTop - topPadding)) {
      this.stickyHeaderOffset = this.stickyHeaderElm.nativeElement.offsetTop - topPadding;
      this.stickyHeaderElm.nativeElement.classList.add('sticky-header-stuck')
      this.stickyHeaderElm.nativeElement.style.top = topPadding + 'px';
    } else if (this.stickyHeaderOffset !== null && (event.target.scrollTop < this.stickyHeaderOffset)) {
      this.stickyHeaderOffset = null;
      this.stickyHeaderElm.nativeElement.classList.remove('sticky-header-stuck')
      this.stickyHeaderElm.nativeElement.style.top = 'unset';
    }
  }

  setFavorite(className) {
    const serverSync = () => {
      this.ServerAPIs.setFavorites(this.favoriteClasses).then((serverResponse) => {
        this.DataHolder.updateCurrentUserObserver({ favorites: this.favoriteClasses })
        console.log(serverResponse)
      }).catch((e) => {
        console.warn(e);
        serverSync();
      })
    }
    if (this.editingFavorites) {
      if (this.favoriteClasses[className]) {
        delete this.favoriteClasses[className];
      } else {
        this.favoriteClasses[className] = true;
      }
      clearTimeout(this.throttleTimer['onFavorite']);
      this.throttleTimer['onFavorite'] = setTimeout(serverSync, 1000)
    }
  }

  onClassSearchInput(event) {
    const searchText = event.target.value;
    if (searchText !== this.classSearchText) {
      this.classSearchText = searchText;
      this.formattedYorkClasses.forEach(category => {
        category.classes.forEach(function (classObj) {
          if (classObj.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1) {
            classObj.hidden = true;
          } else {
            classObj.hidden = undefined;
          }
        })
      });
      for (const groupName in this.yorkGroups) {
        if (groupName.toLowerCase().indexOf(searchText.toLowerCase()) === -1) {
          this.yorkGroups[groupName].hidden = true;
        } else {
          delete this.yorkGroups[groupName].hidden;
        }
      }
      if (this.showAllClasses === false) this.showAllClasses = true
      if (this.showAllGroups === false) this.showAllGroups = true
    }
    //clearTimeout(this.throttleTimer['onLabelAndClassSearchInput']);
  }

  openQuizlet() {
    if (this.DataHolder.quizletUsername) {
      window.open('https://quizlet.com/join/nVZb4UAU9')
    }
  }

  addGroup() {
    var groupName = prompt("Enter a name for this group", "");
    if (groupName != null && groupName.length !== 0) {
      this.ServerAPIs.addGroup(groupName).then((resp) => {
        console.log(this.DataHolder.yorkGroups);
        this.DataHolder.yorkGroups[groupName] = { creator: "Me" }
        this.yorkGroups[groupName] = { creator: "Me" }
        this.ChangeDetector.detectChanges()
      }).catch(console.warn)
    }
  }

  closeSideNav() {
    this.EventBoard.setSideNavOpen(false);
  }
  openSideNav() {
    this.EventBoard.setSideNavOpen(true);
  }
}
