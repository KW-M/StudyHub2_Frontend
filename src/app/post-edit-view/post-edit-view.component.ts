import { Component, ViewEncapsulation, Input, ViewChild, ViewChildren, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { WindowService } from "../services/window.service";
import { EventBoardService } from "../services/event-board.service";
import { DataHolderService } from "../services/data-holder.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';
import { AlgoliaApisService } from '../services/algolia-apis.service';

@Component({
  selector: 'app-post-edit-view',
  templateUrl: './post-edit-view.component.html',
  styleUrls: ['./post-edit-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostEditViewComponent implements OnInit, OnDestroy {
  submitting: boolean;
  favoriteClasses: any[];
  labelMissing: boolean = false;
  visibleLabels: any;
  @Input('input-post') inputPost;
  @ViewChild('descriptionHTML') descriptionElm: ElementRef;
  labelChipList = [];
  currentPost;
  selectedClassObj: any = {};
  currentLinkPreview = {
    thumbnail: null,
    icon: null
  };
  signedinUser;
  labelAreaExpanded: boolean = false;
  classChooserExpanded: boolean = false;
  linkURL: string = '';
  labelAndClassSearchText: string = '';
  labels = [];
  yorkGroups;
  formattedYorkClasses;
  signedinUserObserver;
  backupSetIntervalRef;
  currentSnackBarRef;
  throttleTimer = {

  };
  constructor(private EventBoard: EventBoardService,
    private ExternalAPIs: ExternalApisService,
    private AlgoliaApis: AlgoliaApisService,
    private ServerAPIs: StudyhubServerApisService,
    private componentElem: ElementRef,
    private ChangeDetector: ChangeDetectorRef,
    private DataHolder: DataHolderService,
    public snackBar: MatSnackBar
  ) {
    this.currentPost = {
      "id": null,
      "title": "",
      "link": "",
      "description": "",
      "likeCount": 0,//<-
      "likeUsers": [],//<-
      "viewCount": 0,//<-
      "ranking": 0,//<-
      "labels": [],
      "classes": [],
      "creator": {
        "email": null,
        "name": null,
      },
      "attachmentName": null,
      "flagged": false,
      "creationDate": new Date(),
      "updateDate": new Date(),
    }
    let backupPost = window.localStorage.getItem("postDraftBackup")
    let snackBarAction = null
    if (backupPost && !this.currentPost.id) {
      let backupPostObj = JSON.parse(backupPost);
      let snackBar = this.snackBar.open('Unsaved Draft Found', 'Restore', {
        duration: 8000,
        horizontalPosition: "center"
      })
      this.currentSnackBarRef = snackBar;
      snackBar.afterDismissed().toPromise().then((action) => {
        snackBarAction = action;
        if (action.dismissedByAction === true) {
          this.currentPost = JSON.parse(backupPost);
          this.onLinkInput(this.currentPost.link)
          this.ChangeDetector.detectChanges();
        }
      })
    }
    this.backupSetIntervalRef = setInterval(() => {
      this.currentPost.description = this.descriptionElm.nativeElement.innerHTML;
      console.log(this.currentPost);
      if ((!this.currentSnackBarRef || snackBarAction) && !this.currentPost.id && (this.currentPost.title || this.currentPost.description || this.currentPost.link)) window.localStorage.setItem("postDraftBackup", JSON.stringify(this.currentPost));
    }, 25000)
  }

  onLinkInput(linkurl) {
    if (linkurl.length > 4 && linkurl.substring(0, 3) != 'htt') linkurl = 'http://' + linkurl;
    this.linkURL = linkurl;
    if (linkurl == '') {
      this.currentPost.link = '';
      this.currentPost.attachmentName = null;
      this.currentLinkPreview.thumbnail = null;
      this.currentLinkPreview.icon = null;
    } else if (linkurl.length > 10) {
      clearTimeout(this.throttleTimer['onLinkInput']);
      this.throttleTimer['onLinkInput'] = setTimeout(() => {
        this.ExternalAPIs.getPreview(linkurl).then((websitePreview) => {
          console.log(websitePreview);
          this.currentPost.link = linkurl;
          this.currentPost.attachmentName = websitePreview['attachmentName'];
          this.currentLinkPreview.thumbnail = websitePreview['thumbnail'];
          this.currentLinkPreview.icon = websitePreview['icon'];
          this.ChangeDetector.detectChanges();
        }, (err) => {
          console.warn(err);
          this.linkURL = '';
          this.currentSnackBarRef = this.snackBar.open('Can\'t reach attached link:', linkurl, {
            duration: 7000,
            horizontalPosition: "center"
          })
          this.currentSnackBarRef.afterDismissed().toPromise().then(function (action) { if (action.dismissedByAction === true) window.open(linkurl) })
        })
      }, 1000)
    }
  }

  ngOnInit() {
    this.currentPost = this.inputPost
    this.linkURL = this.currentPost.link || '';
    if (this.linkURL) this.onLinkInput(this.linkURL)
    console.log(this.DataHolder.currentPage)
    if (this.currentPost.classes.length === 0 && this.DataHolder.currentPage && this.DataHolder.currentPage !== "All Posts" && this.DataHolder.currentPage !== "My Posts" && this.DataHolder.currentPage !== "Bookmarks" && this.DataHolder.currentPage !== "Feed" && this.DataHolder.currentPage !== "Search") {
      this.currentPost.classes = [this.DataHolder.currentPage]
    }
    var tempLabels = this.currentPost.labels
    this.currentPost.labels = {}
    tempLabels.forEach(label => {
      this.currentPost.labels[label] = true;
    });
    tempLabels = undefined;
    this.labels = this.DataHolder.allLabels || []
    this.DataHolder.classAndGroupState$.first().toPromise().then((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      this.yorkGroups = classesAndGroups['groups'];
      //only put here so that york classes must have loaded >
      this.signedinUserObserver = this.DataHolder.currentUserState$.subscribe((userObj: any) => {
        this.signedinUser = userObj;
        this.currentPost.creator.email = this.currentPost.creator.email || userObj['email']
        this.currentPost.creator.name = this.currentPost.creator.name || userObj['name']
        console.log("user post", this.currentPost);
        this.favoriteClasses = []
        for (const favClass in userObj.favorites) {
          if (userObj.favorites.hasOwnProperty(favClass)) {
            this.favoriteClasses.push(this.DataHolder.getClassObj(favClass))
          }
        }
        //this.ChangeDetector.detectChanges();
      });
    });
  }

  classSelected(classes) {
    this.currentPost.classes = classes;
    if (classes[0]) {
      if (classes[0] !== this.selectedClassObj.name) this.selectedClassObj = this.DataHolder.getClassObj(classes[0]);
      this.AlgoliaApis.runIsolatedFacetSearch("labels", "", { facets: ["labels"], "facetsRefinements": { labels: undefined }, disjunctiveFacets: ["classes"], "disjunctiveFacetsRefinements": { classes: classes } }).then((searchResult) => {
        function arrayDeduplicate(array) {
          var a = array.concat();
          for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
              if (a[i].value === a[j].value)
                a.splice(j--, 1);
            }
          }
          return a;
        }
        this.labels = searchResult.facetHits ? arrayDeduplicate(searchResult.facetHits.concat(this.DataHolder.allLabels)) : this.DataHolder.allLabels;
        console.log("Classes & Labels:", { classes: this.currentPost.classes, labels: this.labels });
        this.ChangeDetector.detectChanges()
      })
    } else {
      this.labels = this.DataHolder.allLabels
    }
  }

  focusLinkInput() {
    document.getElementById("post_link_input").focus()
  }

  onLabelAndClassSearchInput(searchText) {
    this.labelAndClassSearchText = searchText;
    let currentPostLabels = this.currentPost.labels;
    let currentPostClasses = this.currentPost.classes;
    this.labelMissing = true;
    this.labels = this.labels.map((label) => {
      label.hidden = label.value.toLowerCase().indexOf(searchText.toLowerCase()) === -1 || undefined //!(currentPostLabels.includes(label.label) || !(label.label.toLowerCase().indexOf(searchText.toLowerCase()) === -1)) || undefined;
      if (label.hidden === undefined) this.labelMissing = false;
      return label;
    })
  }

  toggleLabel(label) {
    if (this.currentPost.labels[label] === true) {
      delete this.currentPost.labels[label]
    } else {
      this.currentPost.labels[label] = true
      setTimeout(() => {
        const elmList = document.querySelectorAll('.post-view-scroll-zone .post-chip-list .mat-chip.mat-chip-selected');
        elmList[elmList.length - 1].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, 30)
    }
  }

  createLabel(newLabelText) {
    this.onLabelAndClassSearchInput('')
    this.currentPost.labels[newLabelText] = true;
    this.labelMissing = false;
    this.ChangeDetector.detectChanges()
  }

  submitPost() {
    this.submitting = true;
    this.ExternalAPIs.getDriveSharingPermisions(this.currentPost.link).then((isShared) => {
      var tempPost = this.currentPost
      tempPost.description = this.descriptionElm.nativeElement.innerHTML
      var tempLabels = tempPost.labels
      tempPost.labels = []
      for (const label in tempLabels) {
        if (tempLabels[label] === true) tempPost.labels.push(label)
      }
      tempLabels = undefined
      console.log("submitting post: ", tempPost)
      this.ServerAPIs.submitPost(tempPost).then((response: any) => {
        console.log(response);
        window.localStorage.removeItem("postDraftBackup")
        this.submitting = false;
        this.EventBoard.closePostModal()
        this.ChangeDetector.detectChanges()
      });
    })
  }

  openDrivePicker() {
    this.ExternalAPIs.openDriveFilePicker().then((selectedFile: any) => {
      console.log(selectedFile);
      if (selectedFile) {
        this.currentPost.link = selectedFile.link;
        this.linkURL = selectedFile.link;
        this.currentPost.title = this.currentPost.title || selectedFile.title;
        this.currentPost.attachmentName = this.currentPost.attachmentName || selectedFile.attachmentName;
        this.onLinkInput(this.currentPost.link)
        this.ChangeDetector.detectChanges()
      }
    })
  }
  openUploadPicker() {
    this.ExternalAPIs.openFileUploadPicker().then((selectedFile: any) => {
      console.log(selectedFile);
      if (selectedFile) {
        this.currentPost.link = selectedFile.link;
        this.linkURL = selectedFile.link;
        this.currentPost.title = this.currentPost.title || selectedFile.title;
        this.currentPost.attachmentName = this.currentPost.attachmentName || selectedFile.attachmentName;
        this.onLinkInput(this.currentPost.link)
        this.ChangeDetector.detectChanges()
      }
    })
  }

  closeModal() {
    this.EventBoard.closePostModal()
  }

  getClassColorString(className: string) {
    let colorObj = this.DataHolder.getClassObj(className).color
    if (colorObj) return 'hsl(' + colorObj.h + ',' + colorObj.s + '%,40%)'
  }

  ngOnDestroy() {
    this.signedinUserObserver.unsubscribe()
    if (this.currentPost.title || this.currentPost.description || this.currentPost.link) window.localStorage.setItem("postDraftBackup", JSON.stringify(this.currentPost));
    if (this.currentSnackBarRef) this.currentSnackBarRef.dismiss()
    clearInterval(this.backupSetIntervalRef);
  }
}


