import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Injectable()
export class GoogleSigninService {
  signedIn: boolean = false;
  serverURLBase: string = 'http://127.0.0.1:3000';
  currentAuthMethod = null;

  private signinStateSource = new Subject();
  signinState$ = this.signinStateSource.asObservable();

  constructor(private http: HttpClient, private zone: NgZone, private FirebaseAuth: AngularFireAuth) {
    setTimeout(() => {
      this.googleAuthInit()
    }, 3)
  }

  googleAuthInit() {
    gapi.load("auth2", () => {
      setTimeout(() => {
        gapi.auth2.init({
          client_id: "848371898392-ghhd3b6ac0ilqddq12d2a96tm7joonpj.apps.googleusercontent.com",
          hosted_domain: "york.org",
          scope: "profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install"
        }).then(() => {
          console.log('gauth innited');
          //Handle the initial sign-in state.
          this.updateGAuthSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          //Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => this.updateGAuthSigninStatus(isSignedIn));
        }).catch((err) => {
          console.warn(err);
          alert("signin error, try again with your york.org account")
        })
      }, 3)
    })
  };

  updateGAuthSigninStatus(isSignedIn) {
    isSignedIn = isSignedIn || false
    console.log("Signedin: ", isSignedIn);
    this.zone.run(() => { //need to get back into angular's detection zone since this function was called from outside (gapi context)
      this.signinStateSource.next(isSignedIn);
      console.log({
        position: 'isSignedIn' + isSignedIn
      }, gapi.auth2.getAuthInstance().currentUser.get());
      if (isSignedIn === true) {
        // We need to register an Observer on Firebase Auth to make sure auth is initialized.
        var authStateUnsubscribe = this.FirebaseAuth.auth.onAuthStateChanged((firebaseUser) => {
          console.log({
            firebase: firebaseUser,
            position: 'firbaseAuthChange'
          }, gapi.auth2.getAuthInstance().currentUser.get());
          authStateUnsubscribe()
          // Check if we are already signed-in Firebase with the correct user.
          if (!isUserEqual(gapi.auth2.getAuthInstance().currentUser.get(), firebaseUser)) {
            // Build Firebase credential with the Google ID token.
            var credential = firebase.auth.GoogleAuthProvider.credential(this.getGUserToken());
            // Sign in with credential from the Google user.
            firebase.auth().signInWithCredential(credential).catch(function (error) {
              console.warn(error);
            });
          } else {
            console.log('User already signed-in to Firebase.');
          }
        });
      }
    })
    function isUserEqual(googleUser, firebaseUser) {
      if (firebaseUser) {
        var providerData = firebaseUser.providerData;
        for (var i = 0; i < providerData.length; i++) {
          if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
            providerData[i].uid === googleUser.getBasicProfile().getId()) {
            // We don't need to reauth the Firebase connection.
            return true;
          }
        }
      }
      return false;
    }
  };

  getGUserToken() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  }

  getProfilePhoto() {
    return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getImageUrl();
  }

  handleSignInClick() {
    gapi.auth2.getAuthInstance().signIn();
    // Ideally the button should only show up after gapi.client.init finishes, so that this handler won't be called before OAuth is initialized.
  }

  handleSignOutClick() {
    if (gapi.auth2) gapi.auth2.getAuthInstance().signOut();
    this.FirebaseAuth.auth.signOut().then(() => {
      var logout = document.createElement("img");
      logout.setAttribute("src", "https://mail.google.com/mail/u/0/?logout&hl=en");
      logout.style.display = "none";
      var logoutImg = document.body.appendChild(logout);
    });

  }
}