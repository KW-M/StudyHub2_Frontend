import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataHolderService } from '../services/data-holder.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-class-selector',
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],
  encapsulation: ViewEncapsulation.None,
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassSelectorComponent implements OnInit, OnDestroy {
  signedinUserObserver: Subscription;
  classAndGroupObserver: Subscription;
  formattedYorkClasses = [];
  favoriteClasses = [];
  yorkGroups: any = [];
  favorites: any = [];

  constructor(private DataHolder: DataHolderService, private ChangeDetector: ChangeDetectorRef) {
    this.classAndGroupObserver = this.DataHolder.classAndGroupState$.subscribe((classesAndGroups) => {
      this.formattedYorkClasses = classesAndGroups['formattedClasses'];
      for (var group in classesAndGroups['groups']) {
        this.yorkGroups.push({
          name: group,
          hidden: false,
        })
      }
      this.updateSelections()
      this.signedinUserObserver = this.DataHolder.currentUserState$.subscribe((userObj: any) => {
        console.log(userObj)
        if (userObj) {
          this.favorites = userObj.favorites || []
          this.ChangeDetector.detectChanges();
        }
      });
    });
  }

  selectionValue: any = [];
  @Input('selection') set selectionInput(selection) {
    this.selectionValue = selection;
    this.updateSelections()
    console.log(selection)
  }

  searchText = '';
  @Input('filter-search') set searchInput(text: string) {
    console.log(text)
    this.searchText = text
    this.formattedYorkClasses.forEach(category => {
      category.classes.forEach(function (classObj) {
        classObj.hidden = (classObj.name.toLowerCase().indexOf(text.toLowerCase()) === -1) || undefined;
      })
    });
    this.yorkGroups.forEach(groupObj => {
      groupObj.hidden = (groupObj.name.toLowerCase().indexOf(text.toLowerCase()) === -1) || undefined;
    })
  };

  @Output('selection-change') selectionChange = new EventEmitter();

  // get selection() {
  //   return this.selectionValue;
  // }
  // set selection(value) {
  //   console.log(value)
  //   if (this.selectionValue != value) {
  //     this.selectionValue = value;

  //   }
  // }

  ngOnInit() {
    this.ChangeDetector.detectChanges()
  }

  // trackByClassNameFn(index, classObj) {
  //   return classObj.name
  // }

  // compareFn(class1, class2) {
  //   console.log(class1, class2)
  //   return class1 === class2
  // }

  // getClassColorString(className: string) {
  //   let colorObj = this.DataHolder.getClassObj(className).color
  //   if (colorObj) return 'hsl(' + colorObj.h + ',' + colorObj.s + '%,40%)'
  // }

  toggleSelected(classn) {
    classn.selected = !classn.selected || false;
    const index = this.selectionValue.indexOf(classn.name)
    if (index === -1) {
      if (classn.selected === true) this.selectionValue.push(classn.name)
    } else {
      if (classn.selected === false) this.selectionValue.splice(index, 1)
    }
    this.selectionChange.emit(this.selectionValue);
  }

  updateSelections() {
    console.log(this.selectionValue);
    if (this.selectionValue && this.selectionValue.length > 0) {
      if (this.yorkGroups && this.yorkGroups.length > 0) {
        this.yorkGroups.forEach(group => {
          this.selectionValue.forEach(selection => {
            group.selected = group.name == selection;
          })
        })
      }
      if (this.formattedYorkClasses && this.formattedYorkClasses.length > 0) {
        this.formattedYorkClasses.forEach(category => {
          category.classes.forEach((classObj) => {
            this.selectionValue.forEach(selection => {
              classObj.selected = classObj.name == selection
            })
          })
        });
      }
      this.yorkGroups = this.yorkGroups
      this.formattedYorkClasses = this.formattedYorkClasses;
      this.ChangeDetector.detectChanges();
    }
  }

  ngOnDestroy() {
    // this.classAndGroupObserver.unsubscribe();
    // if (this.signedinUserObserver) this.signedinUserObserver.unsubscribe()
  }
}
