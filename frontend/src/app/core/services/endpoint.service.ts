import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  interval_minutes: number;
  is_active: boolean;
  last_alert_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class EndpointService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/endpoints/';

  list(): Observable<Endpoint[]> {
    return this.http.get<PaginatedResponse<Endpoint>>(this.apiUrl).pipe(
      map(r => r.results)
    );
  }

  create(data: Partial<Endpoint>): Observable<Endpoint> {
    return this.http.post<Endpoint>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Endpoint>): Observable<Endpoint> {
    return this.http.patch<Endpoint>(`${this.apiUrl}${id}/`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`);
  }

  checkNow(id: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}${id}/check_now/`, {});
  }
}