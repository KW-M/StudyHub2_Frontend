import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ExternalApisService } from '../../services/external-apis.service';
import { StudyhubServerApisService } from '../../services/studyhub-server-apis.service';
import { DataHolderService } from '../../services/data-holder.service';
// import { DataHolderService } from '../../services/data-holder.service';
// import { EventBoardService } from '../../services/event-board.service';
// import { Router } from '@angular/router';
// import { AlgoliaApisService } from '../../services/algolia-apis.service';

@Component({
  selector: 'app-quizlet-page',
  templateUrl: './quizlet-page.component.html',
  styleUrls: ['./quizlet-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizletPageComponent implements OnDestroy {
  quizletUsername: any;
  currentUser: any = {};
  debounce: number;
  quizletUserAutocomplete = []
  constructor(private ExternalAPIs: ExternalApisService, private ServerAPIs: StudyhubServerApisService, private DataHolder: DataHolderService, private ChangeDetector: ChangeDetectorRef) {
    if (this.DataHolder.quizletUsername) {
      this.quizletUsername = this.DataHolder.quizletUsername;
    } else {
      // this.ServerAPIs.getQuizletUsername().then((username) => {
      //   this.quizletUsername = username;
      //   this.ChangeDetector.detectChanges()
      // })
    }
  }

  onInput(inputValue) {
    console.log(inputValue)
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => {
      if (inputValue) this.ExternalAPIs.quizletUserSearch(inputValue).then((searchResult: any) => {
        console.log(searchResult);
        this.quizletUserAutocomplete = searchResult.items.filter(element => {
          return element.type === "user"
        })
        console.log(this.quizletUserAutocomplete)
        this.ChangeDetector.detectChanges()
      });
    }, 300)
  }

  onSubmit(username) {
    if (window.confirm("Is " + username + " your York Quizlet account?")) console.log('submittedUserName', username)
    this.ServerAPIs.setQuizletUsername(username).then(() => {
      this.currentUser.quizletUsername = username
      this.ChangeDetector.detectChanges()
    })
  }

  openQuizlet() {
    window.open('https://quizlet.com/join/nVZb4UAU9')
  }

  editUsername() {
    this.quizletUsername = null;
    this.ChangeDetector.detectChanges()
  }

  ngOnDestroy() {
    // for me I was detecting changes inside "subscribe" so was enough for me to just unsubscribe;
    //https://api.quizlet.com/2.0/users/Kyle_Worcester-Moore?client_id=ZvJPu87NPA&whitespace=1
    //https://api.quizlet.com/2.0/search/universal
  }
}
