import { environment } from '../environments/environment';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './modules/app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModule } from './modules/angular-material.module';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'

import { WindowService } from './services/window.service';
import { EventBoardService } from './services/event-board.service';
import { DataHolderService } from './services/data-holder.service';
import { GoogleSigninService } from './services/google-signin.service';
import { ExternalApisService } from './services/external-apis.service';
import { StudyhubServerApisService } from './services/studyhub-server-apis.service';

import { AppComponent } from './app.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SpeeddialComponent } from './speeddial/speeddial.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { PostModalFrameComponent } from './post-modal-frame/post-modal-frame.component';
import { PostEditViewComponent } from './post-edit-view/post-edit-view.component';
import { PostCardComponent } from './post-card/post-card.component';
import { PostCardMiniComponent } from './post-card-mini/post-card-mini.component';
import { NewPostBarComponent } from './new-post-bar/new-post-bar.component';

import { ScrollToElementDirective } from './directives/scroll-to-element.directive';
import { FeedPageComponent } from './pages/feed-page/feed-page.component';
import { ClassPageComponent } from './pages/class-page/class-page.component';
import { SigninPromptComponent } from './signin-prompt/signin-prompt.component';

@NgModule({
  declarations: [
    AppComponent,
    ToolbarComponent,
    SpeeddialComponent,
    SidenavComponent,
    PostModalFrameComponent,
    PostEditViewComponent,
    PostCardComponent,
    PostCardMiniComponent,
    NewPostBarComponent,
    ScrollToElementDirective,
    FeedPageComponent,
    ClassPageComponent,
    SigninPromptComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: false }), //environment.production
    AngularFireModule.initializeApp(environment.firebase), // imports firebase/app needed for everything
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features,
    AngularFireStorageModule // imports firebase/storage only needed for storage features
  ],
  providers: [
    WindowService,
    EventBoardService,
    DataHolderService,
    GoogleSigninService,
    ExternalApisService,
    StudyhubServerApisService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
