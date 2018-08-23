import { Injectable } from "@angular/core";
import { Router, NavigationEnd } from '@angular/router';
import { ReplaySubject } from 'rxjs';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
import { AngularFireAuth } from "angularfire2/auth";
import { MatSnackBar } from "@angular/material";
import { AlgoliaApisService } from "./algolia-apis.service";
import { filter, first } from "rxjs/operators";

@Injectable()
export class DataHolderService {
    quizletUsername: any;
    currentResultPage = {
        page: 0,
        totalPages: 0,
    }
    allLabels: any;
    otherQueryParams: any;
    signedinUser;
    yorkClasses;
    yorkGroups;
    labelList;
    loadingPosts = false;
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

    private startupCompleteStateSource = new ReplaySubject(1);
    startupCompleteState$ = this.startupCompleteStateSource.asObservable();
    private currentUserStateSource = new ReplaySubject(1);
    currentUserState$ = this.currentUserStateSource.asObservable();
    private visiblePostsStateSource = new ReplaySubject(1);
    visiblePostsState$ = this.visiblePostsStateSource.asObservable();
    private feedPostsStateSource = new ReplaySubject(1);
    feedPostsState$ = this.visiblePostsStateSource.asObservable();
    private classAndGroupStateSource = new ReplaySubject(1);
    classAndGroupState$ = this.classAndGroupStateSource.asObservable();
    // private labelsStateSource = new ReplaySubject(1);
    // labelsState$ = this.labelsStateSource.asObservable();

    constructor(public EventBoard: EventBoardService,
        private GSignin: GoogleSigninService,
        private FirebaseAuth: AngularFireAuth,
        private AlgoliaApis: AlgoliaApisService,
        private ExternalAPIs: ExternalApisService,
        private ServerAPIs: StudyhubServerApisService,
        private Router: Router,
        public snackBar: MatSnackBar) {
        //constructor functions
        (<any>window).getMissingSyncPosts = (name) => {
            var idList = this.currentPosts.map((post) => { return post.id })
            console.log(idList);
            this.ServerAPIs.getPostsFromIds(idList).then((list) => {
                var templist = []
                list.forEach((value, index) => {
                    if (value.title === undefined) {
                        templist.push({ wrongId: idList[index], name: this.currentPosts[index].title, post: this.currentPosts[index] });
                        (<any>window).getPost(this.currentPosts[index].title)
                    }
                })
                console.log(templist)
                console.log()
            });
        }
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
                this.ServerAPIs.getStartupInfo().then((startupInfo: any) => {
                    this.AlgoliaApis.initializeAlgolia(startupInfo.AlgoliaAPIKey)
                    this.AlgoliaApis.searchHelper.on('result', handleSearchResult);
                    this.otherQueryParams = this.AlgoliaApis.getOtherURLQueryParams();
                    this.AlgoliaApis.setQueryStateFromUrl();
                    this.startupCompleteStateSource.next(true);
                    console.log('Algolia Initialization Complete', this.AlgoliaApis.searchHelper)
                    this.AlgoliaApis.runIsolatedFacetSearch("labels", "", { facets: ["labels"], "facetsRefinements": { labels: undefined } }).then((searchResult) => {
                        this.allLabels = searchResult.facetHits || [];
                        console.log(this.allLabels);
                    })
                    // this.AlgoliaApis.runIsolatedFacetSearch(null, "", ["creator.name"], true).then((searchResult) => {
                    //    // this.allLabels = searchResult.facetHits || [];
                    // })
                    console.log(this.otherQueryParams)
                    var driveQueryParams = this.otherQueryParams.state || this.otherQueryParams["?state"]
                    if (this.otherQueryParams && driveQueryParams) {
                        console.log(JSON.parse(driveQueryParams))
                        this.EventBoard.openPostModal({
                            link: 'https://drive.google.com/open?id=' + driveQueryParams.ids[0]
                        }, 'edit')
                    }
                    /// 86400000 is the number of miliseconds in a day.
                    //if ((new Date().getTime() - startupInfo.lastReRankDate) > 86400000) ServerAPIs.runReRankCloudFunction()
                })
                this.ServerAPIs.getQuizletUsername(signedIn.displayName).then((username) => {
                    this.quizletUsername = username;
                })
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

        var handleSearchResult = (searchResult) => {
            console.log('searchResult:', searchResult);
            var newPosts = searchResult.hits.map(this.convertAlgoliaHitToPost).filter((post) => {
                return (post.classes.indexOf("Memes") === -1 || this.currentPage === "Memes")
            })
            if (searchResult.page === 0) {
                this.currentPosts = newPosts;
            } else {
                this.currentPosts = this.currentPosts.concat(newPosts);
            };
            this.currentResultPage = {
                page: searchResult.page,
                totalPages: searchResult.nbPages,
            }
            console.log(searchResult.getFacetValues('labels'))
            setTimeout(() => {
                this.visiblePostsStateSource.next({
                    posts: this.currentPosts,
                    page: searchResult.page,
                    totalPages: searchResult.nbPages,
                    facets: {
                        creators: searchResult.getFacetValues('creator.name') || [],
                        labels: searchResult.getFacetValues('labels') || []
                    }
                })
                if (searchResult.page < searchResult.nbPages - 1 && window.document.body.scrollHeight === window.document.body.clientHeight) {
                    this.loadingPosts = true;
                    this.AlgoliaApis.searchHelper.nextPage()
                    this.AlgoliaApis.runSearch()
                }
            }, 100);
        }

        Router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((newRoute) => {
            this.startupCompleteState$.pipe(first()).toPromise().then(() => {
                this.currentPage = this.Router.routerState.snapshot.root.firstChild.url[0].path;
                console.log(this.currentPage)
                if (this.currentPage && this.signedinUser) this.updateVisiblePosts();
                console.log(this.Router.routerState.snapshot.root)
                if (this.Router.routerState.snapshot.root.fragment) {
                    console.log(this.Router.routerState.snapshot.root.fragment);
                    this.ServerAPIs.getPostsFromIds([this.Router.routerState.snapshot.root.fragment]).then((posts) => {
                        console.log(posts);
                        this.EventBoard.openPostModal(posts[0], 'view')
                    })
                }
            })
        });

        window.onscroll = (event) => {
            // console.log("scrolling", {
            //     sh: window.document.body.scrollHeight,
            //     ch: window.document.body.clientHeight,
            //     sc: window.scrollY,
            //     min: window.document.body.scrollHeight - window.document.body.clientHeight
            // })
            if ((window.scrollY > window.document.body.scrollHeight - window.document.body.clientHeight * 1.5 && this.AlgoliaApis.searchHelper.hasPendingRequests() === false && this.loadingPosts === false && this.currentResultPage.page < this.currentResultPage.totalPages - 1)) {
                console.log('searching');
                this.AlgoliaApis.searchHelper.nextPage()
                this.AlgoliaApis.runSearch()
            }
        }
    }



