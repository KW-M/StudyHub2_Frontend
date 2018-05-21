import { Component, ViewEncapsulation, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef } from '@angular/core';

import { WindowService } from "../../services/window.service";
import { EventBoardService } from "../../services/event-board.service";
import { GoogleSigninService } from "../../services/google-signin.service";
import { DataHolderService } from "../../services/data-holder.service";
import { AlgoliaApisService } from '../../services/algolia-apis.service';
import { first } from 'rxjs/operators';


@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent implements OnDestroy {
  creatorList: any = [];
  favoriteClasses: any;
  formattedYorkClasses: any;
  labelScrollPercentage: number = 0;
  labels: any = [];
  posts: any = [];
  postsGrid;
  gridColumns;
  numOfColumns;
  columnWidth;
  visiblePostsObserver;
  sideNavOpenObserver;
  findTags;
  classFilters = [];
  classSearchText = '';
  creatorFilter = '';
  findClass = '';

  constructor(public EventBoard: EventBoardService,
    private DataHolder: DataHolderService,
    private AlgoliaApis: AlgoliaApisService,
    public WindowFrame: WindowService,
    private ChangeDetector: ChangeDetectorRef,
    private nativeElementRef: ElementRef) {
    this.DataHolder.startupCompleteState$.pipe(first()).toPromise().then(() => {
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

      this.visiblePostsObserver = this.DataHolder.visiblePostsState$.subscribe((result: any) => {
        if (result) {
          this.posts = result.posts
          this.creatorList = result.facets.creators;
          this.labels = result.facets.labels;
          if (this.posts.length > 0) {
            this.postsGrid = this.getPostsGrid(this.posts, true);
          } else {
            this.postsGrid = [];
          }
          console.log("Displaying page " + result.page + "+1 of " + result.totalPages, {
            result: result,
            grid: this.postsGrid
          });
          this.ChangeDetector.detectChanges();
          this.DataHolder.loadingPosts = false;
        } else {
          this.posts = DataHolder.currentPosts
          this.postsGrid = this.getPostsGrid(this.posts, true);
          this.ChangeDetector.detectChanges();
        }
      })

      var refinements = this.AlgoliaApis.searchHelper.getQueryParameter('disjunctiveFacetsRefinements')
      this.classFilters = refinements.classes || [];
      this.creatorFilter = (refinements['creator.name'] || [''])[0];
      this.ChangeDetector.detectChanges();
    })
    this.DataHolder.classAndGroupState$.pipe(first()).toPromise().then((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      this.ChangeDetector.detectChanges();
      //only put here so that york classes must have loaded>
      this.DataHolder.currentUserState$.subscribe((user: any) => {
        if (user) {
          this.favoriteClasses = []
          for (const favClass in user.favorites) {
            if (user.favorites.hasOwnProperty(favClass)) {
              this.favoriteClasses.push(this.DataHolder.getClassObj(favClass))
            }
          }
          this.ChangeDetector.detectChanges();
        }
      })
    })
  }

  getPostsGrid(inputArray, skipColCheck) {
    var numOfColumns = Math.floor(this.nativeElementRef.nativeElement.clientWidth / 320) || 1;
    this.columnWidth = (this.nativeElementRef.nativeElement.clientWidth - 12) / numOfColumns
    if (skipColCheck || numOfColumns !== this.numOfColumns) {
      this.numOfColumns = numOfColumns;
      var columnArray = [];
      for (let colCounter = 0; colCounter < numOfColumns; colCounter++) {
        columnArray.push([])
      }
      this.gridColumns = columnArray;
      var colCounter = 0;
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

  trackByLabelFn(index, label) {
    return label.label
  }

  // findInString(searchString, text) {
  //   return (text.toLowerCase().indexOf(searchString.toLowerCase()) !== -1)
  // }

  onCreatorFilterInput(searchText) {
    if (searchText && searchText.length > 0) {
      this.AlgoliaApis.searchFacet('creator.name', searchText).then((facetResult) => {
        console.log(facetResult);
        this.creatorList = facetResult.facetHits;
      })
    } else {
      this.filterByCreator(null)
    }
  }

  filterByClass(classNames) {
    this.classFilters = classNames;
    if (this.AlgoliaApis.searchHelper) {
      this.AlgoliaApis.setClassFilter(classNames)
      this.AlgoliaApis.updateURLQueryParams()
      this.AlgoliaApis.runSearch()
    }
  }
  filterByCreator(creatorName) {
    if (this.AlgoliaApis.searchHelper) {
      this.AlgoliaApis.setCreatedByFilter(creatorName)
      this.AlgoliaApis.updateURLQueryParams()
      this.AlgoliaApis.runSearch()
    }
  }
  filterByLabel(labelName) {
    if (this.AlgoliaApis.searchHelper) {
      this.AlgoliaApis.toggleLabelFilter(labelName)
      this.AlgoliaApis.updateURLQueryParams()
      this.AlgoliaApis.runSearch()
    }
  }

  ngOnDestroy() {
    console.log('searchDestoryed')
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
    this.visiblePostsObserver.unsubscribe()
    this.sideNavOpenObserver.unsubscribe()
  }

}



