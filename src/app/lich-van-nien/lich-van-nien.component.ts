import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LunarCalendarService, LunarDate } from './lunar-calendar.service';
import {
  DAY_TYPES,
  DAY_TYPE_CONFIG,
  DayInfo,
  DayType,
  toIsoDate,
} from './day-info.model';

/** 1 ô ngày trên lưới lịch. */
export interface CalendarCell {
  date: Date;
  /** "YYYY-MM-DD" — khoá để map với DayInfo. */
  iso: string;
  solarDay: number;
  lunar: LunarDate;
  /** Nhãn âm lịch: "2", hoặc "1/6" khi mùng 1, "1/6n" khi tháng nhuận. */
  lunarLabel: string;
  /** Ô thuộc tháng đang xem hay là ngày lấp của tháng kề. */
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  info?: DayInfo;
}

interface EditorState {
  cell: CalendarCell;
  dayType: DayType;
  name: string;
  note: string;
}

/**
 * Lịch vạn niên xem theo tháng — common UI component, dùng lại được ở mọi app:
 *
 * ```html
 * <app-lich-van-nien
 *   [dayInfos]="dayInfos()"
 *   [editable]="true"
 *   (dayInfoChange)="onSave($event)"
 *   (dayInfoDelete)="onDelete($event)"
 *   (monthChange)="onMonthChange($event)" />
 * ```
 *
 * - `dayInfos`: danh sách note/ngày nghỉ từ backend, hiển thị badge trên ô ngày.
 * - Khi `editable`, click vào ô ngày sẽ mở panel chỉnh sửa loại ngày + ghi chú;
 *   component emit `dayInfoChange` (upsert) / `dayInfoDelete` — việc gọi API
 *   lưu trữ do phía sử dụng quyết định, component không tự gọi HTTP.
 */
@Component({
  selector: 'app-lich-van-nien',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lich-van-nien.component.html',
  styleUrl: './lich-van-nien.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LichVanNienComponent {
  private readonly lunarService = inject(LunarCalendarService);

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

  readonly weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  readonly dayTypes = DAY_TYPES;
  readonly dayTypeConfig = DAY_TYPE_CONFIG;

  /** Tháng (1-12) / năm dương lịch đang xem. */
  readonly viewMonth = signal(this.initialDate().getMonth() + 1);
  readonly viewYear = signal(this.initialDate().getFullYear());

  /** Các chỉnh sửa cục bộ, phủ lên dayInfos() để UI phản hồi ngay khi lưu. */
  private readonly localEdits = signal<ReadonlyMap<string, DayInfo | null>>(new Map());

  /** Panel chỉnh sửa đang mở (null = đóng). */
  readonly editor = signal<EditorState | null>(null);

  readonly title = computed(() => `Tháng ${this.viewMonth()} năm ${this.viewYear()}`);

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
    const leadingDays = firstOfMonth.getDay(); // CN đứng cột đầu
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
    this.closeEditor();
    this.monthChange.emit({ month: this.viewMonth(), year: this.viewYear() });
  }

  private shiftMonth(delta: number): void {
    const d = new Date(this.viewYear(), this.viewMonth() - 1 + delta, 1);
    this.viewMonth.set(d.getMonth() + 1);
    this.viewYear.set(d.getFullYear());
    this.closeEditor();
    this.monthChange.emit({ month: this.viewMonth(), year: this.viewYear() });
  }

  onCellClick(cell: CalendarCell): void {
    if (!this.editable()) {
      return;
    }
    this.editor.set({
      cell,
      dayType: cell.info?.dayType ?? (cell.isSunday ? 'WEEKEND' : 'WORKING'),
      name: cell.info?.name ?? '',
      note: cell.info?.note ?? '',
    });
  }

  saveEditor(): void {
    const state = this.editor();
    if (!state) {
      return;
    }
    const existing = state.cell.info;
    const info: DayInfo = {
      id: existing?.id ?? this.generateId(),
      date: state.cell.iso,
      year: state.cell.date.getFullYear(),
      dayType: state.dayType,
      name: state.name.trim(),
      note: state.note.trim() || undefined,
      isGenerated: false,
    };
    this.applyLocalEdit(state.cell.iso, info);
    this.dayInfoChange.emit(info);
    this.closeEditor();
  }

  deleteEditor(): void {
    const state = this.editor();
    const existing = state?.cell.info;
    if (!state || !existing) {
      return;
    }
    this.applyLocalEdit(state.cell.iso, null);
    this.dayInfoDelete.emit(existing);
    this.closeEditor();
  }

  closeEditor(): void {
    this.editor.set(null);
  }

  updateEditor(patch: Partial<Omit<EditorState, 'cell'>>): void {
    const state = this.editor();
    if (state) {
      this.editor.set({ ...state, ...patch });
    }
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
