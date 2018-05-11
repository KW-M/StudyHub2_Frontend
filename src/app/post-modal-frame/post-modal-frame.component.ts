import { Component, OnInit, ElementRef, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, style, animate, transition, query } from '@angular/animations';

import { WindowService } from "../services/window.service";
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { ExternalApisService } from "../services/external-apis.service";


@Component({
  selector: 'app-post-modal-frame',
  templateUrl: './post-modal-frame.component.html',
  styleUrls: ['./post-modal-frame.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modalTransitions', [
      state('closed', style({ transform: 'translateY(0)', right: 'auto', bottom: 'auto', display: 'none' })),
      state('open-docked', style({ transform: 'translateY(0)', bottom: 0, 'border-radius': '7.5px 7.5px 0 0', })),
      state('open-centered', style({ transform: 'scale(1)', opacity: 1, 'border-radius': '7.5px', })),
      transition('closed => open-centered', [
        style({ transform: 'scale(0)', opacity: 0.8 }),
        animate('250ms ease')
      ]),
      transition('closed => open-docked', [
        style({ transform: 'translateY(100%)', right: '20px', bottom: 0 }),
        animate('400ms ease')
      ]),
      transition('open-centered => closed', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('300ms ease', style({ transform: 'scale(0.2)', opacity: 0 }))
      ]),
      transition('open-docked => closed', [
        style({ transform: 'translateY(0)', right: '20px', bottom: 0 }),
        animate('400ms ease', style({ transform: 'translateY(90%) scale(0.5)', bottom: 0 }))
      ]),
      transition('open-centered => open-docked', [
        style({ width: '420px' }),
        animate('300ms ease')
      ]),
      transition('open-docked => open-centered', [
        style({ right: '20px' }),
        animate('300ms ease')
      ]),
    ]),
  ],
})
export class PostModalFrameComponent {
  hidden: boolean;
  modalOpenState: string = 'closed';
  postAction: string = '';
  inputPost;
  constructor(public EventBoard: EventBoardService, public componentElem: ElementRef, private changeDetector: ChangeDetectorRef) {
    EventBoard.postModal$.subscribe(inputPostObj => {
      if (this.modalOpenState === 'closed' && inputPostObj.postObj !== undefined) {
        this.inputPost = Object.assign({
          "id": null,
          "title": "",
          "link": "",
          "description": "",
          "likeUsers": [],//<-
          "viewCount": 0,//<-
          "ranking": 0,//<-
          "labels": [],
          "classes": [],
          "creator": {
            "email": null,
            "name": null,
          },
          "attachmentName": null,
          "flagged": false,
          "creationDate": new Date(),
          "updateDate": new Date(),
        }, inputPostObj.postObj || {});
        this.postAction = inputPostObj.action;
        this.hidden = false;
        if (this.postAction === 'edit' && !this.inputPost['id']) {
          this.modalOpenState = 'open-docked'
        } else {
          this.modalOpenState = 'open-centered'
        }
      } else if (inputPostObj.action === 'close' || inputPostObj.action === 'hide') {
        this.modalOpenState = 'closed'
        this.hidden = inputPostObj.action === 'hide'
        this.postAction = inputPostObj.action;
        if (document.activeElement) (document.activeElement as HTMLElement).blur()
      }
      console.log(inputPostObj.action, this.inputPost)
      this.changeDetector.detectChanges();
    });
  }

}
