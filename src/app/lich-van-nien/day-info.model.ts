/**
 * Loại ngày — có thể mở rộng thêm bằng cách thêm giá trị vào union
 * và khai báo cấu hình hiển thị trong DAY_TYPE_CONFIG.
 */
export type DayType = 'WORKING' | 'WEEKEND' | 'HOLIDAY' | 'LEAVE' | 'NOTE';

/**
 * Thông tin gắn với 1 ngày trên lịch (ngày nghỉ, ghi chú, sự kiện...).
 * Khớp với payload backend:
 * {
 *   "id": "3fa85f64-...",
 *   "date": "2026-07-15",
 *   "year": 0,
 *   "dayType": "WORKING",
 *   "name": "string",
 *   "isGenerated": true
 * }
 */
export interface DayInfo {
  id: string;
  /** Ngày dương lịch, định dạng ISO "YYYY-MM-DD". */
  date: string;
  year?: number;
  dayType: DayType;
  /** Tên/nhãn hiển thị trên ô lịch (ví dụ "Quốc khánh 2/9"). */
  name: string;
  /** Ghi chú chi tiết (tuỳ chọn). */
  note?: string;
  /** Bản ghi do hệ thống sinh tự động hay do người dùng tạo. */
  isGenerated?: boolean;
}

export interface DayTypeConfig {
  label: string;
  /** Tên CSS class hậu tố, đồng thời là key màu trong SCSS. */
  cssKey: string;
}

export const DAY_TYPE_CONFIG: Record<DayType, DayTypeConfig> = {
  WORKING: { label: 'Ngày làm việc', cssKey: 'working' },
  WEEKEND: { label: 'Cuối tuần', cssKey: 'weekend' },
  HOLIDAY: { label: 'Ngày nghỉ lễ', cssKey: 'holiday' },
  LEAVE: { label: 'Nghỉ phép', cssKey: 'leave' },
  NOTE: { label: 'Ghi chú', cssKey: 'note' },
};

export const DAY_TYPES: readonly DayType[] = Object.keys(DAY_TYPE_CONFIG) as DayType[];

/** Format 1 Date (giờ địa phương) thành "YYYY-MM-DD". */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
