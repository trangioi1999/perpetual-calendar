import { Injectable } from '@angular/core';

/**
 * Kết quả chuyển đổi dương lịch -> âm lịch.
 */
export interface LunarDate {
  /** Ngày âm lịch (1..30) */
  day: number;
  /** Tháng âm lịch (1..12) */
  month: number;
  /** Năm âm lịch */
  year: number;
  /** Tháng này có phải tháng nhuận không */
  isLeapMonth: boolean;
}

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;

/** Chu kỳ 60 can chi (lục thập hoa giáp), bắt đầu từ Giáp Tý. */
export const SEXAGENARY_CYCLE: readonly string[] = Array.from(
  { length: 60 },
  (_, i) => `${CAN[i % 10]} ${CHI[i % 12]}`,
);

const INT = Math.floor;
const PI = Math.PI;

/**
 * Thuật toán chuyển đổi dương lịch <-> âm lịch Việt Nam (múi giờ UTC+7)
 * theo thuật toán chuẩn của Hồ Ngọc Đức.
 * https://www.informatik.uni-leipzig.de/~duc/amlich/
 *
 * Thuần TypeScript, không phụ thuộc DOM — dùng được cả ngoài Angular.
 */
@Injectable({ providedIn: 'root' })
export class LunarCalendarService {
  /** Múi giờ mặc định: Việt Nam (UTC+7). */
  static readonly VN_TIMEZONE = 7;

  /**
   * Đổi ngày dương lịch (dd/mm/yyyy) sang số ngày Julian (Julian Day Number).
   */
  jdFromDate(dd: number, mm: number, yy: number): number {
    const a = INT((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd =
      dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) {
      jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    }
    return jd;
  }

  /**
   * Đổi số ngày Julian sang ngày dương lịch, trả về [ngày, tháng, năm].
   */
  jdToDate(jd: number): [number, number, number] {
    let a: number;
    let b: number;
    let c: number;
    if (jd > 2299160) {
      // Lịch Gregory
      a = jd + 32044;
      b = INT((4 * a + 3) / 146097);
      c = a - INT((b * 146097) / 4);
    } else {
      // Lịch Julius
      b = 0;
      c = jd + 32082;
    }
    const d = INT((4 * c + 3) / 1461);
    const e = c - INT((1461 * d) / 4);
    const m = INT((5 * e + 2) / 153);
    const day = e - INT((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * INT(m / 10);
    const year = b * 100 + d - 4800 + INT(m / 10);
    return [day, month, year];
  }

  /**
   * Tính thời điểm trăng non (new moon) thứ k kể từ 1/1/1900,
   * trả về số ngày Julian (có phần thập phân, theo giờ UTC).
   */
  newMoon(k: number): number {
    const T = k / 1236.85; // thời gian tính theo thế kỷ Julius kể từ 1900-01-01
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    // Dị thường trung bình của mặt trời
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    // Dị thường trung bình của mặt trăng
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    // Đối số vĩ độ của mặt trăng
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    let deltat: number;
    if (T < -11) {
      deltat =
        0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3;
    } else {
      deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    }
    return Jd1 + C1 - deltat;
  }

  /**
   * Tính kinh độ mặt trời (radian, 0 <= L < 2*PI) tại thời điểm jdn (số ngày Julian).
   */
  sunLongitude(jdn: number): number {
    const T = (jdn - 2451545.0) / 36525; // thế kỷ Julius kể từ J2000
    const T2 = T * T;
    const dr = PI / 180;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    L = L - PI * 2 * INT(L / (PI * 2)); // chuẩn hoá về (0, 2*PI)
    return L;
  }

  /**
   * Ngày (JDN, tính theo múi giờ địa phương) chứa thời điểm trăng non thứ k.
   */
  getNewMoonDay(k: number, timeZone: number): number {
    return INT(this.newMoon(k) + 0.5 + timeZone / 24);
  }

  /**
   * Chỉ số cung hoàng đạo (0..11) của mặt trời lúc nửa đêm đầu ngày dayNumber.
   * Kết quả 0 = Xuân phân đến trước Cốc vũ, ... Dùng để xác định tháng có trung khí.
   */
  getSunLongitude(dayNumber: number, timeZone: number): number {
    return INT((this.sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6);
  }

  /**
   * Ngày bắt đầu tháng 11 âm lịch của năm yy (tháng chứa Đông chí).
   */
  getLunarMonth11(yy: number, timeZone: number): number {
    const off = this.jdFromDate(31, 12, yy) - 2415021;
    const k = INT(off / 29.530588853);
    let nm = this.getNewMoonDay(k, timeZone);
    const sunLong = this.getSunLongitude(nm, timeZone);
    if (sunLong >= 9) {
      nm = this.getNewMoonDay(k - 1, timeZone);
    }
    return nm;
  }

  /**
   * Vị trí tháng nhuận sau tháng 11 âm lịch bắt đầu tại a11.
   */
  getLeapMonthOffset(a11: number, timeZone: number): number {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1; // bắt đầu từ tháng sau tháng 11 âm
    let arc = this.getSunLongitude(this.getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = this.getSunLongitude(this.getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  /**
   * Chuyển đổi ngày dương lịch dd/mm/yy sang âm lịch.
   * Trả về [ngày âm, tháng âm, năm âm, tháng nhuận (1) hay không (0)].
   */
  convertSolar2Lunar(
    dd: number,
    mm: number,
    yy: number,
    timeZone: number = LunarCalendarService.VN_TIMEZONE,
  ): [number, number, number, number] {
    const dayNumber = this.jdFromDate(dd, mm, yy);
    const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = this.getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
      monthStart = this.getNewMoonDay(k, timeZone);
    }
    let a11 = this.getLunarMonth11(yy, timeZone);
    let b11 = a11;
    let lunarYear: number;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = this.getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = this.getLunarMonth11(yy + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = INT((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = this.getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) {
          lunarLeap = 1;
        }
      }
    }
    if (lunarMonth > 12) {
      lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
      lunarYear -= 1;
    }
    return [lunarDay, lunarMonth, lunarYear, lunarLeap];
  }

  /**
   * Chuyển đổi 1 Date (theo giờ địa phương của Date) sang âm lịch VN.
   */
  solarDateToLunar(date: Date, timeZone: number = LunarCalendarService.VN_TIMEZONE): LunarDate {
    const [day, month, year, leap] = this.convertSolar2Lunar(
      date.getDate(),
      date.getMonth() + 1,
      date.getFullYear(),
      timeZone,
    );
    return { day, month, year, isLeapMonth: leap === 1 };
  }

  /**
   * Can chi của năm âm lịch, ví dụ 2026 -> "Bính Ngọ".
   */
  getYearCanChi(lunarYear: number): string {
    return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
  }

  /** Danh sách 60 can chi (Giáp Tý, Ất Sửu, ...). */
  getSexagenaryCycle(): readonly string[] {
    return SEXAGENARY_CYCLE;
  }
}
