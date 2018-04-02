import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { ExternalApisService } from "../services/external-apis.service";

@Component({
  selector: 'app-new-post-bar',
  templateUrl: './new-post-bar.component.html',
  styleUrls: ['./new-post-bar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewPostBarComponent {

  constructor(private ExternalAPIs: ExternalApisService, ) {

  }

  openDrivePicker() {
    this.ExternalAPIs.openDriveFilePicker().then(console.log)
  }
  openShareDialog(fileid) {
    this.ExternalAPIs.openShareDialog(fileid).then(console.log)
  }
}
