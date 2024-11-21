import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trial-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule
  ],
  templateUrl: './trial-list.component.html',
  styleUrls: ['./trial-list.component.scss']
})
export class TrialListComponent implements OnInit, OnDestroy {
  trials: ClinicalTrial[] = [];
  autoUpdate = false;
  maxFavoritesReached = false;
  viewMode: 'card' | 'list' = 'card';
  private subscriptions: Subscription[] = [];

  constructor(private clinicalTrialsService: ClinicalTrialsService) {}

  ngOnInit() {
    // Subscribe to trials updates
    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe(trials => {
        this.trials = trials;
      })
    );

    // Subscribe to favorites updates to check max limit
    this.subscriptions.push(
      this.clinicalTrialsService.getFavorites().subscribe(favorites => {
        this.maxFavoritesReached = favorites.length >= 10;
      })
    );

    // Initial fetch of trials
    this.clinicalTrialsService.fetchRandomTrials();
  }

  ngOnDestroy() {
    // Clean up subscriptions and stop timer
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clinicalTrialsService.toggleTimer(false);
  }

  toggleAutoUpdate() {
    this.autoUpdate = !this.autoUpdate;
    this.clinicalTrialsService.toggleTimer(this.autoUpdate);
  }

  toggleFavorite(trial: ClinicalTrial) {
    this.clinicalTrialsService.toggleFavorite(trial);
  }
}
