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
  dialogShown: boolean = true;
  buttonShown: boolean = false;
  bgShown: boolean = true;
  constructor(private GSignin: GoogleSigninService, private FireAuth: AngularFireAuth, ChangeDetector: ChangeDetectorRef) {
    // GSignin.signinProgress$.subscribe((message) => {
    GSignin.signinState$.subscribe((isGSignedIn) => {
      if (isGSignedIn) {
        this.bgShown = false;
        this.buttonShown = false;
      } else {
        this.bgShown = true;
        this.buttonShown = true;
      }
      ChangeDetector.detectChanges()
    });
    // FireAuth.authState.subscribe((authState) => {
    //   if (authState && authState.email) {
    //     this.bgShown = false; this.buttonShown = true;
    //   } else {
    //     this.bgShown = true; this.dialogShown = true; this.buttonShown = true;
    //   }
    //   ChangeDetector.detectChanges()
    // })
  }

  ngOnInit() {

  }
  signin() {
    this.GSignin.handleSignInClick()
  }
}
