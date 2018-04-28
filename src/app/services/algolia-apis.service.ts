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
  constructor(private http: HttpClient, private Router: Router) { }

  initializeAlgolia(algoliaAPIKey) {
    this.algoliaClient = algoliasearch('E4ZO0GZETF', algoliaAPIKey);
    this.searchHelper = algoliasearchHelper(this.algoliaClient, 'Posts', this.searchConfig);
  }
  setQueryStateFromUrl() {
    var newState = algoliasearchHelper.url.getStateFromQueryString(window.location.search)
    if (newState) this.searchHelper.setState(Object.assign(newState, this.searchConfig, { index: 'Posts' }));
  }
  updateURLQueryParams() {
    this.Router.navigateByUrl("/" + this.Router.routerState.snapshot.root.firstChild.url[0].path + "?" + algoliasearchHelper.url.getQueryStringFromState(this.searchHelper.getState()));
  }
  clearURLQueryParams() {
    this.Router.navigateByUrl("/" + this.Router.routerState.snapshot.root.firstChild.url[0].path);
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
  searchFacet(facet, query) {
    return this.searchHelper.searchForFacetValues(facet, query)
  }
  setCreatedByFilter(creatorName) {
    this.searchHelper.clearRefinements('creator.name')
    if (creatorName) this.searchHelper.addDisjunctiveFacetRefinement('creator.name', creatorName)
  }
  setClassFilter(classNames) {
    console.log(classNames);
    this.searchHelper.clearRefinements('classes')
    for (let filterIndex = 0; filterIndex < classNames.length; filterIndex++) {
      this.searchHelper.addDisjunctiveFacetRefinement('classes', classNames[filterIndex]);
    }
    console.log(this.searchHelper);
  }
  toggleLabelFilter(labelText) {
    if (labelText) this.searchHelper.toggleFacetRefinement('labels', labelText)
  }
  clearFilter(filterName) {
    this.searchHelper.clearRefinements(filterName)
  }
  removeQueryParam() {

  }
}
