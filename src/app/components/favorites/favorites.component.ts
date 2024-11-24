import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FavoritesService } from '../../services/favorites.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';
import { TrialCardComponent } from '../shared/trial-card/trial-card.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    TrialCardComponent
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favorites: ClinicalTrial[] = [];
  viewMode: 'card' | 'list' = 'card';
  loading = true;
  private subscriptions: Subscription[] = [];

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    const subscription = this.favoritesService.favorites$.subscribe(favorites => {
      this.favorites = favorites;
      this.loading = false;
    });
    this.subscriptions.push(subscription);
  }

  removeFavorite(trial: ClinicalTrial): void {
    this.favoritesService.removeFromFavorites(trial.nctId);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
