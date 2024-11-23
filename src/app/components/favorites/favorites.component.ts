import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ClinicalTrialsService } from '../../services/clinical-trials.service';
import { ClinicalTrial } from '../../models/clinical-trial.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  favorites: ClinicalTrial[] = [];
  viewMode: 'card' | 'list' = 'card';

  constructor(private clinicalTrialsService: ClinicalTrialsService) {}

  ngOnInit() {
    this.clinicalTrialsService.getFavorites().subscribe(favorites => {
      this.favorites = favorites;
    });
  }

  removeFavorite(trial: ClinicalTrial) {
    this.clinicalTrialsService.toggleFavorite(trial);
  }
}
