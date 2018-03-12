import { Injectable, OnInit } from "@angular/core";
import { Router, NavigationEnd, ActivatedRoute, RouterState } from '@angular/router';
import { ReplaySubject } from "rxjs";
import { Observable } from 'rxjs/Observable';
import { EventBoardService } from "../services/event-board.service";
import { GoogleSigninService } from "../services/google-signin.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';

@Injectable()
export class DataHolderService {
    signedinUser;
    yorkClasses;
    yorkGroups;
    labelList;
    searchQuery;
    allLoadedPosts;
    currentPage;
    currentPosts;
    currentPostFilters = {
        searchQuery: null,
        className: null,
        userEmail: null,
        tags: [],
        date: null,
        type: null,
        usersBookmarks: false,
        fancySearch: false,
    };
    currentSortMethod = 'magic'; //byDate byLikes byViews

    private currentUserStateSource = new ReplaySubject(1);
    currentUserState$ = this.currentUserStateSource.asObservable();
    private visiblePostsStateSource = new ReplaySubject(1);
    visiblePostsState$ = this.visiblePostsStateSource.asObservable();
    private classAndGroupStateSource = new ReplaySubject(1);
    classAndGroupState$ = this.classAndGroupStateSource.asObservable();
    private labelsStateSource = new ReplaySubject(1);
    labelsState$ = this.labelsStateSource.asObservable();

    constructor(public EventBoard: EventBoardService,
        private GSignin: GoogleSigninService,
        private ExternalAPIs: ExternalApisService,
        private ServerAPIs: StudyhubServerApisService,
        private Router: Router) {

        //constructor functions
        GSignin.signinState$.subscribe((signedIn) => {
            if (signedIn) {
                this.ServerAPIs.getUserFromServer(GSignin.getGUserToken()).then((userObj) => {
                    this.signedinUser = userObj;
                    this.signedinUser.profilePhoto = GSignin.getProfilePhoto()
                    this.currentUserStateSource.next(this.signedinUser)
                    console.log(this.signedinUser);
                    console.log(this.yorkClasses,this.currentPage);
                    if (this.yorkClasses && this.signedinUser) this.updateFavorites(this.signedinUser.favorites);
                    if (this.currentPage && this.signedinUser) this.updateVisiblePosts();
                }).catch(console.warn)
            } else {
                this.signedinUser = null;
                this.currentUserStateSource.next(this.signedinUser)
            };
        });
        this.ServerAPIs.getClassAndGroupList().subscribe((response: any) => {
            this.yorkClasses = response['classes'];
            this.yorkGroups = response['groups'];
            if (this.yorkClasses && this.signedinUser) this.updateFavorites(this.signedinUser.favorites);
            if (this.yorkClasses && this.signedinUser === undefined) this.classAndGroupStateSource.next(response);
        })

        // Router.events.filter(event => event instanceof NavigationEnd).subscribe((newRoute) => {
        //     this.currentPage = this.Router.routerState.snapshot.root.firstChild.url[0].path;
        //     this.searchQuery = this.Router.routerState.snapshot.root.queryParams.query;
        //     if (this.currentPage && this.signedinUser) this.updateVisiblePosts();
        // });
        // this.ServerAPIs.getLabels().toPromise().then((labelsResponse: any) => {
        //     this.labelsStateSource.next(labelsResponse);
        //     console.log('labels:', labelsResponse)
        //     this.labelList = labelsResponse;
        // }).catch((err) => {
        //     this.labelsStateSource.error(err);
        //     console.warn(err);
        // })
        // this.ServerAPIs.getUserBookmarks().toPromise().then((bookmarksResponse: any) => {
        //     this.labelsStateSource.next(labelsResponse);
        //     console.log('labels:', labelsResponse)
        //     this.labelList = labelsResponse;
        // }).catch((err) => {
        //     this.labelsStateSource.error(err);
        //     console.warn(err);
        // })
        // Observable.combineLatest(this.GSignin.signinState$, classAndGroupObservable).subscribe(([signedinUser, classesAndGroups]) => {
        //     if (signedinUser['user']) {
        //         this.yorkClasses = classesAndGroups['classes'];
        //         this.yorkGroups = classesAndGroups['groups']// needs seperate var.push({ name: 'Other', userFavorite: true })//
        //         this.updateFavorites(signedinUser['user'].favorites);
        //     }
        //     console.log(signedinUser, classesAndGroups);
        // });
    }

    updateVisiblePosts() {
        switch (this.currentPage) {
            case 'all posts':
                if (this.searchQuery) {
                    this.updateSearchFilters({
                        searchQuery: this.searchQuery || null,
                    }, null)
                } else {
                    this.getAllPosts()
                }
                break;
            case 'my posts':
                this.updateSearchFilters({
                    searchQuery: this.searchQuery || null,
                    className: null,
                    userEmail: this.signedinUser['email'] || null,
                    tags: [],
                    date: null,
                    type: null,
                    usersBookmarks: false
                }, null)
                break;
            case 'bookmarks':
                this.updateSearchFilters({
                    className: null,
                    userEmail: null,
                    tags: [],
                    date: null,
                    type: null,
                    usersBookmarks: true,
                }, null)
                break;
            case 'feed':
                //this.getFeed()
                break;
            default:
                this.updateSearchFilters({
                    className: this.currentPage,
                    userEmail: null,
                    tags: [],
                    date: null,
                    type: null,
                    usersBookmarks: false
                }, null)
                break;
        }
    }

    updateFavorites(favList) {
        this.applyFavorites(this.yorkClasses, favList);
        this.applyFavorites(this.yorkGroups, favList);
        this.classAndGroupStateSource.next({
            classes: this.yorkClasses,
            groups: this.yorkGroups,
            favorites: favList,
        });
    }

    private applyFavorites(arrayToSearch, favList) {
        for (let classIndex = 0; classIndex < arrayToSearch.length; classIndex++) {
            for (let favIndex = 0; favIndex < favList.length; favIndex++) {
                if (favList[favIndex] === arrayToSearch[classIndex].name) {
                    arrayToSearch[classIndex].userFavorite = true;
                    favIndex = favList.length; //break  out of the class search loop if we've added the class
                } else {
                    arrayToSearch[classIndex].userFavorite = false;
                }
            }
        }
    }

    updateSearchFilters(postFilters, sortMethod) {
        this.currentSortMethod = sortMethod || this.currentSortMethod;
        this.currentPostFilters = Object.assign(this.currentPostFilters, postFilters)
        if (this.signedinUser) {
            let gotResponse = (posts: any) => { this.currentPosts = posts; this.visiblePostsStateSource.next(posts) }
            if (this.currentPostFilters.searchQuery) {
                this.ServerAPIs.getQueryPosts(this.currentPostFilters).then(gotResponse, console.warn)
            } else {
                this.ServerAPIs.getPosts(this.currentPostFilters, this.currentSortMethod).then(gotResponse, console.warn)
            }

        }
    }

    getAllPosts() {
        this.ServerAPIs.getAllPosts(this.currentSortMethod).then((posts: any) => { this.allLoadedPosts = posts; this.visiblePostsStateSource.next(posts) }, console.warn)
    }
}