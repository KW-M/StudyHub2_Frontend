import { Component, ViewEncapsulation, ChangeDetectionStrategy, } from '@angular/core';

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
      <span class="algolia-credit"><span (click)="openCredits()">|Credits| & </span><a href="https://algolia.com" ><img src="https://www.algolia.com/static_assets/images/press/downloads/algolia-mark-blue.png"></a></span>
    </div>
  `,
  styleUrls: ['./app.component.scss', './post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() { }
  openCredits() {
    alert('Designed & Coded by Kyle Worcester-Moore.\nMade posible by York School & Kevin Brookhouser.\nWith help from Jared Aldape, Jack Whilden & The class of 2018!')
  }
}
      // <app-new-post-bar></app-new-post-bar>
      // <app-post-card></app-post-card>
      // <app-class-page></app-class-page>
      // <app-feed-page></app-feed-page>
