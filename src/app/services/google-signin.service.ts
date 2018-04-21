import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { HttpClient } from "@angular/common/http";
import { timeout } from "rxjs/operator/timeout";
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
    // gapi.client.init({
    //   apiKey: "AIzaSyDspTvXbOLF-3jBKJbZ9ZDPkdWIkmaGQOk",
    //   clientId: "675428000879-vqiopon2kmg1jtal4jpk8j23fnjk6rv9.apps.googleusercontent.com",
    //   discoveryDocs: ["https://people.googleapis.com/$discovery/rest"],
    //   scope: "profile"
    // })
    gapi.load("auth2", () => {
      setTimeout(() => {
        gapi.auth2.init({
          client_id: "191304458473-pkjgflqvuk0n7u7q3smb5r7ul6l3cevn.apps.googleusercontent.com",
          hosted_domain: "york.org",
          scope: "profile https://www.googleapis.com/auth/drive"
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
      if (isSignedIn) {
        // We need to register an Observer on Firebase Auth to make sure auth is initialized.
        var authStateUnsubscribe = this.FirebaseAuth.auth.onAuthStateChanged((firebaseUser) => {
          authStateUnsubscribe()
          console.log(firebase.auth);

          // Check if we are already signed-in Firebase with the correct user.
          if (!isUserEqual(gapi.auth2.getAuthInstance().currentUser.get(), firebaseUser)) {
            // Build Firebase credential with the Google ID token.
            var credential = firebase.auth.GoogleAuthProvider.credential(this.getGUserToken());
            // Sign in with credential from the Google user.
            firebase.auth().signInWithCredential(credential).catch(function (error) {
              console.log(error);
            });
          } else {
            console.log('User already signed-in Firebase.');
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
    this.FirebaseAuth.auth.signOut().then(console.log);
  }
}