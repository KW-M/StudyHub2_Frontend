import { Injectable, NgZone } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { HttpClient } from "@angular/common/http";
import { timeout } from "rxjs/operator/timeout";


@Injectable()
export class GoogleSigninService {
  signedIn: boolean = false;
  serverURLBase: string = 'http://127.0.0.1:3000';

  private signinStateSource = new Subject();
  signinState$ = this.signinStateSource.asObservable();

  constructor(private http: HttpClient, private zone: NgZone) {
    setTimeout(() => {
      gapi.load("client:auth2", () => {
        console.log('auth2 loaded')
        setTimeout(() => {
          console.log(gapi, gapi.client)
          this.googleAuthInit();
        }, 3)
      })
      console.log('constructor loaded')
    }, 3)
  }

  googleAuthInit() {
    gapi.client.init({
      apiKey: "AIzaSyDspTvXbOLF-3jBKJbZ9ZDPkdWIkmaGQOk",
      clientId: "675428000879-vqiopon2kmg1jtal4jpk8j23fnjk6rv9.apps.googleusercontent.com",
      discoveryDocs: ["https://people.googleapis.com/$discovery/rest"],
      scope: "profile"
    }).then(() => {
      console.log('gauth innited');
      //Handle the initial sign-in state.
      this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      //Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => this.updateSigninStatus(isSignedIn));
    }).catch((err) => {
      console.warn(err);
    })
  };

  updateSigninStatus(isSignedIn) {
    this.zone.run(() => { //need to get back into angular's detection zone since this function was called from outside (gapi context)
      console.log("Signedin: ", isSignedIn);
      this.signinStateSource.next(isSignedIn || false);
    })
  };

  getGUserToken() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
  }

  getProfilePhoto() {
    return gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile()['Paa'];
  }

  handleSignInClick() {
    gapi.auth2.getAuthInstance().signIn();
    // Ideally the button should only show up after gapi.client.init finishes, so that this handler won't be called before OAuth is initialized.
  }

  handleSignOutClick() {
    gapi.auth2.getAuthInstance().signOut();
  }
}