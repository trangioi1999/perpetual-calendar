import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  DayEditorDialogComponent,
  DayEditorResult,
} from './day-editor-dialog.component';
import {
  CalendarCell,
  DAY_TYPES,
  DAY_TYPE_CONFIG,
  DayInfo,
  toIsoDate,
} from './day-info.model';
import { LunarCalendarService, LunarDate } from './lunar-calendar.service';

/**
 * Lịch vạn niên xem theo tháng — common UI component, dùng lại được ở mọi app:
 *
 * ```html
 * <app-perpetual-calendar
 *   [dayInfos]="dayInfos()"
 *   [editable]="true"
 *   (dayInfoChange)="onSave($event)"
 *   (dayInfoDelete)="onDelete($event)"
 *   (monthChange)="onMonthChange($event)" />
 * ```
 *
 * - `dayInfos`: danh sách note/ngày nghỉ từ backend, hiển thị badge trên ô ngày.
 * - Khi `editable`, click vào ô ngày sẽ mở MatDialog chỉnh sửa loại ngày + ghi chú;
 *   component emit `dayInfoChange` (upsert) / `dayInfoDelete` — việc gọi API
 *   lưu trữ do phía sử dụng quyết định, component không tự gọi HTTP.
 * - Màu sắc đọc từ Material system tokens (--mat-sys-*) nên tự khớp theme
 *   Angular Material của app, kể cả dark mode.
 */
