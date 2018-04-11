import { Injectable, OnInit, Output } from "@angular/core";
import { Router, NavigationEnd, ActivatedRoute, RouterState } from '@angular/router';
import { ReplaySubject } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
import { AngularFireAuth } from "angularfire2/auth";
import * as firebase from 'firebase/app';
import { MatSnackBar } from "@angular/material";

@Injectable()
export class DataHolderService {
    signedinUser;
    yorkClasses;
    yorkGroups;
    labelList;
    searchQuery = null;
    loadingPostsSubscription;
    linkPreviewCache = {};
    allLoadedPosts;
    currentPage;
    currentPosts;
    currentPostFilters = {
        searchQuery: null,
        className: null,
        userEmail: null,
        tags: [],
        date: null,
        usersBookmarks: false,
        fancySearch: false,
    };
    currentSortMethod = 'magic'; //byDate byLikes byViews

    private currentUserStateSource = new ReplaySubject(1);
    currentUserState$ = this.currentUserStateSource.asObservable();
    private visiblePostsStateSource = new ReplaySubject(1);
    visiblePostsState$ = this.visiblePostsStateSource.asObservable();
    private feedPostsStateSource = new ReplaySubject(1);
    feedPostsState$ = this.visiblePostsStateSource.asObservable();
    private classAndGroupStateSource = new ReplaySubject(1);
    classAndGroupState$ = this.classAndGroupStateSource.asObservable();
    private labelsStateSource = new ReplaySubject(1);
    labelsState$ = this.labelsStateSource.asObservable();

    constructor(public EventBoard: EventBoardService,
        private GSignin: GoogleSigninService,
        private FirebaseAuth: AngularFireAuth,
        private ExternalAPIs: ExternalApisService,
        private ServerAPIs: StudyhubServerApisService,
        private Router: Router,
        public snackBar: MatSnackBar) {
        //constructor functions
        FirebaseAuth.authState.subscribe((signedIn) => {
            if (signedIn != null && signedIn.email) {
                this.ServerAPIs.getUserFromServer(signedIn.email).then((userObj) => {
                    this.signedinUser = Object.assign(userObj, {
                        email: signedIn.email,
                        photoURL: signedIn.photoURL
                    })
                    console.log("Fire Signin Sucsessful! User: ", userObj);
                    this.currentUserStateSource.next(this.signedinUser)
                    if (this.currentPage && this.signedinUser) this.updateVisiblePosts();
                }).catch(console.warn)
            } else {
                console.log('Fire Not Signed In');
                this.signedinUser = null;
                this.currentUserStateSource.next(this.signedinUser)
            };
        });

        this.ServerAPIs.getClassAndGroupList().then((response: any) => {
            this.yorkClasses = response['classes'];
            this.yorkGroups = response['groups'];
            this.classAndGroupStateSource.next(response);
        })

        Router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {
            this.currentPage = this.Router.routerState.snapshot.root.firstChild.url[0].path;
            this.searchQuery = this.Router.routerState.snapshot.root.queryParams.q;
            if (this.currentPage && this.signedinUser) this.updateVisiblePosts();
        });

        this.ServerAPIs.getLabels().then((labelsResponse: any) => {
            console.log('labels:', labelsResponse)
            this.labelList = labelsResponse;
            this.labelsStateSource.next(labelsResponse);
        }).catch((err) => {
            this.labelsStateSource.error(err);
            console.warn(err);
        })
        // this.ServerAPIs.getUserBookmarks().toPromise().then((bookmarksResponse: any) => {
        //     this.labelsStateSource.next(labelsResponse);
        //     console.log('labels:', labelsResponse)
        //     this.labelList = labelsResponse;
        // }).catch((err) => {
        //     this.labelsStateSource.error(err);
        //     console.warn(err);
        // })

