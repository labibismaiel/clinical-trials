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
  private trialIds: string[] = [];
  private usedIds: Set<string> = new Set();

  constructor(private http: HttpClient) {
    this.fetchInitialTrials();
  }

  getTrials(): Observable<ClinicalTrial[]> {
    return this.trials.asObservable();
  }

  getFavorites(): Observable<ClinicalTrial[]> {
    return this.favorites.asObservable();
  }

  private async fetchTrialIds() {
    const params = {
      format: 'json',
      pageSize: '1000',
      fields: 'NCTId'
    };

    try {
      const response = await this.http.get<any>(this.apiUrl, { params }).toPromise();
      this.trialIds = response.studies.map((study: any) => study.protocolSection.identificationModule.nctId);
      console.log(`Fetched ${this.trialIds.length} trial IDs`);
    } catch (error) {
      console.error('Error fetching trial IDs:', error);
    }
  }

  private getRandomUnusedId(): string | null {
    const availableIds = this.trialIds.filter(id => !this.usedIds.has(id));
    if (availableIds.length === 0) {
      // If we've used all IDs, clear the used set and start over
      this.usedIds.clear();
      return this.trialIds[Math.floor(Math.random() * this.trialIds.length)];
    }
    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const selectedId = availableIds[randomIndex];
    this.usedIds.add(selectedId);
    return selectedId;
  }

  fetchRandomTrials() {
    const selectedId = this.getRandomUnusedId();
    if (!selectedId) return;

    this.http.get<any>(`${this.apiUrl}/${selectedId}`).subscribe(study => {
      if (!study) return;

      const newTrial: ClinicalTrial = {
        nctId: study.protocolSection.identificationModule.nctId,
        briefTitle: study.protocolSection.identificationModule.briefTitle,
        officialTitle: study.protocolSection.identificationModule.officialTitle,
        overallStatus: study.protocolSection.statusModule.overallStatus,
        phase: study.protocolSection.designModule?.phases?.[0],
        studyType: study.protocolSection.designModule?.studyType,
        condition: study.protocolSection.conditionsModule?.conditions?.[0],
        lastUpdatePosted: study.protocolSection.statusModule.lastUpdatePostDate,
        isFavorite: false
      };

      const currentTrials = this.trials.value;
      const currentFavorites = this.favorites.value;

      // Add favorite status
      newTrial.isFavorite = currentFavorites.some(fav => fav.nctId === newTrial.nctId);

      // Add new trial to the list, removing the oldest if we have 10 already
      let updatedTrials = currentTrials;
      if (currentTrials.length >= 10) {
        updatedTrials = [...currentTrials.slice(1), newTrial];
      } else {
        updatedTrials = [...currentTrials, newTrial];
      }

      this.trials.next(updatedTrials);
    });
  }

  fetchInitialTrials() {
    const params = {
      format: 'json',
      pageSize: '10'
    };
    console.log('fetching', this.apiUrl, params);
    this.http.get<any>(this.apiUrl, { params }).subscribe(response => {
      if (!response.studies) return;

      const trials = response.studies.map((study: any) => ({
        nctId: study.protocolSection.identificationModule.nctId,
        briefTitle: study.protocolSection.identificationModule.briefTitle,
        officialTitle: study.protocolSection.identificationModule.officialTitle,
        overallStatus: study.protocolSection.statusModule.overallStatus,
        phase: study.protocolSection.designModule?.phases?.[0],
        studyType: study.protocolSection.designModule?.studyType,
        condition: study.protocolSection.conditionsModule?.conditions?.[0],
        lastUpdatePosted: study.protocolSection.statusModule.lastUpdatePostDate,
        isFavorite: false
      }));

      const currentFavorites = this.favorites.value;
      const updatedTrials = trials.map((trial: ClinicalTrial) => ({
        ...trial,
        isFavorite: currentFavorites.some(fav => fav.nctId === trial.nctId)
      }));

      this.trials.next(updatedTrials);
    });
  }

  async toggleTimer(enabled: boolean) {
    if (enabled) {
      // Only fetch IDs the first time timer is enabled
      if (this.trialIds.length === 0) {
        await this.fetchTrialIds();
      }

      if (!this.timerSubscription) {
        this.timerSubscription = interval(5000).subscribe(() => {
          this.fetchRandomTrials();
        });
      }
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

  private convertApiTrialToModel(study: any): ClinicalTrial {
    return {
      nctId: study.protocolSection.identificationModule.nctId,
      briefTitle: study.protocolSection.identificationModule.briefTitle,
      officialTitle: study.protocolSection.identificationModule.officialTitle,
      overallStatus: study.protocolSection.statusModule.overallStatus,
      phase: study.protocolSection.designModule?.phases?.[0],
      studyType: study.protocolSection.designModule?.studyType,
      condition: study.protocolSection.conditionsModule?.conditions?.[0],
      lastUpdatePosted: study.protocolSection.statusModule.lastUpdatePostDate,
      isFavorite: false
    };
  }

  getTrialById(nctId: string): Observable<ClinicalTrial> {
    return this.http.get<any>(`${this.apiUrl}/${nctId}`).pipe(
      map(study => {
        const trial = this.convertApiTrialToModel(study);
        // Check if trial is in favorites
        const currentFavorites = this.favorites.value;
        trial.isFavorite = currentFavorites.some(fav => fav.nctId === trial.nctId);
        return trial;
      })
    );
  }
}
