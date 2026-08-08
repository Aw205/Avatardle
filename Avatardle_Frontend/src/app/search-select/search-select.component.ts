import { Component, computed, effect, ElementRef, input, output, Signal, signal, viewChild, viewChildren, WritableSignal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HyphenatePipe } from '../pipes/hyphenate.pipe';

@Component({
  selector: 'search-select',
  imports: [TranslatePipe, HyphenatePipe],
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.css',
})
export class SearchSelectComponent {

  searchVal: WritableSignal<string> = signal('');
  isOpen: WritableSignal<boolean> = signal(false);
  options = input.required<string[]>();
  mode = input.required<string>();
  disabled = input(false);
  displayValue = input('');
  showSettings = input(false);
  activeIndex: WritableSignal<number> = signal(0);
  optionSelect = output<string>();
  settingsClick = output<void>();
  filteredOptions: Signal<string[]> = computed(() => {
    let val = this.searchVal().toLowerCase();
    return this.options().filter(option => val != '' && option.toLowerCase().includes(val));
  });
  inputElement = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  optionElements = viewChildren<ElementRef<HTMLElement>>('optionEle');

  constructor() {
    effect(() => {
      this.searchVal.set(this.disabled() ? this.displayValue() : '');
      this.activeIndex.set(0);
    });
  }

  onInput(event: Event) {
    if (this.disabled()) return;
    const inputElement = event.target as HTMLInputElement;
    this.searchVal.set(inputElement.value);
    this.activeIndex.set(0);
  }

  onKeyDown(event: KeyboardEvent) {

    if (this.disabled() || !this.isOpen() || this.filteredOptions().length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => Math.min(i + 1, this.filteredOptions().length - 1));
        this.scrollActiveOptionIntoView();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, 0));
        this.scrollActiveOptionIntoView();
        break;

      case 'Enter':
        event.preventDefault();
        this.selectOption(this.filteredOptions()[this.activeIndex()]);
        break;

      case 'Escape':
        this.isOpen.set(false);
        break;
    }
  }

  selectOption(option: string) {
    if (this.disabled()) return;
    this.optionSelect.emit(option);
    this.searchVal.set('');
    this.activeIndex.set(0);
  }

  focus() {
    this.inputElement()?.nativeElement.focus();
  }

  private scrollActiveOptionIntoView() {
    this.optionElements()[this.activeIndex()]?.nativeElement.scrollIntoView({
      block: 'nearest',
    });
  }
}
