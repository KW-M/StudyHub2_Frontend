import { Component, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ExternalApisService } from '../../services/external-apis.service';
import { StudyhubServerApisService } from '../../services/studyhub-server-apis.service';
import { DataHolderService } from '../../services/data-holder.service';
import { first } from 'rxjs/operators';
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
      this.DataHolder.currentUserState$.pipe(first()).toPromise().then((userObj) => {
        setTimeout(() => {
          this.quizletUsername = this.DataHolder.quizletUsername;

          this.ChangeDetector.detectChanges()
        }, 1200)
      })
    }
  }

  onInput(inputValue) {
    clearTimeout(this.debounce)
    this.debounce = setTimeout(() => {
      if (inputValue) this.ExternalAPIs.quizletUserSearch(inputValue).then((searchResult: any) => {
        console.log('Quizlet API Search Result: ', searchResult)
        this.quizletUserAutocomplete = searchResult.items.filter(element => {
          return element.type === "user"
        })
        this.ChangeDetector.detectChanges()
      });
    }, 300)
  }

  onSubmit(username) {
    if (window.confirm("Is " + username + " your York Quizlet account?")) {
      this.ServerAPIs.setQuizletUsername(username).then(() => {
        console.log('Submitted Quizlet Username: ', username)
        this.quizletUsername = username
        this.ChangeDetector.detectChanges()
      })
      this.openQuizlet()
    }
  }

  deleteUsername() {
    if (window.confirm("Are you sure? York Quizlet is helpful because students like you keep sharing their flashcards.")) this.ServerAPIs.setQuizletUsername("").then((() => {
      alert("Sharing Paused.")
    }))
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
  }
}
