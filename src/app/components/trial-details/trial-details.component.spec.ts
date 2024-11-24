import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TrialDetailsComponent } from './trial-details.component';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

describe('TrialDetailsComponent', () => {
  let component: TrialDetailsComponent;
  let fixture: ComponentFixture<TrialDetailsComponent>;
  let clinicalTrialsService: jasmine.SpyObj<ClinicalTrialsService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let route: any;

  const mockTrial: ClinicalTrial = {
    nctId: 'NCT123',
    briefTitle: 'Test Trial',
    officialTitle: 'Official Test Trial',
    overallStatus: 'Recruiting',
    phase: 'Phase 1',
    studyType: 'Interventional',
    condition: 'Test Condition',
    lastUpdatePosted: '2023-01-01',
    isFavorite: false,
    description: 'Test description',
    enrollment: 100,
    interventions: ['Test intervention'],
    locations: ['Test location']
  };

  beforeEach(async () => {
    const clinicalTrialsServiceSpy = jasmine.createSpyObj('ClinicalTrialsService', ['getTrialById', 'toggleFavorite']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routeStub = {
      paramMap: of(new Map([['id', 'NCT123']]))
    };

    await TestBed.configureTestingModule({
      imports: [
        TrialDetailsComponent,
        BrowserAnimationsModule
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: routeStub
        },
        { provide: ClinicalTrialsService, useValue: clinicalTrialsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    clinicalTrialsService = TestBed.inject(ClinicalTrialsService) as jasmine.SpyObj<ClinicalTrialsService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    route = TestBed.inject(ActivatedRoute);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrialDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load trial details on init', fakeAsync(() => {
      clinicalTrialsService.getTrialById.and.returnValue(of(mockTrial));
      
      fixture.detectChanges();
      tick();

      expect(component.trial).toEqual(mockTrial);
      expect(component.loading).toBeFalse();
      expect(component.error).toBeFalse();
    }));

    it('should handle missing trial ID', fakeAsync(() => {
      route.paramMap = of(new Map());
      
      fixture.detectChanges();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should handle null trial ID', fakeAsync(() => {
      route.paramMap = of(new Map([['id', null]]));
      
      fixture.detectChanges();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should handle error when loading trial details', fakeAsync(() => {
      clinicalTrialsService.getTrialById.and.returnValue(throwError(() => new Error('Test error')));
      
      fixture.detectChanges();
      tick();

      expect(component.trial).toBeNull();
      expect(component.loading).toBeFalse();
      expect(component.error).toBeTrue();
    }));

    it('should handle empty trial response', fakeAsync(() => {
      clinicalTrialsService.getTrialById.and.returnValue(throwError(() => new Error('Not found')));
      
      fixture.detectChanges();
      tick();

      expect(component.trial).toBeNull();
      expect(component.loading).toBeFalse();
      expect(component.error).toBeTrue();
    }));
  });

  describe('UI states', () => {
    it('should show loading spinner when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const loadingEl = fixture.debugElement.query(By.css('mat-spinner'));
      expect(loadingEl).toBeTruthy();
    });

    it('should show error message when error is true', () => {
      component.error = true;
      fixture.detectChanges();
      
      const errorEl = fixture.debugElement.query(By.css('.error-container'));
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent).toContain('Error loading trial details');
    });

    it('should display trial information when trial is loaded', () => {
      component.trial = mockTrial;
      fixture.detectChanges();

      const titleEl = fixture.debugElement.query(By.css('mat-card-title'));
      expect(titleEl.nativeElement.textContent).toContain(mockTrial.briefTitle);
    });

    it('should handle missing optional trial fields', () => {
      const partialTrial = { ...mockTrial };
      delete partialTrial.description;
      delete partialTrial.enrollment;
      delete partialTrial.interventions;
      delete partialTrial.locations;

      component.trial = partialTrial;
      fixture.detectChanges();

      const descriptionEl = fixture.debugElement.query(By.css('.description'));
      expect(descriptionEl.nativeElement.textContent).toContain('Not available');
    });
  });

  describe('favorite functionality', () => {
    it('should toggle favorite status', fakeAsync(() => {
      component.trial = { ...mockTrial };
      clinicalTrialsService.toggleFavorite.and.returnValue(of({ ...mockTrial, isFavorite: true }));
      
      component.toggleFavorite();
      tick();

      expect(component.trial.isFavorite).toBeTrue();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Trial added to favorites',
        '✕',
        jasmine.any(Object)
      );
    }));

    it('should handle error when toggling favorite', fakeAsync(() => {
      component.trial = { ...mockTrial };
      clinicalTrialsService.toggleFavorite.and.returnValue(throwError(() => new Error('Test error')));
      
      component.toggleFavorite();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error updating favorite status',
        '✕',
        jasmine.any(Object)
      );
    }));

    it('should not attempt to toggle favorite if trial is null', fakeAsync(() => {
      component.trial = null;
      
      component.toggleFavorite();
      tick();

      expect(clinicalTrialsService.toggleFavorite).not.toHaveBeenCalled();
    }));
  });

  describe('navigation', () => {
    it('should navigate back when goBack is called', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should call goBack when back button is clicked', () => {
      spyOn(component, 'goBack');
      const backButton = fixture.debugElement.query(By.css('.back-button button'));
      
      backButton.triggerEventHandler('click', null);
      
      expect(component.goBack).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up subscriptions on destroy', () => {
      const unsubscribeSpy = spyOn(
        component['subscriptions'][0],
        'unsubscribe'
      );
      
      component.ngOnDestroy();
      
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle multiple subscriptions', () => {
      // Add a second subscription
      component['subscriptions'].push(
        of(true).subscribe()
      );

      const unsubscribeSpy1 = spyOn(
        component['subscriptions'][0],
        'unsubscribe'
      );
      const unsubscribeSpy2 = spyOn(
        component['subscriptions'][1],
        'unsubscribe'
      );
      
      component.ngOnDestroy();
      
      expect(unsubscribeSpy1).toHaveBeenCalled();
      expect(unsubscribeSpy2).toHaveBeenCalled();
    });
  });
});
