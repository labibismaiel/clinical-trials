import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { FavoritesComponent } from './favorites.component';
import { FavoritesService } from '../../services/favorites.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let fixture: ComponentFixture<FavoritesComponent>;
  let favoritesService: jasmine.SpyObj<FavoritesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT12345',
    briefTitle: 'Test Trial',
    officialTitle: 'Official Test Trial',
    overallStatus: 'Recruiting',
    phase: 'Phase 1',
    studyType: 'Interventional',
    condition: 'Test Condition',
    lastUpdatePosted: '2023-01-01',
    isFavorite: true
  };

  const favoritesSubject = new BehaviorSubject<ClinicalTrial[]>([mockTrial]);

  beforeEach(async () => {
    const favoritesServiceSpy = jasmine.createSpyObj('FavoritesService', ['removeFromFavorites'], {
      favorites$: of([mockTrial])
    });

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        FavoritesComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: FavoritesService, useValue: favoritesServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
    favoritesService = TestBed.inject(FavoritesService) as jasmine.SpyObj<FavoritesService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with favorites from service', () => {
    expect(component.favorites).toEqual([mockTrial]);
    expect(component.loading).toBeFalsy();
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      component.loading = true;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      const loadingText = fixture.debugElement.query(By.css('.loading-text'));

      expect(spinner).toBeTruthy();
      expect(loadingText.nativeElement.textContent).toContain('Loading favorites...');
    });

    it('should show empty state when no favorites', () => {
      favoritesSubject.next([]);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState.nativeElement.textContent).toContain('You haven\'t added any trials to your favorites yet.');
    });
  });

  describe('removeFavorite', () => {
    it('should remove trial from favorites', () => {
      favoritesService.removeFromFavorites.and.returnValue(undefined);
      component.removeFavorite(mockTrial);

      expect(favoritesService.removeFromFavorites).toHaveBeenCalledWith(mockTrial.nctId);
    });

    it('should handle error when removing favorite', () => {
      favoritesService.removeFromFavorites.and.throwError('Test error');

      expect(() => component.removeFavorite(mockTrial)).toThrow('Test error');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error removing trial from favorites',
        '✕',
        jasmine.any(Object)
      );
    });
  });

  describe('view mode', () => {
    it('should initialize with card view', () => {
      expect(component.viewMode).toBe('card');
    });

    it('should allow switching between card and list view', () => {
      component.viewMode = 'list';
      expect(component.viewMode).toBe('list');

      component.viewMode = 'card';
      expect(component.viewMode).toBe('card');
    });

    it('should update view mode through button toggle', () => {
      const listButton = fixture.debugElement.query(By.css('mat-button-toggle[value="list"]'));
      listButton.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(component.viewMode).toBe('list');
    });
  });

  describe('navigation', () => {
    it('should navigate to trial details when trial is clicked', () => {
      const trialCard = fixture.debugElement.query(By.css('app-trial-card'));
      trialCard.triggerEventHandler('click', null);

      expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = component['subscriptions'][0];
      const unsubscribeSpy = spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
