import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objKeys',
  pure: false,
})
export class ObjKeysPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    return Object.keys(value)//.map(key => value[key]);
  }
}
