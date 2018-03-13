import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild , ElementRef } from '@angular/core';
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
  posts: any = [];
  postsGrid;
  gridColumns;
  numOfColumns;
  columnWidth;
  visiblePostsObserver;
  sideNavOpenObserver;
  findTags;
  findClass;
  constructor(private DataHolder: DataHolderService, private EventBoard: EventBoardService, private ChangeDetector: ChangeDetectorRef, private nativeElementRef: ElementRef) {
    this.visiblePostsObserver = DataHolder.visiblePostsState$.subscribe((posts) => {
      this.posts = posts;
      console.log(posts);
      this.postsGrid = this.getPostsGrid(this.posts);
      ChangeDetector.detectChanges();
    })
  }

  ngOnInit() {
    window.onresize = () => {
      this.postsGrid = this.getPostsGrid(this.posts) || this.postsGrid;
      this.ChangeDetector.detectChanges();
    };
    this.sideNavOpenObserver = this.EventBoard.sideNavOpen$.subscribe(()=>{
      this.postsGrid = this.getPostsGrid(this.posts) || this.postsGrid;
      this.ChangeDetector.detectChanges();
    })
  }

  setLinkPreview(preview, uiPost) {
    this.posts.forEach(post => {
      if (post.id === uiPost.id) post['linkPreview'] = preview;
    });
    console.log(this.posts)
  }

  getPostsGrid(inputArray) {
    var numOfColumns = Math.floor(this.nativeElementRef.nativeElement.clientWidth / 320);
    this.columnWidth = (this.nativeElementRef.nativeElement.clientWidth - 12) / numOfColumns
    if (numOfColumns !== this.numOfColumns) {
      this.numOfColumns = numOfColumns
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

  ngOnDestroy() {
    // this.ChangeDetector.detach(); // try this
    console.log('classDestoryed')
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
    this.visiblePostsObserver.unsubscribe();
    this.sideNavOpenObserver.unsubscribe()
  }
}
