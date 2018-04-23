import { Component, ViewEncapsulation, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef } from '@angular/core';

import { WindowService } from "../../services/window.service";
import { EventBoardService } from "../../services/event-board.service";
import { GoogleSigninService } from "../../services/google-signin.service";
import { DataHolderService } from "../../services/data-holder.service";
import { AlgoliaApisService } from '../../services/algolia-apis.service';


@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent implements OnDestroy {
  favoriteClasses: any;
  formattedYorkClasses: any;
  labelScrollPercentage: number = 0;
  labels: any = [];
  posts: any = [];
  postsGrid;
  gridColumns;
  numOfColumns;
  columnWidth;
  labelsObserver;
  visiblePostsObserver;
  sideNavOpenObserver;
  findTags;
  classFilters = [];
  classSearchText = '';
  findClass = '';

  constructor(public EventBoard: EventBoardService,
    private DataHolder: DataHolderService,
    private AlgoliaApis: AlgoliaApisService,
    public WindowFrame: WindowService,
    private ChangeDetector: ChangeDetectorRef,
    private nativeElementRef: ElementRef) {
    this.DataHolder.classAndGroupState$.first().toPromise().then((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      this.ChangeDetector.detectChanges();
      //only put here so that york classes must ha`  ve loaded>
      this.DataHolder.currentUserState$.subscribe((user: any) => {
        if (user) {
          this.favoriteClasses = []
          for (const favClass in user.favorites) {
            if (user.favorites.hasOwnProperty(favClass)) {
              this.favoriteClasses.push(this.DataHolder.getClassObj(favClass))
            }
          }
          console.log(this.favoriteClasses)
          this.ChangeDetector.detectChanges();
        }
      })
    })
  }

  ngOnInit() {
    window.onresize = () => {
      if (this.posts.length > 0) {
        this.postsGrid = this.getPostsGrid(this.posts, false) || this.postsGrid;
        this.ChangeDetector.detectChanges();
      }
    };

    this.sideNavOpenObserver = this.EventBoard.sideNavOpen$.subscribe(() => {
      if (this.posts.length > 0) {
        this.postsGrid = this.getPostsGrid(this.posts, false) || this.postsGrid;
        this.ChangeDetector.detectChanges();
      }
    })

    var labelsScrollElm = document.getElementById('scrollable_class_labels')
    labelsScrollElm.onscroll = () => {
      this.labelScrollPercentage = labelsScrollElm.scrollLeft / (labelsScrollElm.scrollWidth - labelsScrollElm.clientWidth);
      this.ChangeDetector.markForCheck()
    }

    this.labelsObserver = this.DataHolder.labelsState$.subscribe((labels) => {
      for (var key in labels) {
        labels[key].label = key;
        this.labels.push(labels[key]);
      }
      this.ChangeDetector.detectChanges();
    })

    this.AlgoliaApis.searchHelper.on('result', (searchResult) => {
      console.log('searchResult', searchResult)
    });
  }

  getPostsGrid(inputArray, skipColCheck) {
    var numOfColumns = Math.floor(this.nativeElementRef.nativeElement.clientWidth / 320);
    this.columnWidth = (this.nativeElementRef.nativeElement.clientWidth - 12) / numOfColumns
    console.dir(this.nativeElementRef.nativeElement, numOfColumns);
    if (skipColCheck || numOfColumns !== this.numOfColumns) {
      this.numOfColumns = numOfColumns;
      var columnArray = [];
      for (let colCounter = 0; colCounter < numOfColumns; colCounter++) {
        columnArray.push([])
      }
      this.gridColumns = columnArray;
      var colCounter = 0;
      console.log("final Postgrid colm", columnArray);
      for (var postCounter = 0; postCounter < inputArray.length; postCounter++) {
        var column = columnArray[colCounter]
        column.push(inputArray[postCounter])
        colCounter++;
        if (colCounter === numOfColumns) colCounter = 0;
      }
      return columnArray
    }
    return null
  }

  scrollLabels(direction) {
    var labelsScrollElm = document.getElementById('scrollable_class_labels')
    labelsScrollElm.scroll({
      left: labelsScrollElm.scrollLeft + ((direction === 'right') ? labelsScrollElm.clientWidth * 0.6 : -(labelsScrollElm.clientWidth * 0.6)),
      behavior: "smooth"
    })
  }

  trackByPostIdFn(index, post) {
    return post.id
  }

  updateSearchClass(className) {

  }

  ngOnDestroy() {
    console.log('searchDestoryed')
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
    this.sideNavOpenObserver.unsubscribe()
  }

}



