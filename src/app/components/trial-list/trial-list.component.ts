import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
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
    MatButtonToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './trial-list.component.html',
  styleUrls: ['./trial-list.component.scss']
})
export class TrialListComponent implements OnInit, OnDestroy {
  trials: ClinicalTrial[] = [];
  autoUpdate = false;
  viewMode: 'card' | 'list' = 'card';
  maxFavoritesReached = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private clinicalTrialsService: ClinicalTrialsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.clinicalTrialsService.getTrials().subscribe(trials => {
        this.trials = trials;
      }),
      this.clinicalTrialsService.getFavorites().subscribe(favorites => {
        this.maxFavoritesReached = favorites.length >= 10;
      })
    );
    this.clinicalTrialsService.fetchRandomTrials();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clinicalTrialsService.toggleTimer(false);
  }

  toggleAutoUpdate() {
    this.autoUpdate = !this.autoUpdate;
    this.clinicalTrialsService.toggleTimer(this.autoUpdate);
  }

  toggleFavorite(trial: ClinicalTrial) {
    if (trial.isFavorite) {
      this.clinicalTrialsService.removeFavorite(trial);
      this.showNotification('Trial removed from favorites');
    } else {
      if (this.maxFavoritesReached) {
        this.showNotification('Maximum favorites limit reached (10)', 'error');
        return;
      }
      this.clinicalTrialsService.addFavorite(trial);
      this.showNotification('Trial added to favorites');
    }
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: [type === 'error' ? 'error-snackbar' : 'success-snackbar']
    });
  }
}
