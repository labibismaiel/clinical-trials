import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ClinicalTrial } from '../../../models/clinical-trial.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trial-card',
  template: `
    <div class="trial-card" (click)="onTrialClick()">
      Mock Trial Card: {{trial?.briefTitle}}
    </div>
  `
})
export class MockTrialCardComponent {
  @Input() trial!: ClinicalTrial;
  @Input() viewMode: 'card' | 'list' = 'card';
  @Input() maxFavoritesReached = false;
  @Output() trialClicked = new EventEmitter<ClinicalTrial>();
  @Output() favoriteToggled = new EventEmitter<ClinicalTrial>();

  onTrialClick(): void {
    this.trialClicked.emit(this.trial);
  }
}

export const mockTrial: ClinicalTrial = {
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
  interventions: ['Test intervention'],
  locations: ['Test location']
};

export const createTestSubjects = () => {
  const trialsSubject = new BehaviorSubject<ClinicalTrial[]>([mockTrial]);
  const favoritesSubject = new BehaviorSubject<ClinicalTrial[]>([]);
  const loadingSubject = new BehaviorSubject<boolean>(false);

  return {
    trialsSubject,
    favoritesSubject,
    loadingSubject
  };
};
