import { Injectable } from '@angular/core';
import { Subject } from "rxjs/Subject";
import 'rxjs/add/operator/first';
import { Router } from '@angular/router';
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import * as algoliasearch from 'algoliasearch'
import * as algoliasearchHelper from 'algoliasearch-helper'


@Injectable()
export class AlgoliaApisService {
  searchConfig = {
    disjunctiveFacets: ['classes', 'creator.name'],
    facets: ['labels'],
  };
  searchHelper: any;
  searchBasic: any;
  algoliaClient: any;
  constructor(private http: HttpClient, private Router: Router) {
    this.algoliaClient = algoliasearch('E4ZO0GZETF', '86abcc5769205165e5da838c20e882c4');
    this.searchHelper = algoliasearchHelper(this.algoliaClient, 'Posts', this.searchConfig);
    console.log(this.searchHelper);
  }
  setQueryStateFromUrl() {
    var newState = algoliasearchHelper.url.getStateFromQueryString(window.location.search)
    if (newState) this.searchHelper.setState(Object.assign(newState, this.searchConfig, { index: 'Posts' }));
  }
  updateURLQueryParams() {
    console.log(this.Router.routerState.snapshot.root.firstChild.url[0].path)
    this.Router.navigateByUrl("/" + this.Router.routerState.snapshot.root.firstChild.url[0].path + "?" + algoliasearchHelper.url.getQueryStringFromState(this.searchHelper.getState()));
  }
  getOtherURLQueryParams() {
    return algoliasearchHelper.url.getUnrecognizedParametersInQueryString(window.location.search);
  }
  getSearchQuery() {
    return this.searchHelper.getState().getQueryParameter('query')
  }
  getCurrentPage() {
    return this.searchHelper.getPage()
  }
  clearSearchRefinements() {
    this.searchHelper.clearRefinements()
  }
  runSearch() {
    this.searchHelper.search()
  }
  setCreatedByFilter(creatorName) {
    this.searchHelper.addDisjunctiveFacetRefinement('creator.name', creatorName)
  }
  setClassFilter(className) {
    this.searchHelper.addDisjunctiveFacetRefinement('classes', className)
  }
  removeQueryParam() {

  }
}
