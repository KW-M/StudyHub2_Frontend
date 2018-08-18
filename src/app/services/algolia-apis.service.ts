import { Injectable } from '@angular/core';
import { Subject } from "rxjs";
import { first } from 'rxjs/operators';
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
    this.algoliaClient = algoliasearch('DCEEQTUL2M', algoliaAPIKey);
    this.searchHelper = algoliasearchHelper(this.algoliaClient, 'Posts', this.searchConfig);
  }
  setQueryStateFromUrl() {
    var newState = algoliasearchHelper.url.getStateFromQueryString(window.location.search.replace("?", ""))
    if (newState) this.searchHelper.setState(Object.assign(newState, this.searchConfig, { index: 'Posts' }));
  }
  updateURLQueryParams() {
    this.Router.navigateByUrl("/" + this.Router.routerState.snapshot.root.firstChild.url[0].path + "?" + algoliasearchHelper.url.getQueryStringFromState(this.searchHelper.getState()));
  }
  clearURLQueryParams() {
    this.Router.navigateByUrl("/" + this.Router.routerState.snapshot.root.firstChild.url[0].path + (this.Router.routerState.snapshot.root.fragment ? "#" + this.Router.routerState.snapshot.root.fragment : ''));
  }
  getOtherURLQueryParams() {
    return algoliasearchHelper.url.getUnrecognizedParametersInQueryString(window.location.search);
  }
  getSearchQuery() {
    console.log(this.searchHelper.getState());

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
  runIsolatedSearch(searchParams) {
    var blankParams = {
      "index": "Posts",
      "query": "",
      "page": 0,
      "facets": [],
      "disjunctiveFacets": [],
      "facetsRefinements": {},
      "disjunctiveFacetsRefinements": {},
    }
    // {hitsPerPage: 1}
    // "facets": ["labels"],
    // "disjunctiveFacets": ["classes", "creator.name"],
    // "facetsRefinements": { "labels": ["Notes"] },
    // "disjunctiveFacetsRefinements": { "classes": ["English IV"], "creator.name": ["Jared AldapeDuron"] },
    console.log(Object.assign(blankParams, searchParams));
    return this.searchHelper.searchOnce(Object.assign(blankParams, searchParams))
  }
  runIsolatedFacetSearch(facet, query, searchParams) {
    var blankParams = {
      "index": "Posts",
      "query": "",
      "page": 0,
      "facets": [],
      "disjunctiveFacets": [],
      "facetsRefinements": undefined,
      "disjunctiveFacetsRefinements": undefined,
      "numericFilter": undefined,
    }
    // "facets": facet ? [facet] : [],
    // "disjunctiveFacets": dusjuntiveFacets ? dusjuntiveFacets : [],
    // "facetsRefinements": undefined,
    // "disjunctiveFacetsRefinements": undefined,
    // "numericFilter": dateRange ? ["updateDate>=" + (new Date(Date.now() + -67 * 24 * 3600 * 1000))] : undefined
    console.log(searchParams, Object.assign(blankParams, searchParams))
    return this.searchHelper.searchForFacetValues(facet, query, 100, Object.assign(blankParams, searchParams))
  }
  searchFacet(facet, query) {
    return this.searchHelper.searchForFacetValues(facet, query)
  }
  setCreatedByFilter(creatorName) {
    this.searchHelper.clearRefinements('creator.name')
    if (creatorName) this.searchHelper.addDisjunctiveFacetRefinement('creator.name', creatorName)
  }
  setClassFilter(classNames) {
    //this.searchHelper.getState().getQueryParameter('disjunctiveFacetsRefinements')
    if (classNames.length === 0) this.searchHelper.clearRefinements('classes')
    for (let filterIndex = 0; filterIndex < classNames.length; filterIndex++) {
      console.log(classNames[filterIndex])
      this.searchHelper.addDisjunctiveFacetRefinement('classes', classNames[filterIndex]);
    }
    console.log(this.searchHelper.getState().getQueryParameter('disjunctiveFacetsRefinements'))
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
