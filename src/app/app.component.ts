import { Component, ViewChild, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ExternalApisService } from './services/external-apis.service';

@Component({
  selector: 'app-root',
  template: `
    <app-toolbar></app-toolbar>
    <app-sidenav></app-sidenav>
    <app-speeddial></app-speeddial>
    <app-post-modal-frame></app-post-modal-frame>
    <div class="main-content">
      <router-outlet></router-outlet>
      <app-signin-prompt></app-signin-prompt>
    </div>
  `,
  styleUrls: ['./app.component.scss', './post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  constructor(private ExternalAPIs: ExternalApisService) { }
  ngAfterViewInit() {
    this.ExternalAPIs.algoliaSearch.start();
  }
}
      // <app-new-post-bar></app-new-post-bar>
      // <app-post-card></app-post-card>
      // <app-class-page></app-class-page>
      // <app-feed-page></app-feed-page>
