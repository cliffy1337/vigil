import { Component, OnInit, inject, Inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Chart, registerables } from 'chart.js';
import { EndpointService, Endpoint } from '../../core/services/endpoint.service';
import { CheckService, CheckResult } from '../../core/services/check.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSnackBarModule
  ],
  template: `
    <div class="dashboard">
      <div class="header">
        <h1>Uptime Monitor</h1>
        <button mat-raised-button color="primary" (click)="openEndpointForm()">+ Add Endpoint</button>
      </div>

      <div class="summary">
        <mat-card>
          <mat-card-title>Total Endpoints</mat-card-title>
          <div class="big-number">{{ endpoints().length }}</div>
        </mat-card>
        <mat-card>
          <mat-card-title>Up Now</mat-card-title>
          <div class="big-number">{{ upCount() }}</div>
        </mat-card>
        <mat-card>
          <mat-card-title>Down Now</mat-card-title>
          <div class="big-number">{{ downCount() }}</div>
        </mat-card>
      </div>

      <mat-card>
        <mat-card-title>Response Time (last 20 checks)</mat-card-title>
        <canvas id="responseChart"></canvas>
      </mat-card>

      <mat-card>
        <mat-card-title>Endpoints</mat-card-title>
        <table mat-table [dataSource]="endpoints()" class="mat-elevation-z0">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Name </th>
            <td mat-cell *matCellDef="let e"> {{e.name}} </td>
          </ng-container>
          <ng-container matColumnDef="url">
            <th mat-header-cell *matHeaderCellDef> URL </th>
            <td mat-cell *matCellDef="let e"> {{e.url}} </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let e">
              <span [class.up]="getLastStatus(e)?.is_up" [class.down]="!getLastStatus(e)?.is_up">
                {{ getLastStatus(e)?.is_up ? 'UP' : 'DOWN' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button (click)="checkNow(e.id)" title="Check now"><mat-icon>refresh</mat-icon></button>
              <button mat-icon-button (click)="openEndpointForm(e)" title="Edit"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="deleteEndpoint(e.id)" title="Delete"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary mat-card { flex: 1; text-align: center; }
    .big-number { font-size: 48px; font-weight: bold; margin-top: 10px; }
    .up { color: green; font-weight: bold; }
    .down { color: red; font-weight: bold; }
    table { width: 100%; }
    mat-card { margin-bottom: 30px; padding: 20px; }
  `]
})
export class DashboardComponent implements OnInit {
  private endpointService = inject(EndpointService);
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  endpoints = signal<Endpoint[]>([]);
  checks = signal<CheckResult[]>([]);
  displayedColumns = ['name', 'url', 'status', 'actions'];
  chart: Chart | null = null;

  upCount = computed(() => {
    return this.endpoints().filter(e => this.getLastStatus(e)?.is_up).length;
  });

  downCount = computed(() => {
    return this.endpoints().length - this.upCount();
  });

  constructor() {
    effect(() => {
      this.updateChart();
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.endpointService.list().subscribe({
      next: (endpoints) => {
        this.endpoints.set(endpoints);
        this.loadChecks();
      },
      error: () => this.snackBar.open('Failed to load endpoints', 'Close', { duration: 3000 })
    });
  }

  loadChecks() {
    this.checkService.list().subscribe({
      next: (checks) => {
        this.checks.set(checks);
      },
      error: () => this.snackBar.open('Failed to load checks', 'Close', { duration: 3000 })
    });
  }

  getLastStatus(endpoint: Endpoint): CheckResult | undefined {
    return this.checks().find(c => c.endpoint === endpoint.id);
  }

  updateChart() {
    const latestChecks = this.checks().slice(0, 20).reverse();
    const ctx = document.getElementById('responseChart') as HTMLCanvasElement;
    if (this.chart) this.chart.destroy();
    if (ctx && latestChecks.length > 0) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: latestChecks.map(c => new Date(c.checked_at).toLocaleTimeString()),
          datasets: [{
            label: 'Response time (ms)',
            data: latestChecks.map(c => c.response_time_ms),
            borderColor: '#3f51b5',
            fill: false
          }]
        }
      });
    }
  }

  openEndpointForm(endpoint?: Endpoint) {
    const dialogRef = this.dialog.open(EndpointFormDialog, {
      data: endpoint || { name: '', url: '', interval_minutes: 5, is_active: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Fix: Ensure URL has protocol and interval is a number
        let finalUrl = result.url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl;
        }

        const payload = {
          ...result,
          url: finalUrl,
          interval_minutes: Number(result.interval_minutes)
        };

        if (endpoint?.id) {
          this.endpointService.update(endpoint.id, payload).subscribe({
            next: () => {
              this.snackBar.open('Endpoint updated', 'Close', { duration: 2000 });
              this.loadData();
            },
            error: () => this.snackBar.open('Update failed', 'Close', { duration: 3000 })
          });
        } else {
          this.endpointService.create(payload).subscribe({
            next: () => {
              this.snackBar.open('Endpoint created', 'Close', { duration: 2000 });
              this.loadData();
            },
            error: () => this.snackBar.open('Creation failed', 'Close', { duration: 3000 })
          });
        }
      }
    });
  }

  checkNow(id: string) {
    this.endpointService.checkNow(id).subscribe({
      next: () => {
        this.snackBar.open('Check queued', 'Close', { duration: 2000 });
        setTimeout(() => this.loadData(), 2000);
      },
      error: () => this.snackBar.open('Failed to trigger check', 'Close', { duration: 3000 })
    });
  }

  deleteEndpoint(id: string) {
    if (confirm('Delete this endpoint?')) {
      this.endpointService.delete(id).subscribe({
        next: () => this.loadData(),
        error: () => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
      });
    }
  }
}

@Component({
  selector: 'endpoint-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.id ? 'Edit' : 'Add' }} Endpoint</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field fullWidth>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <mat-form-field fullWidth>
          <mat-label>URL</mat-label>
          <input matInput formControlName="url" placeholder="https://example.com" required>
          <mat-hint>Must include http:// or https://</mat-hint>
          <mat-error *ngIf="form.get('url')?.hasError('pattern')">
            Please enter a valid URL (e.g., https://google.com)
          </mat-error>
        </mat-form-field>
        <mat-form-field fullWidth>
          <mat-label>Interval (minutes)</mat-label>
          <input matInput type="number" formControlName="interval_minutes">
        </mat-form-field>
        <mat-slide-toggle formControlName="is_active">Active</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-form-field { width: 100%; margin-bottom: 16px; }
    mat-slide-toggle { margin: 16px 0; display: block; }
  `]
})
export class EndpointFormDialog {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EndpointFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      // Regex pattern to enforce protocol requirement
      url: [data?.url || '', [Validators.required, Validators.pattern('^https?://.+')]],
      interval_minutes: [data?.interval_minutes || 5, [Validators.required, Validators.min(1)]],
      is_active: [data?.is_active !== undefined ? data.is_active : true]
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}