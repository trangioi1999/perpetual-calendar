import { LunarCalendarService, SEXAGENARY_CYCLE } from './lunar-calendar.service';

describe('LunarCalendarService', () => {
  let service: LunarCalendarService;

  beforeEach(() => {
    service = new LunarCalendarService();
  });

  describe('jdFromDate / jdToDate', () => {
    it('tính đúng JDN của 1/1/2000 (JDN 2451545)', () => {
      expect(service.jdFromDate(1, 1, 2000)).toBe(2451545);
    });

    it('jdToDate là nghịch đảo của jdFromDate', () => {
      const dates: [number, number, number][] = [
        [1, 1, 2000],
        [29, 2, 2024],
        [31, 12, 1999],
        [15, 7, 2026],
      ];
      for (const [dd, mm, yy] of dates) {
        expect(service.jdToDate(service.jdFromDate(dd, mm, yy))).toEqual([dd, mm, yy]);
      }
    });
  });

  describe('convertSolar2Lunar - các ngày mốc đã biết (UTC+7)', () => {
    it('1/1/2024 dương = 20/11/2023 âm (Quý Mão)', () => {
      expect(service.convertSolar2Lunar(1, 1, 2024)).toEqual([20, 11, 2023, 0]);
    });

    it('Tết Giáp Thìn: 10/2/2024 dương = 1/1/2024 âm', () => {
      expect(service.convertSolar2Lunar(10, 2, 2024)).toEqual([1, 1, 2024, 0]);
    });

    it('Tết Ất Tỵ: 29/1/2025 dương = 1/1/2025 âm', () => {
      expect(service.convertSolar2Lunar(29, 1, 2025)).toEqual([1, 1, 2025, 0]);
    });

    it('Tết Bính Ngọ: 17/2/2026 dương = 1/1/2026 âm', () => {
      expect(service.convertSolar2Lunar(17, 2, 2026)).toEqual([1, 1, 2026, 0]);
    });

    it('14/7/2026 dương = 1/6/2026 âm (mùng 1)', () => {
      expect(service.convertSolar2Lunar(14, 7, 2026)).toEqual([1, 6, 2026, 0]);
    });

    it('15/7/2026 dương = 2/6/2026 âm', () => {
      expect(service.convertSolar2Lunar(15, 7, 2026)).toEqual([2, 6, 2026, 0]);
    });

    it('1/7/2026 dương = 17/5/2026 âm', () => {
      expect(service.convertSolar2Lunar(1, 7, 2026)).toEqual([17, 5, 2026, 0]);
    });

    it('năm nhuận âm lịch 2023: 22/3/2023 dương = 1/2 nhuận/2023 âm', () => {
      expect(service.convertSolar2Lunar(22, 3, 2023)).toEqual([1, 2, 2023, 1]);
    });

    it('trước tháng nhuận: 20/2/2023 dương = 1/2/2023 âm (không nhuận)', () => {
      expect(service.convertSolar2Lunar(20, 2, 2023)).toEqual([1, 2, 2023, 0]);
    });

    it('Quốc khánh 2/9/2025 dương = 11/7/2025 âm', () => {
      expect(service.convertSolar2Lunar(2, 9, 2025)).toEqual([11, 7, 2025, 0]);
    });
  });

  describe('solarDateToLunar', () => {
    it('bao đúng kết quả convertSolar2Lunar vào object LunarDate', () => {
      const lunar = service.solarDateToLunar(new Date(2026, 6, 15));
      expect(lunar).toEqual({ day: 2, month: 6, year: 2026, isLeapMonth: false });
    });
  });

  describe('can chi năm', () => {
    it('2024 là Giáp Thìn, 2025 là Ất Tỵ, 2026 là Bính Ngọ', () => {
      expect(service.getYearCanChi(2024)).toBe('Giáp Thìn');
      expect(service.getYearCanChi(2025)).toBe('Ất Tỵ');
      expect(service.getYearCanChi(2026)).toBe('Bính Ngọ');
    });

    it('chu kỳ 60 can chi bắt đầu Giáp Tý, kết thúc Quý Hợi, không trùng lặp', () => {
      expect(SEXAGENARY_CYCLE).toHaveLength(60);
      expect(SEXAGENARY_CYCLE[0]).toBe('Giáp Tý');
      expect(SEXAGENARY_CYCLE[1]).toBe('Ất Sửu');
      expect(SEXAGENARY_CYCLE[59]).toBe('Quý Hợi');
      expect(new Set(SEXAGENARY_CYCLE).size).toBe(60);
    });
  });
});
