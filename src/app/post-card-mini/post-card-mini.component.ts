import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-post-card-mini',
  templateUrl: './post-card-mini.component.html',
  styleUrls: ['./post-card-mini.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardMiniComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