    updateVisiblePosts() {
        if (this.currentPage !== "Search") this.AlgoliaApis.clearURLQueryParams()
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
                this.AlgoliaApis.setClassFilter([this.currentPage])
                this.AlgoliaApis.runSearch()
                break;
        }
    }

    updateSearchFilters(postFilters, sortMethod) {
        this.currentSortMethod = sortMethod || this.currentSortMethod;
        this.currentPostFilters = Object.assign(this.currentPostFilters, postFilters)
        console.log(this.currentPostFilters);
    }

    updateCurrentUserObserver(newUserObj) {
        this.currentUserStateSource.next(Object.assign(this.signedinUser, newUserObj))
    }

    getFeedPosts() {
        var requestArray = []
        for (const favClass in this.signedinUser.favorites) {
            if (this.signedinUser.favorites.hasOwnProperty(favClass)) {
                requestArray.push(this.AlgoliaApis.runIsolatedSearch({
                    hitsPerPage: 4,
                    "disjunctiveFacets": ["classes"],
                    "disjunctiveFacetsRefinements": { "classes": [favClass] },
                }))
            }
        }
        return Promise.all(requestArray)
    }

    getRecentlyViewedPosts() {
        return this.ServerAPIs.getPostsFromIds(this.signedinUser.recentlyViewed)
    }

    deletePost(postObj) {
        let postIndex = null
        if (this.currentPosts) {
            postIndex = this.findPost(postObj.id)
            this.currentPosts.splice(postIndex, 1)
            this.visiblePostsStateSource.next(null)
        }
        let snackBar = this.snackBar.open('Deleting Post', 'Cancel', {
            duration: 5000,
            horizontalPosition: "start"
        })
        new Promise((resolve, reject) => {
            snackBar.afterDismissed().toPromise().then((action) => {
                if (action.dismissedByAction === true) {
                    reject()
                } else {
                    this.ServerAPIs.deletePost(postObj.id).then((done) => { resolve() }).catch((err) => { console.log(err); reject(err) });
                }
            })
        }).catch(() => {
            if (this.currentPosts) this.currentPosts.splice(postIndex, 0, postObj)
            this.visiblePostsStateSource.next(null)
        })
    }

    getClassObj(className: string) {
        var classObj = this.yorkClasses[className] || this.yorkGroups[className] || {}
        classObj.name = className;
        classObj.color = classObj.color || { h: 0, s: 0, l: 100 }
        return classObj;
    }
    findPost(postId) {
        for (let arrayIndex = 0; arrayIndex < this.currentPosts.length; arrayIndex++) {
            if (this.currentPosts[arrayIndex].id === postId) return arrayIndex
        }
    }
    convertAlgoliaHitToPost(hit) {
        hit.id = hit.objectID
        hit.creationDate = new Date(hit.creationDate)
        hit.updateDate = new Date(hit.updateDate)
        delete hit.objectID
        return hit;
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
    copyString(string) {
        var copyText: any = document.getElementById("clipboard_copy_area");
        copyText.value = string;
        copyText.select();
        document.execCommand("copy");
        copyText.textContent;
        this.snackBar.open("Copied to clipboard", null, {
            duration: 1000,
            horizontalPosition: "start"
        })
    }
    arrayToObj(input, preserveOrder) {
        var output = {}
        for (let arrayIndex = 0; arrayIndex < input.length; arrayIndex++) {
            output[input[arrayIndex]] = preserveOrder ? arrayIndex : true;
        }
        return output;
    }

    routerGoToPage(page) {
        this.Router.navigate(["/" + page]);
    }
}