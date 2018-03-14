import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FeedPageComponent } from '../pages/feed-page/feed-page.component';
import { ClassPageComponent } from '../pages/class-page/class-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/feed',
    pathMatch: 'full'
  },
  {
    path: 'feed',
    component: FeedPageComponent
  },
  {
    path: 'bookmarks',
    component: FeedPageComponent
  },
  {
    path: ':class',
    component: ClassPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
