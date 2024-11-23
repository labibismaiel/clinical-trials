import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { FavoritesComponent } from './favorites.component';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let fixture: ComponentFixture<FavoritesComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT123',
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
    const serviceSpy = jasmine.createSpyObj('ClinicalTrialsService', [
      'getFavorites',
      'toggleFavorite'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    serviceSpy.getFavorites.and.returnValue(favoritesSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [
        FavoritesComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with favorites from service', () => {
    expect(component.favorites).toEqual([mockTrial]);
    expect(clinicalTrialsService.getFavorites).toHaveBeenCalled();
  });

  describe('toggleFavorite', () => {
    it('should remove trial from favorites', () => {
      component.toggleFavorite(mockTrial);
      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Trial removed from favorites',
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
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const unsubscribeSpy = spyOn(
        component['subscriptions'][0],
        'unsubscribe'
      );
      
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
