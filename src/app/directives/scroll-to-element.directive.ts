import { Directive, ElementRef, HostListener, Input, NgZone } from '@angular/core';

@Directive({
  selector: '[appScrollToElement]'
})
export class ScrollToElementDirective {
  @Input('appScrollToElement') scrollPosition: string; //supports 'start' (top), 'center', & 'end' (bottom)
  constructor(private Element: ElementRef, private zone: NgZone) {
    let clickTimeout = null;
    zone.runOutsideAngular(() => {
      Element.nativeElement.addEventListener('focus', () => {
        setTimeout(() => {
          if (clickTimeout === null) {
            this.scrollIntoView()
          }
        }, 100);
      })
      Element.nativeElement.addEventListener('mousedown', () => {
        clickTimeout = setTimeout(() => {
          clickTimeout = null;
        }, 300);
      })
      Element.nativeElement.addEventListener('touchend', () => {
        window.addEventListener("resize", () => {
          setTimeout(() => {
            this.scrollIntoView();
          }, 500);
        })
      })
    })
  }

  scrollIntoView() {
    try { window.removeEventListener("resize", this.scrollIntoView); } catch { }
    this.Element.nativeElement.scrollIntoView(this.scrollPosition !== 'top');
    this.Element.nativeElement.scrollIntoView({ behavior: "smooth", block: this.scrollPosition || 'center', inline: "center" });
  }

}