        window.onscroll = (event) => {
            console.log(event);
            console.log(window.scrollY, window.document.body.scrollHeight);
            if (window.scrollY > window.document.body.scrollHeight - window.document.body.clientHeight) {
                if (this.loadingPostsSubscription === null) {
                    console.log(this.currentPosts[this.currentPosts.length - 1].updateDate);
                    this.getNextPostSet(this.currentPosts[this.currentPosts.length - 1].updateDate)
                }
            }
        }

    }

    updateVisiblePosts() {
        switch (this.currentPage) {
            case 'all posts':
                this.updateSearchFilters({
                    searchQuery: this.searchQuery || null,
                    className: null,
                    userEmail: null,
                    tags: [],
                    date: null,
                }, null)
                break;
            case 'my posts':
                this.updateSearchFilters({
                    searchQuery: this.searchQuery || null,
                    className: null,
                    userEmail: this.signedinUser['email'] || null,
                    tags: [],
                    date: null,
                }, null)
                break;
            case 'bookmarks':
                //this.getBookmarkedPosts()
                break;
            case 'feed':
                //this.getRecentlyViewedPosts()
                this.getFeedPosts()
                break;
            default:
                this.updateSearchFilters({
                    className: this.currentPage,
                    userEmail: null,
                    tags: [],
                    date: null,
                }, null)
                break;
        }
    }

    updateSearchFilters(postFilters, sortMethod) {
        this.currentSortMethod = sortMethod || this.currentSortMethod;
        this.currentPostFilters = Object.assign(this.currentPostFilters, postFilters)
        console.log(this.currentPostFilters);
        this.getNextPostSet(null)
    }

    getNextPostSet(startingPost) {
        var handlePostSet = (postSet) => {
            console.log(postSet, startingPost);
            //if (postSet.length < 3) this.loadingPostsSubscription = 'no more';
            if (startingPost === null) {
                this.currentPosts = postSet;
            } else {
                this.currentPosts = this.currentPosts.concat(postSet);
            }
            this.visiblePostsStateSource.next(this.currentPosts)
            if (this.loadingPostsSubscription === 'next') {
                console.log(this.currentPosts, this.currentPosts[this.currentPosts.length - 1]);
                this.getNextPostSet(this.currentPosts[this.currentPosts.length - 1].updateDate)
            } else {
                this.loadingPostsSubscription = null;
            }
        }
        if (this.loadingPostsSubscription !== 'no more' && this.signedinUser && this.Router.parseUrl(this.Router.url).root.children.primary.segments[1] === undefined) {
            if (this.currentPostFilters.searchQuery) {
                //this.loadingPostsSubscription = this.ServerAPIs.getSearchPosts(this.currentPostFilters, startingPostId).then(handlePostSet).catch(console.warn);
            } else {
                this.loadingPostsSubscription = this.ServerAPIs.getPosts(this.currentPostFilters, this.currentSortMethod, startingPost).first().toPromise().then(handlePostSet).catch(console.warn);
            }
        }
    }

    getPosts

    getAllPosts() {
        // this.ServerAPIs.getAllPosts(this.currentSortMethod).then((posts: any) => { this.allLoadedPosts = posts; this.visiblePostsStateSource.next(posts) }, console.warn)
    }

    getFeedPosts() {
        this.ServerAPIs.getFeedPosts().then((posts: any) => { this.allLoadedPosts = posts; this.feedPostsStateSource.next({ feed: posts }) }, console.warn)
    }

    getRecentlyViewedPosts() {
        this.ServerAPIs.getRecentlyViewedPosts().then((posts: any) => { this.allLoadedPosts = posts; this.feedPostsStateSource.next({ feed: posts }) }, console.warn)
    }

    deletePost(postObj) {
        let postBackup = postObj;
        let postIndex = this.findPost(postObj.id)
        this.currentPosts.splice(postIndex, 1)
        this.visiblePostsStateSource.next(this.currentPosts);
        let snackBar = this.snackBar.open('Deleting Post', 'Undo', {
            duration: 10000,
            horizontalPosition: "start"
        })
        snackBar.afterDismissed().toPromise().then((action) => {
            if (action.dismissedByAction === true) {
                this.currentPosts.splice(postIndex, 0, postBackup)
                this.visiblePostsStateSource.next(this.currentPosts);
            } else {
                this.ServerAPIs.deletePost(postObj.id).then(console.log).catch(console.warn);
            }
        })
    }

    setCachedLinkPreview(postId, linkPreview) {
        this.linkPreviewCache[postId] = linkPreview;
    }
    getCachedLinkPreview(postId) {
        console.log("linkPreviewData", this.linkPreviewCache);
        return this.linkPreviewCache[postId];
    }
    getClassColor(className: string) {
        let classObj = this.yorkClasses[className];
        if (classObj) {
            return classObj.color
        } else {
            return null;
        }
    }
    findPost(postId) {
        for (let arrayIndex = 0; arrayIndex < this.currentPosts.length; arrayIndex++) {
            if (this.currentPosts[arrayIndex].id === postId) return arrayIndex
        }
    }
    objToArray(input) {
        var output = []
        for (var key in input) {
            if (parseInt(input[key]) != NaN) {
                output[parseInt(input[key])] = key;
            } else {
                output.push(key);
            }
        }
        return output;
    }
    arrayToObj(input, preserveOrder) {
        var output = {}
        for (let arrayIndex = 0; arrayIndex < input.length; arrayIndex++) {
            output[input[arrayIndex]] = preserveOrder ? arrayIndex : true;
        }
        return output;
    }
}