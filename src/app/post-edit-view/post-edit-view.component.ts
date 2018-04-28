import { Component, ViewEncapsulation, Input, ViewChild, ViewChildren, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { WindowService } from "../services/window.service";
import { EventBoardService } from "../services/event-board.service";
import { DataHolderService } from "../services/data-holder.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';

@Component({
  selector: 'app-post-edit-view',
  templateUrl: './post-edit-view.component.html',
  styleUrls: ['./post-edit-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostEditViewComponent implements OnInit, OnDestroy {
  favoriteClasses: any[];
  labelMissing: boolean = false;
  visibleLabels: any;
  websitePreviewObserver;
  @Input('input-post') inputPost;
  @ViewChildren('labelChip') labelChip;
  @ViewChild('descriptionHTML') descriptionElm: ElementRef;
  labelChipList = [];
  currentPost;
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
  labelsObserver
  backupSetIntervalRef;
  currentSnackBarRef;
  throttleTimer = {

  };
  constructor(private EventBoard: EventBoardService,
    private ExternalAPIs: ExternalApisService,
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
      "labels": {},
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

    this.labelsObserver = this.DataHolder.labelsState$.subscribe((labels) => {
      for (var key in labels) {
        labels[key].label = key;
        this.labels.push(labels[key]);
      }
      this.ChangeDetector.markForCheck();
    })

    let backupPost = window.localStorage.getItem("postDraftBackup")
    let snackBarAction = null
    if (backupPost && !this.currentPost.id) {
      let backupPostObj = JSON.parse(backupPost);
      let snackBar = this.snackBar.open('Unsaved Draft Found', 'Restore', {
        duration: 15000,
        horizontalPosition: "start"
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
    clearTimeout(this.throttleTimer['onLinkInput']);
    if (linkurl.length > 4 && linkurl.substring(0, 3) != 'htt') linkurl = 'http://' + linkurl;
    this.linkURL = linkurl;
    if (linkurl == '') {
      this.currentPost.link = '';
      this.currentPost.attachmentName = null;
      this.currentLinkPreview.thumbnail = null;
      this.currentLinkPreview.icon = null;
    } else if (linkurl.length > 10) {
      this.throttleTimer['onLinkInput'] = setTimeout(() => {
        let driveFileId = this.currentPost.link.match(/(?:(?:\/(?:d|s|file|folder|folders)\/)|(?:id=)|(?:open=))([-\w]{25,})/)
        console.log(this.currentPost.link, driveFileId)
        if (driveFileId && driveFileId[1]) {
          this.ExternalAPIs.getDrivePreview(driveFileId[1])
        } else {
          this.websitePreviewObserver = this.ExternalAPIs.getWebsitePreview(linkurl).subscribe((websitePreview) => {
            this.currentPost.link = linkurl;
            this.currentPost.attachmentName = websitePreview['title'];
            this.currentLinkPreview.thumbnail = websitePreview['image'];
            this.currentLinkPreview.icon = websitePreview['icon'];
            this.ChangeDetector.detectChanges();
          }, (err) => {
            console.warn(err);
            this.linkURL = '';
            this.currentSnackBarRef = this.snackBar.open('Can\'t reach attached link:', linkurl, {
              duration: 7000,
              horizontalPosition: "start"
            })
            this.currentSnackBarRef.afterDismissed().toPromise().then(function (action) { if (action.dismissedByAction === true) window.open(linkurl) })
          })
        }
      }, 1000)
    }
    //https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url=http://haiku.york.org&rule=AvoidLandingPageRedirects&screenshot=true&strategy=desktop&fields=screenshot(data%2Cmime_type)%2Ctitle&key=AIzaSyCFXAknC9Fza_lsQBlRCAJJZbzQGDYr6mo
    //https://www.google.com/s2/favicons?domain_url=https://drive.google.com/drive/u/0/folders/0B5NVuDykezpkZVhzV3QzVDhhTXM
  }

  ngOnInit() {
    this.currentPost = this.inputPost
    this.DataHolder.classAndGroupState$.first().toPromise().then((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      this.yorkGroups = classesAndGroups['groups'];
      //only put here so that york classes must have loaded>
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
        this.ChangeDetector.detectChanges();
      });
    });
  }

  onLabelAndClassSearchInput(searchText) {
    this.labelAndClassSearchText = searchText;
    let currentPostLabels = this.currentPost.labels;
    let currentPostClasses = this.currentPost.classes;
    this.labelMissing = true;
    this.labels = this.labels.map((label) => {
      label.hidden = label.label.toLowerCase().indexOf(searchText.toLowerCase()) === -1 || undefined //!(currentPostLabels.includes(label.label) || !(label.label.toLowerCase().indexOf(searchText.toLowerCase()) === -1)) || undefined;
      if (label.hidden === undefined) this.labelMissing = false;
      return label;
    })
    if (this.classChooserExpanded === true) { }
    // for (const groupName in this.yorkGroups) {
    //   if (groupName.toLowerCase().indexOf(searchText.toLowerCase()) === -1) {
    //     this.yorkGroups[groupName].hidden = true;
    //   } else {
    //     delete this.yorkGroups[groupName].hidden;
    //   }
    // }
    //clearTimeout(this.throttleTimer['onLabelAndClassSearchInput']);
  }

  toggleLabel(label) {
    if (this.currentPost.labels[label] === true) {
      delete this.currentPost.labels[label]
    } else {
      this.currentPost.labels[label] = true;
      setTimeout(() => {
        console.log(document.getElementById("class_label_chips"));

        document.getElementById("class_label_chips").lastElementChild.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, 30)
    }
  }

  createLabel(newLabelText) {
    this.onLabelAndClassSearchInput('')
    this.currentPost.labels[newLabelText] = true;
    var usage = {}
    usage[this.currentPost.classes[0]] = 1
    this.labels.push({ label: newLabelText, usage: usage, totalUsage: this.currentPost.classes.length, new: true });
    this.labelMissing = false;
    this.ChangeDetector.detectChanges()
  }

  submitPost() {
    this.currentPost.description = this.descriptionElm.nativeElement.innerHTML
    console.log(this.currentPost)
    this.ServerAPIs.submitPost(this.currentPost).then((response: any) => {
      console.log(response);
      window.localStorage.removeItem("postDraftBackup")
    });
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
    this.labelsObserver.unsubscribe()
    if (this.currentPost.title || this.currentPost.description || this.currentPost.link) window.localStorage.setItem("postDraftBackup", JSON.stringify(this.currentPost));
    if (this.websitePreviewObserver) this.websitePreviewObserver.unsubscribe();
    if (this.currentSnackBarRef) this.currentSnackBarRef.dismiss()
    clearInterval(this.backupSetIntervalRef);
  }
}


