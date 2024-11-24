import { Injectable } from '@angular/core';
import { ClinicalTrial } from '../models/clinical-trial.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favoriteTrials';
  private favoritesSubject = new BehaviorSubject<ClinicalTrial[]>(this.loadFavorites());
  favorites$ = this.favoritesSubject.asObservable();

  constructor() {}

  private loadFavorites(): ClinicalTrial[] {
    const storedFavorites = localStorage.getItem(this.STORAGE_KEY);
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  }

  private saveFavorites(favorites: ClinicalTrial[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    this.favoritesSubject.next(favorites);
  }

  addToFavorites(trial: ClinicalTrial) {
    const currentFavorites = this.favoritesSubject.value;
    if (!currentFavorites.some(t => t.nctId === trial.nctId)) {
      const updatedFavorites = [...currentFavorites, { ...trial, isFavorite: true }];
      this.saveFavorites(updatedFavorites);
    }
  }

  removeFromFavorites(trialId: string) {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(trial => trial.nctId !== trialId);
    this.saveFavorites(updatedFavorites);
  }

  getFavorites(): ClinicalTrial[] {
    return this.favoritesSubject.value;
  }

  isFavorite(trialId: string): boolean {
    return this.favoritesSubject.value.some(trial => trial.nctId === trialId);
  }
}
