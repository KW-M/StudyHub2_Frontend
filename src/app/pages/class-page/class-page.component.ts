import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { DataHolderService } from '../../services/data-holder.service';
import { EventBoardService } from '../../services/event-board.service';


@Component({
  selector: 'app-class-page',
  templateUrl: './class-page.component.html',
  styleUrls: ['./class-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassPageComponent implements OnInit, OnDestroy {
  labels: any = [];
  posts: any = [];
  labelScrollPercentage = 0;
  postsGrid;
  gridColumns;
  numOfColumns;
  columnWidth;
  labelsObserver;
  visiblePostsObserver;
  sideNavOpenObserver;
  findTags;
  findClass;
  constructor(private DataHolder: DataHolderService, private EventBoard: EventBoardService, private ChangeDetector: ChangeDetectorRef, private nativeElementRef: ElementRef) {

  }

  ngOnInit() {
    this.visiblePostsObserver = this.DataHolder.visiblePostsState$.subscribe((result: any) => {
      if (result.page === 0) {
        this.posts = result.posts;
      } else {
        this.posts = this.posts.concat(result.posts);
      };
      if (this.posts.length > 0) {
        this.postsGrid = this.getPostsGrid(this.posts, true);
      } else {
        this.postsGrid = [];
      }
      console.log("final Postgrid page" + result.page + "/" + result.totalPages, this.postsGrid);
      this.ChangeDetector.detectChanges();
    })

    window.onresize = () => {
      if (this.posts.length > 0) {
        this.postsGrid = this.getPostsGrid(this.posts, false) || this.postsGrid;
        this.ChangeDetector.detectChanges();
      }
    };

    var labelsScrollElm = document.getElementById('scrollable_class_labels')
    labelsScrollElm.onscroll = () => {
      this.labelScrollPercentage = labelsScrollElm.scrollLeft / (labelsScrollElm.scrollWidth - labelsScrollElm.clientWidth);
      this.ChangeDetector.markForCheck()
    }

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
  }

  getPostsGrid(inputArray, skipColCheck) {
    var numOfColumns = Math.floor(this.nativeElementRef.nativeElement.clientWidth / 320);
    this.columnWidth = (this.nativeElementRef.nativeElement.clientWidth - 12) / numOfColumns
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
  trackByIndex(index, post) {
    return index
  }

  scrollLabels(direction) {
    var labelsScrollElm = document.getElementById('scrollable_class_labels')
    labelsScrollElm.scroll({
      left: labelsScrollElm.scrollLeft + ((direction === 'right') ? labelsScrollElm.clientWidth * 0.6 : -(labelsScrollElm.clientWidth * 0.6)),
      behavior: "smooth"
    })
  }

  ngOnDestroy() {
    //  this.ChangeDetector.detach(); // try this
    console.log('classDestoryed')
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
    this.visiblePostsObserver.unsubscribe();
    this.sideNavOpenObserver.unsubscribe()
  }
}
