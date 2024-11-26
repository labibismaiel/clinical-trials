import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ClinicalTrial } from '../models/clinical-trial.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favoriteTrials';
  private readonly MAX_FAVORITES = 10;
  private favoritesSubject = new BehaviorSubject<ClinicalTrial[]>(this.loadFavorites());
  readonly favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    // Initialize favorites from local storage
    this.loadFavorites();
  }

  private loadFavorites(): ClinicalTrial[] {
    try {
      const storedFavorites = localStorage.getItem(this.STORAGE_KEY);
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      return [];
    }
  }

  private saveFavorites(favorites: ClinicalTrial[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      this.favoritesSubject.next(favorites);
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
      throw new Error('Failed to save favorites');
    }
  }

  addToFavorites(trial: ClinicalTrial): void {
    const currentFavorites = this.favoritesSubject.value;
    
    if (currentFavorites.length >= this.MAX_FAVORITES) {
      throw new Error(`Maximum number of favorites (${this.MAX_FAVORITES}) reached`);
    }

    if (!currentFavorites.some(t => t.nctId === trial.nctId)) {
      const updatedFavorites = [...currentFavorites, { ...trial, isFavorite: true }];
      this.saveFavorites(updatedFavorites);
    }
  }

  removeFromFavorites(trialId: string): void {
    const currentFavorites = this.favoritesSubject.value;
    const updatedFavorites = currentFavorites.filter(trial => trial.nctId !== trialId);
    
    if (updatedFavorites.length === currentFavorites.length) {
      console.warn(`Trial with ID ${trialId} not found in favorites`);
      return;
    }

    this.saveFavorites(updatedFavorites);
  }

  isFavorite(trialId: string): boolean {
    return this.favoritesSubject.value.some(trial => trial.nctId === trialId);
  }

  getFavoritesCount(): number {
    return this.favoritesSubject.value.length;
  }

  clearFavorites(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.favoritesSubject.next([]);
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw new Error('Failed to clear favorites');
    }
  }

  isMaxFavoritesReached(): boolean {
    return this.favoritesSubject.value.length >= this.MAX_FAVORITES;
  }
}
