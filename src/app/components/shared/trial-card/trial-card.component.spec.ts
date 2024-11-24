import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TrialCardComponent } from './trial-card.component';
import { ClinicalTrial } from '../../../models/clinical-trial.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

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
        TrialCardComponent,
        NoopAnimationsModule
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
    const statusEl = fixture.debugElement.query(By.css('.status'));
    const phaseEl = fixture.debugElement.query(By.css('.phase'));

    expect(titleEl.nativeElement.textContent).toContain(mockTrial.briefTitle);
    expect(statusEl.nativeElement.textContent).toContain(mockTrial.overallStatus);
    expect(phaseEl.nativeElement.textContent).toContain(mockTrial.phase);
  });

  it('should display trial information in list mode', () => {
    component.viewMode = 'list';
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('.trial-title'));
    const statusEl = fixture.debugElement.query(By.css('.status'));

    expect(titleEl.nativeElement.textContent).toContain(mockTrial.briefTitle);
    expect(statusEl.nativeElement.textContent).toContain(mockTrial.overallStatus);
  });

  it('should emit favoriteToggled event when favorite button is clicked', () => {
    spyOn(component.favoriteToggled, 'emit');
    const favoriteButton = fixture.debugElement.query(By.css('.favorite-button'));

    favoriteButton.triggerEventHandler('click', null);

    expect(component.favoriteToggled.emit).toHaveBeenCalledWith(mockTrial);
  });

  it('should navigate to trial details when clicking on trial content', () => {
    const cardContent = fixture.debugElement.query(By.css('mat-card-content'));

    cardContent.triggerEventHandler('click', null);

    expect(router.navigate).toHaveBeenCalledWith(['/trial', mockTrial.nctId]);
  });

  it('should prevent navigation when clicking favorite button', () => {
    const favoriteButton = fixture.debugElement.query(By.css('.favorite-button'));
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    favoriteButton.triggerEventHandler('click', event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should handle missing trial data gracefully', () => {
    component.trial = {
      ...mockTrial,
      phase: undefined,
      condition: undefined
    };
    fixture.detectChanges();

    const phaseEl = fixture.debugElement.query(By.css('.phase'));
    const conditionEl = fixture.debugElement.query(By.css('.condition'));

    expect(phaseEl.nativeElement.textContent).toContain('Not Specified');
    expect(conditionEl.nativeElement.textContent).toContain('Not Specified');
  });

  it('should show correct favorite icon based on trial status', () => {
    // Test unfavorited state
    let favoriteIcon = fixture.debugElement.query(By.css('mat-icon'));
    expect(favoriteIcon.nativeElement.textContent).toContain('favorite_border');

    // Test favorited state
    component.trial = { ...mockTrial, isFavorite: true };
    fixture.detectChanges();
    favoriteIcon = fixture.debugElement.query(By.css('mat-icon'));
    expect(favoriteIcon.nativeElement.textContent).toContain('favorite');
  });
});