@Component({
  selector: 'app-perpetual-calendar',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './perpetual-calendar.component.html',
  styleUrl: './perpetual-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerpetualCalendarComponent {
  private readonly lunarService = inject(LunarCalendarService);
  private readonly dialog = inject(MatDialog);

  /** Dữ liệu ngày (note, ngày nghỉ...) do bên ngoài truyền vào. */
  readonly dayInfos = input<DayInfo[]>([]);
  /** Cho phép click ô ngày để chỉnh sửa hay chỉ xem. */
  readonly editable = input(true);
  /** Ngày khởi tạo tháng đang xem (mặc định: hôm nay). */
  readonly initialDate = input<Date>(new Date());

  /** Emit khi người dùng lưu (tạo mới hoặc cập nhật) thông tin 1 ngày. */
  readonly dayInfoChange = output<DayInfo>();
  /** Emit khi người dùng xoá thông tin 1 ngày. */
  readonly dayInfoDelete = output<DayInfo>();
  /** Emit khi chuyển tháng đang xem. */
  readonly monthChange = output<{ month: number; year: number }>();

  /** Tuần bắt đầu Thứ 2, Chủ nhật đứng cột cuối. */
  readonly weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  readonly dayTypeConfig = DAY_TYPE_CONFIG;
  /** Danh sách loại ngày cho chú thích ở góc trên. */
  readonly dayTypeEntries = DAY_TYPES.map((type) => ({
    type,
    ...DAY_TYPE_CONFIG[type],
  }));
  readonly pickerMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  /** Tháng (1-12) / năm dương lịch đang xem. */
  readonly viewMonth = signal(this.initialDate().getMonth() + 1);
  readonly viewYear = signal(this.initialDate().getFullYear());

  /** Các chỉnh sửa cục bộ, phủ lên dayInfos() để UI phản hồi ngay khi lưu. */
  private readonly localEdits = signal<ReadonlyMap<string, DayInfo | null>>(new Map());

  /** Month picker thả xuống từ tiêu đề tháng. */
  readonly pickerOpen = signal(false);
  readonly pickerYear = signal(this.viewYear());

  readonly title = computed(() => `Tháng ${this.viewMonth()}, ${this.viewYear()}`);

  /** Can chi của năm âm lịch ứng với ngày giữa tháng đang xem. */
  readonly yearCanChi = computed(() => {
    const [, , lunarYear] = this.lunarService.convertSolar2Lunar(
      15,
      this.viewMonth(),
      this.viewYear(),
    );
    return `Năm ${this.lunarService.getYearCanChi(lunarYear)}`;
  });

  /** Map date ISO -> DayInfo sau khi gộp input với chỉnh sửa cục bộ. */
  private readonly infoByDate = computed(() => {
    const map = new Map<string, DayInfo>();
    for (const info of this.dayInfos()) {
      map.set(info.date, info);
    }
    for (const [iso, info] of this.localEdits()) {
      if (info === null) {
        map.delete(iso);
      } else {
        map.set(iso, info);
      }
    }
    return map;
  });

  /**
   * Danh sách ô ngày của tháng đang xem, gồm cả ngày lấp của tháng trước/sau
   * để mỗi hàng đủ 7 ô và ngày đầu tháng rơi đúng cột thứ.
   */
  readonly cells = computed<CalendarCell[]>(() => {
    const month = this.viewMonth();
    const year = this.viewYear();
    const infoMap = this.infoByDate();
    const todayIso = toIsoDate(new Date());

    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingDays = (firstOfMonth.getDay() + 6) % 7; // Thứ 2 đứng cột đầu
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

    const cells: CalendarCell[] = [];
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month - 1, i - leadingDays + 1);
      const iso = toIsoDate(date);
      const lunar = this.lunarService.solarDateToLunar(date);
      cells.push({
        date,
        iso,
        solarDay: date.getDate(),
        lunar,
        lunarLabel: this.formatLunarLabel(lunar, date.getDate()),
        isCurrentMonth: date.getMonth() === month - 1,
        isToday: iso === todayIso,
        isSunday: date.getDay() === 0,
        info: infoMap.get(iso),
      });
    }
    return cells;
  });

  prevMonth(): void {
    this.shiftMonth(-1);
  }

  nextMonth(): void {
    this.shiftMonth(1);
  }

  goToday(): void {
    const now = new Date();
    this.viewMonth.set(now.getMonth() + 1);
    this.viewYear.set(now.getFullYear());
    this.monthChange.emit({ month: this.viewMonth(), year: this.viewYear() });
  }

  private shiftMonth(delta: number): void {
    const d = new Date(this.viewYear(), this.viewMonth() - 1 + delta, 1);
    this.viewMonth.set(d.getMonth() + 1);
    this.viewYear.set(d.getFullYear());
    this.monthChange.emit({ month: this.viewMonth(), year: this.viewYear() });
  }

  togglePicker(): void {
    this.pickerYear.set(this.viewYear());
    this.pickerOpen.update((open) => !open);
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  shiftPickerYear(delta: number): void {
    this.pickerYear.update((y) => y + delta);
  }

  selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.viewYear.set(this.pickerYear());
    this.pickerOpen.set(false);
    this.monthChange.emit({ month: this.viewMonth(), year: this.viewYear() });
  }

  onCellClick(cell: CalendarCell): void {
    if (!this.editable()) {
      return;
    }
    const ref = this.dialog.open<DayEditorDialogComponent, { cell: CalendarCell }, DayEditorResult>(
      DayEditorDialogComponent,
      { data: { cell }, width: '22.5rem' },
    );
    ref.afterClosed().subscribe((result) => this.onEditorClosed(cell, result));
  }

  private onEditorClosed(cell: CalendarCell, result: DayEditorResult | undefined): void {
    if (!result) {
      return;
    }
    if (result.action === 'delete') {
      if (cell.info) {
        this.applyLocalEdit(cell.iso, null);
        this.dayInfoDelete.emit(cell.info);
      }
      return;
    }
    const info: DayInfo = {
      id: cell.info?.id ?? this.generateId(),
      date: cell.iso,
      year: cell.date.getFullYear(),
      dayType: result.dayType,
      name: result.name.trim(),
      note: result.note.trim() || undefined,
      isGenerated: false,
    };
    this.applyLocalEdit(cell.iso, info);
    this.dayInfoChange.emit(info);
  }

  private applyLocalEdit(iso: string, info: DayInfo | null): void {
    const next = new Map(this.localEdits());
    next.set(iso, info);
    this.localEdits.set(next);
  }

  private formatLunarLabel(lunar: LunarDate, solarDay: number): string {
    const leapSuffix = lunar.isLeapMonth ? 'n' : '';
    // Mùng 1 âm (hoặc ngày 1 dương) hiển thị kèm tháng âm để dễ tra cứu.
    if (lunar.day === 1 || solarDay === 1) {
      return `${lunar.day}/${lunar.month}${leapSuffix}`;
    }
    return `${lunar.day}`;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `day-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
