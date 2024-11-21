import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ClinicalTrial } from '../models/clinical-trial.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicalTrialsService {

  private apiUrl = 'https://clinicaltrials.gov/api/v2/studies';
  private trials = new BehaviorSubject<ClinicalTrial[]>([]);
  private favorites = new BehaviorSubject<ClinicalTrial[]>([]);
  private timerSubscription: any;

  constructor(private http: HttpClient) {}

  getTrials(): Observable<ClinicalTrial[]> {
    return this.trials.asObservable();
  }

  getFavorites(): Observable<ClinicalTrial[]> {
    return this.favorites.asObservable();
  }

  fetchRandomTrials() {
    const params = {
      format: 'json',
      pageSize: '10'
    };

    this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => response.studies.map((study: any) => ({
        nctId: study.protocolSection.identificationModule.nctId,
        briefTitle: study.protocolSection.identificationModule.briefTitle,
        officialTitle: study.protocolSection.identificationModule.officialTitle,
        overallStatus: study.protocolSection.statusModule.overallStatus,
        phase: study.protocolSection.designModule?.phases?.[0],
        studyType: study.protocolSection.designModule?.studyType,
        condition: study.protocolSection.conditionsModule?.conditions?.[0],
        lastUpdatePosted: study.protocolSection.statusModule.lastUpdatePostDate,
        isFavorite: false
      })))
    ).subscribe((trials:ClinicalTrial[]) => {
      const currentFavorites = this.favorites.value;
      const updatedTrials = trials.map((trial:ClinicalTrial) => ({
        ...trial,
        isFavorite: currentFavorites.some((fav) => fav.nctId === trial.nctId)
      }));
      this.trials.next(updatedTrials);
    });
  }

  toggleTimer(enabled: boolean) {
    if (enabled && !this.timerSubscription) {
      this.timerSubscription = interval(5000).subscribe(() => {
        this.fetchRandomTrials();
      });
    } else if (!enabled && this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  toggleFavorite(trial: ClinicalTrial) {
    const currentFavorites = this.favorites.value;
    const isFavorite = currentFavorites.some(fav => fav.nctId === trial.nctId);

    if (isFavorite) {
      const updatedFavorites = currentFavorites.filter(fav => fav.nctId !== trial.nctId);
      this.favorites.next(updatedFavorites);
    } else if (currentFavorites.length < 10) {
      this.favorites.next([...currentFavorites, { ...trial, isFavorite: true }]);
    }

    // Update the trial in the trials list
    const currentTrials = this.trials.value;
    const updatedTrials = currentTrials.map(t =>
      t.nctId === trial.nctId ? { ...t, isFavorite: !isFavorite } : t
    );
    this.trials.next(updatedTrials);
  }

  addFavorite(trial: ClinicalTrial) {
    const currentFavorites = this.favorites.value;
    if (currentFavorites.length < 10) {
      const updatedFavorites = [...currentFavorites, { ...trial, isFavorite: true }];
      this.favorites.next(updatedFavorites);

      // Update the trial in the trials list
      const currentTrials = this.trials.value;
      const updatedTrials = currentTrials.map(t =>
        t.nctId === trial.nctId ? { ...t, isFavorite: true } : t
      );
      this.trials.next(updatedTrials);
    }
  }

  removeFavorite(trial: ClinicalTrial) {
    const currentFavorites = this.favorites.value;
    const updatedFavorites = currentFavorites.filter(fav => fav.nctId !== trial.nctId);
    this.favorites.next(updatedFavorites);

    // Update the trial in the trials list
    const currentTrials = this.trials.value;
    const updatedTrials = currentTrials.map(t =>
      t.nctId === trial.nctId ? { ...t, isFavorite: false } : t
    );
    this.trials.next(updatedTrials);
  }
}
