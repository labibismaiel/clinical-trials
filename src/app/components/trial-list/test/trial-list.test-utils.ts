import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ClinicalTrial } from '../../../models/clinical-trial.model';

@Component({
  selector: 'app-trial-card',
  template: '',
  standalone: true,
  imports: [CommonModule]
})
export class MockTrialCardComponent {
  @Input() trial!: ClinicalTrial;
  @Input() isFavorite!: boolean;
  @Input() viewMode: 'card' | 'list' = 'card';
  @Input() maxFavoritesReached = false;
  @Output() favoriteToggled = new EventEmitter<ClinicalTrial>();
  @Output() trialClicked = new EventEmitter<ClinicalTrial>();
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
