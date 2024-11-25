import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TrialCardComponent } from './trial-card.component';
import { ClinicalTrial } from '../../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('TrialCardComponent', () => {
  let component: TrialCardComponent;
  let fixture: ComponentFixture<TrialCardComponent>;
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

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        TrialCardComponent
      ],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrialCardComponent);
    component = fixture.componentInstance;
    component.trial = mockTrial;
    component.viewMode = 'card';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display trial information in card mode', () => {
    const titleEl = fixture.debugElement.query(By.css('mat-card-title'));
    const detailsEl = fixture.debugElement.queryAll(By.css('.detail-row .value'));

    expect(titleEl.nativeElement.textContent).toContain(mockTrial.briefTitle);
    expect(detailsEl[0].nativeElement.textContent.trim()).toBe(mockTrial.overallStatus);
    expect(detailsEl[1].nativeElement.textContent.trim()).toBe(mockTrial.phase);
  });

  it('should display trial information in list mode', () => {
    component.viewMode = 'list';
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('h3'));
    const detailsEl = fixture.debugElement.queryAll(By.css('.trial-list-details span'));

    expect(titleEl.nativeElement.textContent).toContain(mockTrial.briefTitle);
    expect(detailsEl[0].nativeElement.textContent).toContain(mockTrial.overallStatus);
  });

  it('should emit favoriteToggled event when favorite button is clicked', () => {
    spyOn(component.favoriteToggled, 'emit');
    const favoriteButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
    
    favoriteButton.nativeElement.click();
    
    expect(component.favoriteToggled.emit).toHaveBeenCalledWith(mockTrial);
  });

  it('should navigate to trial details when clicking on trial content', () => {
    const card = fixture.debugElement.query(By.css('mat-card'));
    
    card.nativeElement.click();
    
    expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
  });

  it('should prevent navigation when clicking favorite button', () => {
    const favoriteButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
    
    favoriteButton.nativeElement.click();
    
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle missing trial data gracefully', () => {
    component.trial = {
      ...mockTrial,
      phase: undefined,
      condition: undefined
    };
    fixture.detectChanges();

    const phaseEl = fixture.debugElement.query(By.css('.detail-row:nth-child(2)'));
    const conditionEl = fixture.debugElement.query(By.css('.detail-row:nth-child(3)'));

    expect(phaseEl).toBeNull();
    expect(conditionEl).toBeNull();
  });
});
