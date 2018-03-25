import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { GoogleSigninService } from '../services/google-signin.service';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-signin-prompt',
  templateUrl: './signin-prompt.component.html',
  styleUrls: ['./signin-prompt.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigninPromptComponent implements OnInit {
  gauthLoaded: boolean = false;
  yoloFailed: boolean = false;
  dialogShown: boolean = false;
  buttonShown: boolean = false;
  bgShown: boolean = true;
  constructor(private GSignin: GoogleSigninService, private FireAuth: AngularFireAuth, ChangeDetector: ChangeDetectorRef) {
    GSignin.signinProgress$.subscribe((message) => {
      switch (message) {
        case 'gauthLoaded':
          this.gauthLoaded = true
          break;
        case 'yoloFailed':
          this.yoloFailed = true;
          break;
        case 'notSignedIn':
          console.log('not');
          this.dialogShown = true; this.buttonShown = true;
          break;
        case 'showDialog':
          this.dialogShown = true;
          break;
      }
      if (this.gauthLoaded && this.yoloFailed) this.dialogShown = true; this.buttonShown = true;
      ChangeDetector.detectChanges()
    })
    FireAuth.authState.subscribe((authState) => {
      console.log(authState);
    })
  }

  ngOnInit() {

  }
  signin() {
    this.GSignin.handleSignInClick()
  }
}
