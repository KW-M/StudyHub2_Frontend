//Component uses onPush change detection, things may not update automatically.
import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EventBoardService } from "../services/event-board.service";
import { ExternalApisService } from '../services/external-apis.service';

@Component({
  selector: 'app-speeddial',
  templateUrl: './speeddial.component.html',
  styleUrls: ['./speeddial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeeddialComponent implements OnInit {
  fab_open: boolean = false;
  fab_hidden: boolean = false;
  constructor(private EventBoard: EventBoardService, private changeDetector: ChangeDetectorRef, private ExternalAPIs: ExternalApisService) { }

  setFabOpen(open) {
    setTimeout(() => {
      this.fab_open = open;
      this.changeDetector.markForCheck()
    }, 3);
  }

  newPost() {
    this.EventBoard.openPostModal({}, 'edit')
  }

  openDrivePicker() {
    this.ExternalAPIs.openDriveFilePicker().then((selectedFile) => {
      console.log(selectedFile);
      if (selectedFile) this.EventBoard.openPostModal(selectedFile, 'edit')
    })
  }
  openUploadPicker() {
    this.ExternalAPIs.openFileUploadPicker().then((selectedFile) => {
      console.log(selectedFile);
      if (selectedFile) this.EventBoard.openPostModal(selectedFile, 'edit')
    })
  }

  ngOnInit() {
  }

}

