import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { HttpClient } from "@angular/common/http";
import { timeout } from "rxjs/operator/timeout";
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

declare var googleyolo: any;


@Injectable()
export class GoogleSigninService {
  signedIn: boolean = false;
  serverURLBase: string = 'http://127.0.0.1:3000';
  currentAuthMethod = null;

  private signinStateSource = new Subject();
  signinState$ = this.signinStateSource.asObservable();

  private signinProgressSource = new Subject();
  signinProgress$ = this.signinProgressSource.asObservable();

  constructor(private http: HttpClient, private zone: NgZone, private FirebaseAuth: AngularFireAuth) {
    let yoloAuthConfig = {
      supportedAuthMethods: [
        "https://accounts.google.com"
      ],
      supportedIdTokenProviders: [
        {
          uri: "https://accounts.google.com",
          clientId: "675428000879-vqiopon2kmg1jtal4jpk8j23fnjk6rv9.apps.googleusercontent.com"
        }
      ]
    }
    let script = document.createElement('script');
    script.src = "https://smartlock.google.com/client";
    document.head['append'](script);
    script.onerror = () => {
      console.log('can\'t load yolo auth');
      this.googleAuthInit()
      /*^fallback to older/basic signin^:*/ this.signinProgressSource.next('yoloFailed')
    };
    window['onGoogleYoloLoad'] = (googleyolo) => {
      googleyolo.retrieve(yoloAuthConfig).then((gUserObj) => {
        console.log(gUserObj)
      }).catch((err) => {
        console.log(err);
        if (err.type = "noCredentialsAvailable") {
          this.signinProgressSource.next('showDialog')
          googleyolo.hint(yoloAuthConfig).then((gUserObj) => {
            console.log(gUserObj)
            gapi.auth2.getAuthInstance().signIn({ prompt: 'none' }).then(console.log).catch(console.log);
          }).catch((err) => {
            console.log(err);
            /*fallback to older/basic signin:*/  this.signinProgressSource.next('yoloFailed')
            if (err.type = "noCredentialsAvailable") console.log('nocredyolo');
          })
        } else {
          /*fallback to older/basic signin:*/ this.signinProgressSource.next('yoloFailed')
        }
      })
      this.googleAuthInit()
    };
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
          client_id: "675428000879-vqiopon2kmg1jtal4jpk8j23fnjk6rv9.apps.googleusercontent.com",
          hosted_domain: "york.org",
          scope: "profile"
        }).then(() => {
          console.log('gauth innited');
          this.signinProgressSource.next('gauthLoaded')
          //Handle the initial sign-in state.
          this.updateGAuthSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          //Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => this.updateGAuthSigninStatus(isSignedIn));
        }).catch((err) => {
          console.warn(err);
        })
      }, 3)
    })
  };

  updateGAuthSigninStatus(isSignedIn) {
    this.zone.run(() => { //need to get back into angular's detection zone since this function was called from outside (gapi context)
      console.log("Signedin: ", isSignedIn);
      if (!isSignedIn) this.signinProgressSource.next('notSignedIn');
    })
  };

  getGUserToken() {
    if (gapi.auth2) {
      return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    } else if (googleyolo) {

    } else {
      // this.FirebaseAuth.auth.signInWithCredential().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }
  }

  getProfilePhoto() {
    return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getImageUrl();
  }

  handleSignInClick() {
    if (gapi.auth2) {
      gapi.auth2.getAuthInstance().signIn();
    } else if (googleyolo) {
      //  let credential = firebase.auth.GoogleAuthProvider.credential()
      //  this.FirebaseAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential('token'))
    } else {
      this.FirebaseAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }
    // Ideally the button should only show up after gapi.client.init finishes, so that this handler won't be called before OAuth is initialized.
  }

  handleSignOutClick() {
    if (gapi.auth2) gapi.auth2.getAuthInstance().signOut();
    this.FirebaseAuth.auth.signOut().then(console.log);
  }
}