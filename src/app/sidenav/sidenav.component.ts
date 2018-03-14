//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ElementRef, ViewChild, NgZone, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { WindowService } from "../services/window.service";
import { EventBoardService } from "../services/event-board.service";
import { DataHolderService } from "../services/data-holder.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
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
  filteredClasses: Array<any> = [];
  filteredGroups: Array<any> = [];
  favoriteClasses: Array<any> = [];
  throttleTimer = {

  };

  constructor(private EventBoard: EventBoardService, private ServerAPIs: StudyhubServerApisService, private DataHolder: DataHolderService, public sideNavComponentElem: ElementRef, private zone: NgZone, private changeDetector: ChangeDetectorRef) {
    //Get notified by the event board service of the sideNavOpen Observable and set it to the local variable sidenavOpen.
    EventBoard.sideNavOpen$.subscribe((open) => {
      this.sidenavOpen = open;
      this.changeDetector.detectChanges();
    });

    DataHolder.classAndGroupState$.subscribe((classesAndGroups) => {
      if (this.filteredClasses.length === 0) {
        this.showAllClasses = false;
        this.filteredClasses = classesAndGroups['classes'];
        this.filteredGroups = classesAndGroups['groups'];
      }
      this.favoriteClasses = classesAndGroups['favorites'];
      this.changeDetector.detectChanges();
    });
  }


  ngOnInit() {
    this.EventBoard.setSideNavOpen(window.matchMedia("(min-width: 960px)").matches) //sync the initial state with the eventboard service
    window.matchMedia("(min-width: 960px)").addListener((event) => {
      this.EventBoard.setSideNavOpen(event.matches)
    });
    //Establish Element refrences.
    this.sideNavContainerElm = this.sideNavComponentElem.nativeElement.children[0];
    this.sideNavElm = this.sideNavContainerElm.children[0];
    this.sideNavOverlayElm = this.sideNavContainerElm.children[1];
    this.zone.runOutsideAngular(() => {
      // Watch for touchStarts on the left 20px of screen (left edge drag).
      document.ontouchstart = (event) => {
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

  setFavorite(classObj) {
    const serverSync = () => {
      this.ServerAPIs.setFavorites(this.favoriteClasses).toPromise().then((serverResponse) => {
        console.log(serverResponse)
        if (serverResponse['errors'] === 0 && serverResponse['changes'][0]) {
          if (this.favoriteClasses != serverResponse['changes'][0].new_val.favorites) {
            this.DataHolder.updateFavorites(this.favoriteClasses)
          } else {
            serverSync();
          }
        }
      })
    }
    if (this.editingFavorites) {
      if (classObj.userFavorite === true) {
        classObj.userFavorite = false;
        this.favoriteClasses.splice(this.favoriteClasses.indexOf(classObj.name), 1);
      } else {
        classObj.userFavorite = true
        this.favoriteClasses.push(classObj.name);
      }
      clearTimeout(this.throttleTimer['onFavorite']);
      this.throttleTimer['onFavorite'] = setTimeout(serverSync, 1000)
    }
  }

  onClassSearchInput(event) {
    const searchText = event.target.value;
    if (searchText !== this.classSearchText) {
      this.classSearchText = searchText;
      if (this.showAllClasses === false) this.showAllClasses = true
      if (this.showAllGroups === false) this.showAllGroups = true
      this.filteredClasses = this.DataHolder.yorkClasses.filter(function (classObj) {
        return !(classObj.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1)
      })
      this.filteredGroups = this.DataHolder.yorkGroups.filter(function (group) {
        return !(group.toLowerCase().indexOf(searchText.toLowerCase()) === -1)
      })
    }
    //clearTimeout(this.throttleTimer['onLabelAndClassSearchInput']);
  }

  closeSideNav() {
    this.EventBoard.setSideNavOpen(false);
  }
  openSideNav() {
    this.EventBoard.setSideNavOpen(true);
  }
}
