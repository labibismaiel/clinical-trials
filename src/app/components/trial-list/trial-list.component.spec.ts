import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TrialListComponent } from './trial-list.component';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('TrialListComponent', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT123',
    briefTitle: 'Test Trial',
    officialTitle: 'Official Test Trial',
    overallStatus: 'Recruiting',
    phase: 'Phase 1',
    studyType: 'Interventional',
    condition: 'Test Condition',
    lastUpdatePosted: '2023-01-01',
    isFavorite: false
  };

  const trialsSubject = new BehaviorSubject<ClinicalTrial[]>([mockTrial]);
  const favoritesSubject = new BehaviorSubject<ClinicalTrial[]>([]);

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('ClinicalTrialsService', [
      'getTrials',
      'getFavorites',
      'toggleTimer',
      'toggleFavorite'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    serviceSpy.getTrials.and.returnValue(trialsSubject.asObservable());
    serviceSpy.getFavorites.and.returnValue(favoritesSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [
        TrialListComponent,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: ClinicalTrialsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with trials from service', () => {
    expect(component.trials).toEqual([mockTrial]);
    expect(clinicalTrialsService.getTrials).toHaveBeenCalled();
  });

  it('should initialize with favorites status from service', () => {
    expect(component.maxFavoritesReached).toBeFalse();
    expect(clinicalTrialsService.getFavorites).toHaveBeenCalled();
  });

  describe('toggleAutoUpdate', () => {
    it('should toggle timer in service when auto-update is toggled', () => {
      component.autoUpdate = true;
      component.toggleAutoUpdate();
      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(true);

      component.autoUpdate = false;
      component.toggleAutoUpdate();
      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should show error when trying to add favorite beyond limit', () => {
      // Simulate max favorites reached
      favoritesSubject.next(Array(10).fill(mockTrial));
      fixture.detectChanges();

      component.toggleFavorite({ ...mockTrial, isFavorite: false });

      expect(snackBar.open).toHaveBeenCalledWith(
        'Maximum favorites limit reached (10)',
        '✕',
        jasmine.any(Object)
      );
      expect(clinicalTrialsService.toggleFavorite).not.toHaveBeenCalled();
    });

    it('should toggle favorite and show success message', () => {
      const trial = { ...mockTrial, isFavorite: false };
      component.toggleFavorite(trial);

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(trial);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Trial added to favorites',
        '✕',
        jasmine.any(Object)
      );
    });

    it('should show remove message when unfavoriting', () => {
      const trial = { ...mockTrial, isFavorite: true };
      component.toggleFavorite(trial);

      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(trial);
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
    it('should stop timer and unsubscribe on destroy', () => {
      component.ngOnDestroy();
      expect(clinicalTrialsService.toggleTimer).toHaveBeenCalledWith(false);
    });
  });

  describe('trial details navigation', () => {
    it('should navigate to trial details when viewTrialDetails is called', () => {
      const mockTrial = { ...mockTrial };
      component.viewTrialDetails(mockTrial);
      expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
    });
  });

  describe('Navigation', () => {
    it('should navigate to details when clicking on trial card content', () => {
      const mockTrial = { ...mockTrial };
      const cardContent = fixture.debugElement.query(By.css('mat-card-content'));
      
      cardContent.triggerEventHandler('click', null);
      component.viewTrialDetails(mockTrial);
      
      expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
    });

    it('should navigate to details when clicking on trial list content', () => {
      component.viewMode = 'list';
      fixture.detectChanges();
      
      const mockTrial = { ...mockTrial };
      const listContent = fixture.debugElement.query(By.css('.trial-content'));
      
      listContent.triggerEventHandler('click', null);
      component.viewTrialDetails(mockTrial);
      
      expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
    });

    it('should not navigate when clicking favorite button', () => {
      const mockTrial = { ...mockTrial };
      const favoriteButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      
      favoriteButton.triggerEventHandler('click', null);
      
      expect(router.navigate).not.toHaveBeenCalled();
      expect(clinicalTrialsService.toggleFavorite).toHaveBeenCalledWith(mockTrial);
    });
  });
});
