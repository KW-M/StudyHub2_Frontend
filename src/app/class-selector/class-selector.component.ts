import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataHolderService } from '../services/data-holder.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-class-selector',
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassSelectorComponent implements OnInit, OnDestroy {
  selectionValue: any;
  signedinUserObserver: Subscription;
  yorkGroups: any;
  classAndGroupObserver: Subscription;
  formattedYorkClasses = [];
  favoriteClasses = [];
  searchText = '';

  @Input('filter-search') set filterText(text: string) {
    console.log('got name: ', text);
    this.searchText = text
    this.formattedYorkClasses.forEach(category => {
      category.classes.forEach(function (classObj) {
        classObj.hidden = (classObj.name.toLowerCase().indexOf(text.toLowerCase()) === -1) || undefined;
      })
    });
  };

  constructor(private DataHolder: DataHolderService, private ChangeDetector: ChangeDetectorRef) {
    this.DataHolder.classAndGroupState$.first().toPromise().then((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      this.yorkGroups = classesAndGroups['groups'];
      this.signedinUserObserver = this.DataHolder.currentUserState$.subscribe((userObj: any) => {
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
  @Input() get selection() {
    console.log('hello')
    return ''//this.selectionValue;
  }
  @Output() selectionChange = new EventEmitter();
  set selection(value) {
    console.log('by')
    //this.selectionValue = value;
    //this.selectionChange.emit(this.selectionValue);
  }

  ngOnInit() {
    this.ChangeDetector.detectChanges()
  }

  trackByClassNameFn(index, classObj) {
    return classObj.name
  }

  getClassColorString(className: string) {
    console.log(this.selection)
    let colorObj = this.DataHolder.getClassObj(className).color
    if (colorObj) return 'hsl(' + colorObj.h + ',' + colorObj.s + '%,40%)'
  }

  ngOnDestroy() {
    this.signedinUserObserver.unsubscribe()
  }
}
