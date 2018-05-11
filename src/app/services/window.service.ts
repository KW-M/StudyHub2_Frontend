import { Injectable } from '@angular/core';
import { Subject } from "rxjs";

@Injectable()
export class WindowService {

  constructor() {
    window.matchMedia("(max-width: 599px)").addListener(this.getMediaQueries);
    window.matchMedia("(min-width: 600px)").addListener(this.getMediaQueries);
    window.matchMedia("(min-width: 960px)").addListener(this.getMediaQueries);
    window.matchMedia("(min-width: 1280px)").addListener(this.getMediaQueries);
    window.matchMedia("(min-width: 1920px)").addListener(this.getMediaQueries);
  }
  private mdWindowSizeSource = new Subject<{}>();
  mdWindowSize$ = this.mdWindowSizeSource.asObservable();

  getMediaQueries = queryEvent => {
    var queries = {
      xs: window.matchMedia("(max-width: 599px)").matches,
      gtxs: window.matchMedia("(min-width: 600px)").matches,
      sm: window.matchMedia("(min-width: 600px) and (max-width: 959px)")
        .matches,
      gtsm: window.matchMedia("(min-width: 960px)").matches,
      md: window.matchMedia("(min-width: 960px) and (max-width: 1279px)")
        .matches,
      gtmd: window.matchMedia("(min-width: 1280px)").matches,
      lg: window.matchMedia("(min-width: 1280px) and (max-width: 1919px)")
        .matches,
      gtlg: window.matchMedia("(min-width: 1920px)").matches,
      xl: window.matchMedia("(min-width: 1920px)").matches,
      changed: null
    };
    if (queryEvent && queryEvent.type == "change")
      switch (queryEvent.matches) {
        case "(max-width: 599px)": {
          queries.changed = "xs";
          break;
        }
        case "(min-width: 600px)": {
          queries.changed = "sm";
          break;
        }
        case "(min-width: 960px)": {
          queries.changed = "md";
          break;
        }
        case "(min-width: 1280px)": {
          queries.changed = "lg";
          break;
        }
        case "(min-width: 1920px)": {
          queries.changed = "xl";
          break;
        }
      }
    this.mdWindowSizeSource.next(queries);
    return queries;
  };
}
