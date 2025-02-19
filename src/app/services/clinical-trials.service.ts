import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of, throwError, firstValueFrom } from 'rxjs';
import { catchError, map, retry, take, tap, finalize } from 'rxjs/operators';
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
  private trials = new BehaviorSubject<ClinicalTrial[]>([]);
  private timerSubscription: any;
  private trialIds: string[] = [];
  private usedIds: Set<string> = new Set();
  private isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private favoritesService: FavoritesService
  ) {
    // Subscribe to favorites changes
    this.favoritesService.favorites$.subscribe(favorites => {
      const favoriteIds = new Set(favorites.map(f => f.nctId));
      const currentTrials = this.trials.value;
      const updatedTrials = currentTrials.map(trial => ({
        ...trial,
        isFavorite: favoriteIds.has(trial.nctId)
      }));
      this.saveTrialsToStorage(updatedTrials);
      this.trials.next(updatedTrials);
    });
  }

  getTrials(): Observable<ClinicalTrial[]> {
    return this.trials.asObservable();
  }

  getLoadingState(): Observable<boolean> {
    return this.isLoading.asObservable();
  }

  getTrialById(id: string): Observable<ClinicalTrial> {
    return this.http.get<ClinicalTrialsApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (!response) {
          throw new Error('No trial found with the specified ID');
        }
        return this.mapApiResponseToTrial(response);
      }),
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
    if (this.trialIds.length === 0 || !this.timerSubscription) return;

    const selectedId = this.getRandomUnusedId();
    if (!selectedId) return;

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
            const currentTrials = this.trials.value;
            let updatedTrials: ClinicalTrial[];

            if (currentTrials.length >= this.maxTrials) {
              // Remove first trial and add new one at the end
              updatedTrials = [...currentTrials.slice(1), newTrial];
            } else {
              // Just add the new trial at the end
              updatedTrials = [...currentTrials, newTrial];
            }

            this.trials.next(updatedTrials);
            this.saveTrialsToStorage(updatedTrials);
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

  fetchInitialTrials(): Observable<ClinicalTrial[]> {
    this.isLoading.next(true);
    return this.http.get<ClinicalTrialsApiResponse>(this.apiUrl,
      { params: new HttpParams().set('format', 'json').set('pageSize', String(this.maxTrials)) })
      .pipe(
        retry(3),
        catchError((error) => {
          console.error('Error fetching initial trials:', error);
          this.isLoading.next(false);
          this.trials.next([]);
          return throwError(() => error);
        }),
        finalize(() => {
          this.isLoading.next(false);
        }),
        map(response => {
          if (response?.studies && response.studies.length > 0) {
            const trials = response.studies
              .slice(0, this.maxTrials)
              .map(study => this.mapApiResponseToTrial(study));
            this.trials.next(trials);
            this.saveTrialsToStorage(trials);
            return trials;
          } else {
            console.error('No studies found in the API response');
            this.trials.next([]);
            return [];
          }
        })
      );
  }

  async toggleTimer(enabled: boolean): Promise<void> {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }

    if (enabled) {
      try {
        const params = new HttpParams()
          .set('format', 'json')
          .set('pageSize', '1000')
          .set('fields', 'NCTId');

        const response = await firstValueFrom(
          this.http.get<ClinicalTrialsApiResponse>(this.apiUrl, { params }).pipe(
            retry(3),
            catchError((error) => {
              console.error('Error fetching trial IDs:', error);
              return throwError(() => error);
            })
          )
        );

        if (response?.studies) {
          this.trialIds = response.studies.map(study =>
            study.protocolSection.identificationModule.nctId
          );
          // Fetch initial random trial immediately
          this.fetchRandomTrials();
          // Then set up the interval for subsequent fetches
          this.timerSubscription = interval(this.fetchInterval)
            .pipe(
              tap(() => this.fetchRandomTrials())
            )
            .subscribe();
        }
      } catch (error) {
        console.error('Error fetching trial IDs:', error);
        throw error;
      }
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

      const currentTrials = this.trials.value;
      const updatedTrials = currentTrials.map(t =>
        t.nctId === trial.nctId ? updatedTrial : t
      );
      this.saveTrialsToStorage(updatedTrials);
      this.trials.next(updatedTrials);

      return of(updatedTrial);
    } catch (error) {
      return throwError(() => error);
    }
  }
}
