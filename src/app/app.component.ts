import { Component, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-toolbar></app-toolbar>
    <app-sidenav></app-sidenav>
    <app-speeddial></app-speeddial>
    <app-post-modal-frame></app-post-modal-frame>
    <div class="main-content">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

}
      // <app-new-post-bar></app-new-post-bar>
      // <app-post-card></app-post-card>
      // <app-class-page></app-class-page>
      // <app-feed-page></app-feed-page>
