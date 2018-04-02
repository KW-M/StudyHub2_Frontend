import { Component, ViewEncapsulation, Input, ViewChild, ViewChildren, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { WindowService } from "../services/window.service";
import { EventBoardService } from "../services/event-board.service";
import { DataHolderService } from "../services/data-holder.service";
import { ExternalApisService } from "../services/external-apis.service";
import { StudyhubServerApisService } from '../services/studyhub-server-apis.service';

@Component({
  selector: 'app-post-edit-view',
  templateUrl: './post-edit-view.component.html',
  styleUrls: ['./post-edit-view.component.scss', '../post-general-styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostEditViewComponent implements OnDestroy {
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
  yorkLabels;
  yorkGroups;
  yorkClasses;
  userFavorites;
  classAndGroupObserver;
  signedinUserObserver;
  backupSetIntervalRef;
  currentSnackBarRef;
  throttleTimer = {

  };
  constructor(private EventBoard: EventBoardService,
    private ExternalAPIs: ExternalApisService,
    private ServerAPIs: StudyhubServerApisService,
    private componentElem: ElementRef,
    private changeDetector: ChangeDetectorRef,
    private DataHolder: DataHolderService,
    public snackBar: MatSnackBar
  ) {
    this.currentPost = Object.assign({
      "id": null,
      "title": "",
      "link": "",
      "description": "",
      "likes": [],
      "labels": [],
      //"teachers": [],
      "classes": [],//<-
      "creator": {
        "email": null,
        "name": null,
      },
      "flagged": false,
      "creationDate": new Date(),
      "updateDate": new Date(),
    }, this.inputPost)
    console.log(this.currentPost)
    this.classAndGroupObserver = DataHolder.classAndGroupState$.subscribe((classesAndGroups) => {
      console.log(classesAndGroups)
      this.yorkLabels = classesAndGroups['classes'];
      this.yorkClasses = classesAndGroups['classes'];
      this.yorkGroups = classesAndGroups['groups'];
      this.userFavorites = classesAndGroups['favorites'];
      // this.changeDetector.detectChanges();
    });
    this.signedinUserObserver = this.DataHolder.currentUserState$.subscribe((userObj) => {
      this.signedinUser = userObj;
      if (this.currentPost.creator.email === null) this.currentPost.creator.email = userObj['email']
      if (this.currentPost.creator.name === null) this.currentPost.creator.name = userObj['name']
    })
    let backupPost = window.localStorage.getItem("postDraftBackup")
    let snackBarAction = null
    if (backupPost) {
      let backupPostObj = JSON.parse(backupPost);
      if (backupPostObj.title || backupPostObj.description || backupPostObj.link) {
        let snackBar = this.snackBar.open('Unsaved Draft Found', 'Restore', {
          duration: 20000,
          horizontalPosition: "start"
        })
      }
      this.currentSnackBarRef = snackBar;
      snackBar['afterDismissed']().toPromise().then((action) => {
        snackBarAction = action;
        if (action.dismissedByAction === true) {
          this.currentPost = JSON.parse(backupPost);
          this.onLinkInput(this.currentPost.link)
          this.changeDetector.detectChanges();
        }
      })
    }
    this.backupSetIntervalRef = setInterval(() => {
      this.currentPost.description = this.descriptionElm.nativeElement.innerHTML;
      console.log(this.currentPost);
      if (!this.currentSnackBarRef || snackBarAction) window.localStorage.setItem("postDraftBackup", JSON.stringify(this.currentPost));
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
        if (driveFileId) {
          console.log('driveURL', driveFileId)
          // this.ExternalAPIs.getDrivePreview(driveFileId[0])
        } else {
          this.websitePreviewObserver = this.ExternalAPIs.getWebsitePreview(linkurl).subscribe((websitePreview) => {
            this.currentPost.link = linkurl;
            this.currentPost.attachmentName = websitePreview['title'];
            this.currentLinkPreview.thumbnail = websitePreview['image'];
            this.currentLinkPreview.icon = websitePreview['icon'];
            this.changeDetector.detectChanges();
          }, (err) => {
            console.warn(err);
            this.linkURL = '';
            this.currentSnackBarRef = this.snackBar.open('Can\'t reach attached link:', linkurl, {
              duration: 9000,
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

  onLabelAndClassSearchInput(searchText) {
    this.labelAndClassSearchText = searchText;
    let currentPostLabels = this.currentPost.labels;
    let currentPostClasses = this.currentPost.classes;
    this.labelMissing = true
    this.yorkLabels = this.yorkClasses.map(function (label) {
      label.hidden = !(currentPostLabels.includes(label.name) || !(label.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1)) || undefined;
      if (label.hidden === undefined) this.labelMissing = false;
      return label;
    })
    if (this.classChooserExpanded === true) this.yorkClasses = this.yorkClasses.map(function (classObj) {
      classObj.hidden = !(currentPostClasses.includes(classObj.name) || !(classObj.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1)) || undefined;
      return classObj;
    })
    //clearTimeout(this.throttleTimer['onLabelAndClassSearchInput']);
  }

  toggleChipSelect(index) {
    this.labelChipList = this.labelChip.toArray();
    var chip = this.labelChipList[index]
    if (chip.selected) {
      chip.deselect();
      setTimeout(() => {
        this.changeDetector.markForCheck();
      });
    } else {
      chip.selectViaInteraction();
      console.log(chip._elementRef);
      setTimeout(() => {
        chip._elementRef.nativeElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }, 10);
    }
  }

  createLabel(newLabelText) {
    // this.visibleLabels.push(newLabelText)
    this.currentPost.labels.push(newLabelText)
    this.ServerAPIs.createLabel(newLabelText, this.currentPost.classes).then(console.log);
    this.changeDetector.detectChanges()
  }

  submitPost() {
    this.currentPost.description = this.descriptionElm.nativeElement.innerHTML
    this.ServerAPIs.submitPost(this.currentPost).then((response) => {
      console.log(response);
      window.localStorage.removeItem("postDraftBackup")
    }, console.warn);
    console.log(this.currentPost)
  }

  closeModal() {
    this.EventBoard.closePostModal()
  }

  ngOnDestroy() {
    this.classAndGroupObserver.unsubscribe()
    this.signedinUserObserver.unsubscribe()
    if (this.websitePreviewObserver) this.websitePreviewObserver.unsubscribe();
    if (this.currentSnackBarRef) this.currentSnackBarRef.dismiss()
    clearInterval(this.backupSetIntervalRef);
  }
}


