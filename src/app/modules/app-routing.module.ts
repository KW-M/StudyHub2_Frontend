import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FeedPageComponent } from '../pages/feed-page/feed-page.component';
import { ClassPageComponent } from '../pages/class-page/class-page.component';
import { SearchPageComponent } from '../pages/search-page/search-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/Feed',
    pathMatch: 'full'
  },
  {
    path: 'Feed',
    component: FeedPageComponent
  },
  {
    path: 'Bookmarks',
    component: ClassPageComponent
  },
  {
    path: 'Search',
    component: SearchPageComponent
  },
  {
    path: ':class',
    component: ClassPageComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
