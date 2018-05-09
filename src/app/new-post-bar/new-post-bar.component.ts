import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { ExternalApisService } from "../services/external-apis.service";
import { EventBoardService } from '../services/event-board.service';

@Component({
  selector: 'app-new-post-bar',
  templateUrl: './new-post-bar.component.html',
  styleUrls: ['./new-post-bar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewPostBarComponent {

  constructor(private ExternalAPIs: ExternalApisService, private EventBoard: EventBoardService) {

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
}
