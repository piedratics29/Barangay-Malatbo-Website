import {TestBed} from '@angular/core/testing';
import {App} from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should only keep the header sticky while scrolling down', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.isBrowser.set(true);

    Object.defineProperty(window, 'scrollY', {writable: true, configurable: true, value: 100});
    Object.defineProperty(document.documentElement, 'scrollTop', {
      writable: true,
      configurable: true,
      value: 100,
    });
    app.onWindowScroll();
    expect(app.headerSticky()).toBeTrue();

    Object.defineProperty(window, 'scrollY', {writable: true, configurable: true, value: 60});
    Object.defineProperty(document.documentElement, 'scrollTop', {
      writable: true,
      configurable: true,
      value: 60,
    });
    app.onWindowScroll();
    expect(app.headerSticky()).toBeFalse();
  });
});
