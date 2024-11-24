import { Component, OnInit } from '@angular/core';
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
export class FavoritesComponent implements OnInit {
  favorites: ClinicalTrial[] = [];
  viewMode: 'card' | 'list' = 'card';
  loading = true;

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.favoritesService.favorites$.subscribe(favorites => {
      this.favorites = favorites;
      this.loading = false;
    });
  }

  removeFavorite(trial: ClinicalTrial): void {
    this.favoritesService.removeFromFavorites(trial.nctId);
  }
}
