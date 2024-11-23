import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { Router } from '@angular/router';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct title', () => {
    expect(component.title).toEqual('Clinical Trials Explorer');
  });

  it('should display the title in the toolbar', () => {
    const toolbar = fixture.debugElement.query(By.css('.app-toolbar'));
    expect(toolbar.nativeElement.textContent).toContain('Clinical Trials Explorer');
  });

  describe('Navigation', () => {
    it('should have navigation links', () => {
      const links = fixture.debugElement.queryAll(By.css('nav a'));
      expect(links.length).toBe(2);
      
      const [trialsLink, favoritesLink] = links;
      expect(trialsLink.nativeElement.textContent).toContain('Trials');
      expect(favoritesLink.nativeElement.textContent).toContain('Favorites');
    });

    it('should have correct router links', () => {
      const links = fixture.debugElement.queryAll(By.css('nav a'));
      const [trialsLink, favoritesLink] = links;
      
      expect(trialsLink.attributes['routerLink']).toBe('/');
      expect(favoritesLink.attributes['routerLink']).toBe('/favorites');
    });

    it('should have icons in navigation links', () => {
      const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
      expect(icons.length).toBe(2);
      
      const [trialsIcon, favoritesIcon] = icons;
      expect(trialsIcon.nativeElement.textContent).toContain('list');
      expect(favoritesIcon.nativeElement.textContent).toContain('favorite');
    });
  });

  describe('Layout', () => {
    it('should have a toolbar', () => {
      const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
      expect(toolbar).toBeTruthy();
      expect(toolbar.classes['app-toolbar']).toBeTrue();
    });

    it('should have a main content area', () => {
      const main = fixture.debugElement.query(By.css('main'));
      expect(main).toBeTruthy();
      expect(main.classes['app-content']).toBeTrue();
    });

    it('should have a router outlet', () => {
      const outlet = fixture.debugElement.query(By.css('router-outlet'));
      expect(outlet).toBeTruthy();
    });
  });
});
