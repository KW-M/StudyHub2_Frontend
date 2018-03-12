import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-new-post-bar',
  templateUrl: './new-post-bar.component.html',
  styleUrls: ['./new-post-bar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewPostBarComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
