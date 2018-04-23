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
import { AlgoliaApisService } from "./algolia-apis.service";

@Injectable()
export class DataHolderService {
    otherQueryParams: any;
    signedinUser;
    yorkClasses;
    yorkGroups;
    labelList;
    loadingPostsSubscription;
    linkPreviewCache = {};
    allLoadedPosts;
    currentPage;
    currentPosts;
    currentPostFilters = {
        searchQuery: '',
        flagged: false,
        className: null,
        creatorEmail: null,
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
        private AlgoliaApis: AlgoliaApisService,
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

        this.otherQueryParams = this.AlgoliaApis.getOtherURLQueryParams();
        this.AlgoliaApis.setQueryStateFromUrl();
        Router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {
            this.currentPage = this.Router.routerState.snapshot.root.firstChild.url[0].path;
            if (this.currentPage && this.signedinUser) this.updateVisiblePosts();
        });

        var handleSearchResult = (searchResult) => {
            console.log(searchResult);
            console.log(this.AlgoliaApis.searchHelper)
            // if (searchResult.page === 0) {
            this.currentPosts = searchResult.hits.map((post) => {
                post.id = post.objectID
                delete post.objectID
                return post
            })
            // } else {
            //     this.currentPosts = this.currentPosts.concat(searchResult.hits);
            // };
            this.visiblePostsStateSource.next({
                posts: searchResult.hits,
                page: searchResult.page,
                totalPages: searchResult.nbPages,
            })
            if (searchResult.page <= searchResult.nbPages - 1 && window.document.body.scrollHeight === window.document.body.clientHeight) {
                this.AlgoliaApis.searchHelper.nextPage()
                this.AlgoliaApis.runSearch()
            }
        }

        this.AlgoliaApis.searchHelper.on('result', handleSearchResult);

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
            if ((window.scrollY > window.document.body.scrollHeight - window.document.body.clientHeight / 2) && this.AlgoliaApis.searchHelper.hasPendingRequests() === false) {
                this.AlgoliaApis.searchHelper.nextPage()
                this.AlgoliaApis.runSearch()
            }
        }

    }

    updateVisiblePosts() {
        switch (this.currentPage) {
            case 'All Posts':
                this.AlgoliaApis.clearSearchRefinements()
                this.AlgoliaApis.runSearch()
                break;
            case 'My Posts':
                this.AlgoliaApis.clearSearchRefinements()
                this.AlgoliaApis.setCreatedByFilter(this.signedinUser.name)
                this.AlgoliaApis.runSearch()
                break;
            case 'Bookmarks':
                this.AlgoliaApis.clearSearchRefinements()
                this.ServerAPIs.getPostsFromIds(this.signedinUser.recentlyViewed).then((posts) => {
                    this.visiblePostsStateSource.next({
                        posts: posts,
                        page: 1,
                        totalPages: 1,
                    })
                })
                break;
            case 'Feed':
                this.AlgoliaApis.clearSearchRefinements()
                //the feed page handles getting posts and things
                break;
            case 'Search':
                //the search page handles getting posts and things
                break;
            default:
                this.AlgoliaApis.clearSearchRefinements()
                this.AlgoliaApis.setClassFilter(this.currentPage)
                this.AlgoliaApis.runSearch()
                break;
        }
        this.AlgoliaApis.updateURLQueryParams()
    }

    updateSearchFilters(postFilters, sortMethod) {
        this.currentSortMethod = sortMethod || this.currentSortMethod;
        this.currentPostFilters = Object.assign(this.currentPostFilters, postFilters)
        console.log(this.currentPostFilters);
        // this.getNextPostSet(null)
    }

    getFeedPosts() {
        return this.ServerAPIs.getFeedPosts(this.signedinUser.favorites)
    }

    getRecentlyViewedPosts() {
        return this.ServerAPIs.getPostsFromIds(this.signedinUser.recentlyViewed)
    }

    deletePost(postObj) {
        let postBackup = postObj;
        let postIndex = this.findPost(postObj.id)
        this.currentPosts.splice(postIndex, 1)
        this.visiblePostsStateSource.next(this.currentPosts);
        let snackBar = this.snackBar.open('Deleting Post', 'Cancel', {
            duration: 5000,
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
    getClassObj(className: string) {
        var classObj = this.yorkClasses[className]
        classObj.name = className;
        return classObj;
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