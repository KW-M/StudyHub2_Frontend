import { Component, ViewEncapsulation, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef } from '@angular/core';
import { connectHits } from 'instantsearch.js/es/connectors';
import { connectRefinementList } from 'instantsearch.js/es/connectors';

import { WindowService } from "../../services/window.service";
import { EventBoardService } from "../../services/event-board.service";
import { GoogleSigninService } from "../../services/google-signin.service";
import { DataHolderService } from "../../services/data-holder.service";
import { StudyhubServerApisService } from '../../services/studyhub-server-apis.service';
import { ExternalApisService } from '../../services/external-apis.service';


@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent implements OnDestroy {
  classRefinementstate: any;
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
  findClass;

  constructor(public EventBoard: EventBoardService,
    private DataHolder: DataHolderService,
    private ExternalAPIs: ExternalApisService,
    public WindowFrame: WindowService,
    private ChangeDetector: ChangeDetectorRef,
    private nativeElementRef: ElementRef) { }

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

    this.labelsObserver = this.DataHolder.labelsState$.subscribe((labels) => {
      for (var key in labels) {
        labels[key].label = key;
        this.labels.push(labels[key]);
      }
      this.ChangeDetector.detectChanges();
    })
    // Create a widget which will run the function whenever
    // something changes on the search state itself
    const widget = connectHits((state, isFirstRendering) => {
      console.log(state);
      var updatePosts = () => {
        if (state && state.hits) {
          this.posts = state.hits;
          if (this.posts.length > 0) {
            this.postsGrid = this.getPostsGrid(this.posts, true);
          } else {
            this.postsGrid = [];
          }
          console.log("final Postgrid", this.postsGrid);
          this.ChangeDetector.detectChanges();
        }
      }
      // asynchronous update of the state
      // avoid `ExpressionChangedAfterItHasBeenCheckedError`
      if (isFirstRendering) {
        return Promise.resolve().then(() => {
          updatePosts()
        });
      } else {
        updatePosts()
      }
    });
    const classWidget = connectRefinementList((state, isFirstRendering) => {
      // asynchronous update of the state
      // avoid `ExpressionChangedAfterItHasBeenCheckedError`
      if (isFirstRendering) {
        return Promise.resolve(null).then(() => {
          this.classRefinementstate = state;
        });
      }
      this.classRefinementstate = state;
    });
    // Register the Hits widget into the instantSearchService search instance.
    this.ExternalAPIs.algoliaSearch.addWidget(widget());
    this.ExternalAPIs.algoliaSearch.addWidget(widget({
      attributeName: 'category'
    }));
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

  trackByPostIdFn(index, post) {
    return post.id
  }

  updateSearchClass(className) {
    // index.search({
    //   filters: 'device:smartphone AND display:retina'
    // });
  }

  ngOnDestroy() {
    console.log('searchDestoryed')
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
    this.sideNavOpenObserver.unsubscribe()
  }

}



