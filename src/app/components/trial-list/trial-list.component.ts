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
import { Router } from '@angular/router';

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
    private snackBar: MatSnackBar,
    private router: Router
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clinicalTrialsService.toggleTimer(false);
  }

  toggleAutoUpdate() {
    // No need to set this.autoUpdate as it's handled by ngModel
    this.clinicalTrialsService.toggleTimer(this.autoUpdate);
  }

  toggleFavorite(trial: ClinicalTrial) {
    if (!trial.isFavorite && this.maxFavoritesReached) {
      this.showNotification('Maximum favorites limit reached (10)', 'error');
      return;
    }

    this.clinicalTrialsService.toggleFavorite(trial);
    this.showNotification(
      trial.isFavorite ? 'Trial removed from favorites' : 'Trial added to favorites'
    );
  }

  viewTrialDetails(trial: ClinicalTrial) {
    this.router.navigate(['/trial', trial.nctId]);
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
