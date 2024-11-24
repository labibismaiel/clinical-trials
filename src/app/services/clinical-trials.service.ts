import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of, throwError } from 'rxjs';
import { catchError, map, retry, take, tap } from 'rxjs/operators';
import { ClinicalTrial } from '../models/clinical-trial.model';
import { ClinicalTrialsApiResponse } from '../models/clinical-trials-api.model';
import { FavoritesService } from './favorites.service';

@Injectable({
  providedIn: 'root'
})
export class ClinicalTrialsService {
  private readonly apiUrl = 'https://clinicaltrials.gov/api/v2/studies';
  private readonly maxTrials = 10;
  private readonly fetchInterval = 5000; // 5 seconds
  private readonly STORAGE_KEY = 'clinical_trials';
  private trials = new BehaviorSubject<ClinicalTrial[]>(this.loadTrialsFromStorage());
  private timerSubscription: any;
  private trialIds: string[] = [];
  private usedIds: Set<string> = new Set();
  private isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private favoritesService: FavoritesService
  ) {
    this.fetchInitialTrials();
  }

  getTrials(): Observable<ClinicalTrial[]> {
    return this.trials.asObservable();
  }

  getLoadingState(): Observable<boolean> {
    return this.isLoading.asObservable();
  }

  getTrialById(id: string): Observable<ClinicalTrial> {
    return this.http.get<ClinicalTrial>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private async fetchTrialIds(): Promise<void> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', '1000')
      .set('fields', 'NCTId');

    try {
      const response = await this.http.get<ClinicalTrialsApiResponse>(this.apiUrl, { params })
        .pipe(
          retry(3),
          catchError(this.handleError)
        ).toPromise();

      if (response?.studies) {
        this.trialIds = response.studies.map(study => 
          study.protocolSection.identificationModule.nctId
        );
        console.log(`Fetched ${this.trialIds.length} trial IDs`);
      }
    } catch (error) {
      console.error('Error fetching trial IDs:', error);
      throw error;
    }
  }

  private getRandomUnusedId(): string | null {
    if (!this.trialIds.length) return null;

    const availableIds = this.trialIds.filter(id => !this.usedIds.has(id));
    if (availableIds.length === 0) {
      this.usedIds.clear();
      return this.trialIds[Math.floor(Math.random() * this.trialIds.length)];
    }
    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const selectedId = availableIds[randomIndex];
    this.usedIds.add(selectedId);
    return selectedId;
  }

  private mapApiResponseToTrial(study: any): ClinicalTrial {
    console.log('Mapping study:', study);
    const trial: ClinicalTrial = {
      nctId: study.protocolSection?.identificationModule?.nctId,
      briefTitle: study.protocolSection?.identificationModule?.briefTitle,
      officialTitle: study.protocolSection?.identificationModule?.officialTitle,
      overallStatus: study.protocolSection?.statusModule?.overallStatus,
      phase: study.protocolSection?.designModule?.phases?.[0],
      studyType: study.protocolSection?.designModule?.studyType,
      condition: study.protocolSection?.conditionsModule?.conditions?.[0],
      lastUpdatePosted: study.protocolSection?.statusModule?.lastUpdatePostDate,
      description: study.protocolSection?.descriptionModule?.briefSummary,
      interventions: study.protocolSection?.armsInterventionsModule?.interventions?.map(
        (i: any) => `${i.interventionType}: ${i.interventionName}`
      ),
      locations: study.protocolSection?.contactsLocationsModule?.locations?.map(
        (l: any) => `${l.facility}, ${l.city}, ${l.country}`
      ),
      isFavorite: false
    };

    return {
      ...trial,
      isFavorite: this.favoritesService.isFavorite(trial.nctId)
    };
  }

  private loadTrialsFromStorage(): ClinicalTrial[] {
    try {
      const storedTrials = localStorage.getItem(this.STORAGE_KEY);
      return storedTrials ? JSON.parse(storedTrials) : [];
    } catch (error) {
      console.error('Error loading trials from storage:', error);
      return [];
    }
  }

  private saveTrialsToStorage(trials: ClinicalTrial[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trials));
    } catch (error) {
      console.error('Error saving trials to storage:', error);
    }
  }

  fetchRandomTrials(): void {
    const selectedId = this.getRandomUnusedId();
    if (!selectedId) return;

    console.log('Fetching trial with ID:', selectedId);
    this.isLoading.next(true);
    this.http.get<ClinicalTrialsApiResponse>(`${this.apiUrl}/${selectedId}`)
      .pipe(
        retry(3),
        catchError(this.handleError),
        tap(() => this.isLoading.next(false))
      )
      .subscribe({
        next: (response) => {
          try {
            const newTrial = this.mapApiResponseToTrial(response);
            console.log('New trial:', newTrial);
            
            // Get current trials and create a new array
            const currentTrials = [...this.trials.value];
            console.log('Current trials before update:', currentTrials);

            // If we have max trials, remove the oldest one and add new one at the end
            if (currentTrials.length >= this.maxTrials) {
              console.log('At max trials, removing oldest and adding new one');
              // Get the trial being removed
              const removedTrial = currentTrials[0];
              if (removedTrial.isFavorite) {
                console.log('Removing trial from favorites:', removedTrial.nctId);
                this.favoritesService.removeFromFavorites(removedTrial.nctId);
              }

              // Remove the first (oldest) trial and add new one at the end
              const updatedTrials = [...currentTrials.slice(1), newTrial];
              console.log('Updated trials:', updatedTrials);
              this.saveTrialsToStorage(updatedTrials);
              this.trials.next(updatedTrials);
            } else {
              console.log('Adding new trial to the list');
              // Add to the existing array
              const updatedTrials = [...currentTrials, newTrial];
              console.log('Updated trials:', updatedTrials);
              this.saveTrialsToStorage(updatedTrials);
              this.trials.next(updatedTrials);
            }
          } catch (error) {
            console.error('Error processing trial:', error);
          }
        },
        error: (error) => {
          console.error('Error fetching random trial:', error);
          this.isLoading.next(false);
        }
      });
  }

  fetchInitialTrials(): void {
    // If we have trials in localStorage, don't fetch initial trials
    if (this.trials.value.length > 0) {
      console.log('Using trials from localStorage:', this.trials.value);
      return;
    }

    console.log('No trials in localStorage, fetching from API');
    const params = new HttpParams()
      .set('format', 'json')
      .set('pageSize', String(this.maxTrials));

    this.isLoading.next(true);
    this.http.get<ClinicalTrialsApiResponse>(this.apiUrl, { params })
      .pipe(
        retry(3),
        catchError(this.handleError),
        tap(() => this.isLoading.next(false))
      )
      .subscribe({
        next: (response) => {
          try {
            const newTrial = this.mapApiResponseToTrial(response);
            console.log('Fetched initial trial from API:', newTrial);
            this.saveTrialsToStorage([newTrial]);
            this.trials.next([newTrial]);
          } catch (error) {
            console.error('Error processing response:', error);
          }
        },
        error: (error) => {
          console.error('Error fetching initial trials:', error);
          this.isLoading.next(false);
        }
      });
  }

  async toggleTimer(enabled: boolean): Promise<void> {
    try {
      console.log('Toggle timer called with enabled:', enabled);
      
      // Clean up existing subscription if any
      if (this.timerSubscription) {
        console.log('Cleaning up existing subscription');
        this.timerSubscription.unsubscribe();
        this.timerSubscription = null;
      }

      if (enabled) {
        if (this.trialIds.length === 0) {
          console.log('Fetching trial IDs');
          await this.fetchTrialIds();
          console.log('Fetched trial IDs:', this.trialIds.length);
        }

        // Fetch immediately
        console.log('Initial fetch');
        this.fetchRandomTrials();

        // Start new subscription
        console.log('Starting timer subscription');
        this.timerSubscription = interval(this.fetchInterval).subscribe(() => {
          console.log('Timer triggered, fetching new trial');
          this.fetchRandomTrials();
        });
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
      throw error;
    }
  }

  toggleFavorite(trial: ClinicalTrial): Observable<ClinicalTrial> {
    const updatedTrial = { ...trial, isFavorite: !trial.isFavorite };
    
    try {
      if (updatedTrial.isFavorite) {
        this.favoritesService.addToFavorites(updatedTrial);
      } else {
        this.favoritesService.removeFromFavorites(updatedTrial.nctId);
      }

      // Update the trial in the trials list
      const currentTrials = this.trials.value;
      const updatedTrials = currentTrials.map(t =>
        t.nctId === trial.nctId ? updatedTrial : t
      );
      this.saveTrialsToStorage(updatedTrials); // Save to storage before updating BehaviorSubject
      this.trials.next(updatedTrials);

      return of(updatedTrial);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
