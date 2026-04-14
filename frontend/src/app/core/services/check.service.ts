import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CheckResult {
  id: string;
  endpoint: string;
  endpoint_name: string;
  status_code: number | null;
  response_time_ms: number;
  is_up: boolean;
  checked_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class CheckService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/check-results/';

  list(endpointId?: string): Observable<CheckResult[]> {
    const params = endpointId ? `?endpoint=${endpointId}` : '';
    return this.http.get<PaginatedResponse<CheckResult>>(`${this.apiUrl}${params}`).pipe(
      map(r => r.results)
    );
  }
}