import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DataHolderService } from '../../services/data-holder.service';


@Component({
  selector: 'app-class-page',
  templateUrl: './class-page.component.html',
  styleUrls: ['./class-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassPageComponent implements OnInit, OnDestroy {
  posts: any = [];
  postsGrid;
  gridColumns;
  visiblePostsObserver;
  findTags;
  findClass;
  constructor(private DataHolder: DataHolderService, private ChangeDetector: ChangeDetectorRef) {
    this.visiblePostsObserver = DataHolder.visiblePostsState$.subscribe((posts) => {
      console.log(posts);
      this.posts = posts;
      this.postsGrid = this.getPostsGrid(this.posts);
      ChangeDetector.markForCheck();
      console.log('visdetectchanges');
      ChangeDetector.detectChanges();
    })
  }

  ngOnInit() {
    // window.onresize = () => {
    //   this.postsGrid = this.getPostsGrid(this.posts);
    //   this.ChangeDetector.detectChanges();
    // };
  }

  submitFind() {
    this.DataHolder.updateSearchFilters({ tags: this.findTags }, 'magic')
  }

  getPostsGrid(inputArray) {
    var numOfColumns = Math.floor(window.innerWidth / 320);
    var columnArray = [];
    for (let colCounter = 0; colCounter < numOfColumns; colCounter++) {
      columnArray.push([])
    }
    this.gridColumns = columnArray;
    var colCounter = 0;
    for (var postCounter = 0; postCounter < inputArray.length; postCounter++) {
      var column = columnArray[colCounter]
      column.push(inputArray[postCounter]);
      colCounter++;
      if (colCounter === numOfColumns) colCounter = 0;
    }
    console.log(columnArray)
    return columnArray
  }

  ngOnDestroy() {
    // this.ChangeDetector.detach(); // try this
    console.log('classDestoryed')
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
     this.visiblePostsObserver.unsubscribe();
  }
}
