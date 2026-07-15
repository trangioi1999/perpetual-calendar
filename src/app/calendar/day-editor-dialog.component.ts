import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CalendarCell, DAY_TYPE_CONFIG, DAY_TYPES, DayType } from './day-info.model';

export interface DayEditorData {
  cell: CalendarCell;
}

export type DayEditorResult =
  | { action: 'save'; dayType: DayType; name: string; note: string }
  | { action: 'delete' };

/** Dialog chỉnh sửa loại ngày + tên + ghi chú của 1 ô lịch. */
@Component({
  selector: 'app-day-editor-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      Ngày {{ data.cell.solarDay }}/{{ data.cell.date.getMonth() + 1 }}/{{
        data.cell.date.getFullYear()
      }}
      <span class="lunar-subtitle">
        Âm lịch: {{ data.cell.lunar.day }}/{{ data.cell.lunar.month
        }}{{ data.cell.lunar.isLeapMonth ? 'n' : '' }}
      </span>
    </h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Loại ngày</mat-label>
        <mat-select [(ngModel)]="dayType">
          @for (type of dayTypes; track type) {
            <mat-option [value]="type">{{ dayTypeConfig[type].label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tên / nhãn</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Ví dụ: Quốc khánh 2/9" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Ghi chú</mat-label>
        <textarea matInput rows="3" [(ngModel)]="note" placeholder="Ghi chú thêm..."></textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions>
      @if (data.cell.info) {
        <button matButton class="delete-button" (click)="remove()">Xoá</button>
      }
      <span class="spacer"></span>
      <button matButton mat-dialog-close>Huỷ</button>
      <button matButton="filled" (click)="save()">Lưu</button>
    </mat-dialog-actions>
  `,
  styles: `
    .lunar-subtitle {
      display: block;
      font-size: 0.8rem;
      font-weight: 400;
      color: var(--mat-sys-on-surface-variant);
    }

    mat-dialog-content {
      padding-top: 0.5rem;
    }

    .full-width {
      display: block;
      width: 100%;
    }

    .spacer {
      flex: 1;
    }

    .delete-button {
      color: var(--mat-sys-error);
    }
  `,
})
export class DayEditorDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<DayEditorDialogComponent, DayEditorResult>>(MatDialogRef);
  readonly data = inject<DayEditorData>(MAT_DIALOG_DATA);

  readonly dayTypes = DAY_TYPES;
  readonly dayTypeConfig = DAY_TYPE_CONFIG;

  dayType: DayType =
    this.data.cell.info?.dayType ?? (this.data.cell.isSunday ? 'WEEKEND' : 'WORKING');
  name = this.data.cell.info?.name ?? '';
  note = this.data.cell.info?.note ?? '';

  save(): void {
    this.dialogRef.close({
      action: 'save',
      dayType: this.dayType,
      name: this.name,
      note: this.note,
    });
  }

  remove(): void {
    this.dialogRef.close({ action: 'delete' });
  }
}
