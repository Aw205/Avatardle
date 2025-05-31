import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hyphenate'
})
export class HyphenatePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(/\s/g, '_');
  }

}
