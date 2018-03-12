import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss','../post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent implements OnInit {
  @Input('input-post') inputPost;
  postBodyTextShown: boolean = false;
  currentPost;
  constructor() {
  }

  ngOnInit() {
    this.currentPost = Object.assign({
      "id": null,
      "title": "",
      "link": "",
      "type": "noLink",
      "description": "",
      "likes": [],
      "labels": [],
     // "teachers": [],
      "classes": [],//<-
      "creator": {
        "email": null,
        "name": null
      },
      "flagged": false,
      "creationDate": new Date().getSeconds(),
      "updateDate": new Date().getSeconds(),
    }, this.inputPost);
  }

}