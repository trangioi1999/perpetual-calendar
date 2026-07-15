import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { LichVanNienComponent } from './lich-van-nien';
import { DayInfo } from './lich-van-nien';

/**
 * App demo: host LichVanNienComponent và giả lập vòng đời dữ liệu với backend.
 * Trong thực tế, thay signal `dayInfos` bằng dữ liệu từ HTTP service, và trong
 * onDayInfoChange/onDayInfoDelete gọi API lưu/xoá tương ứng.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LichVanNienComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly dayInfos = signal<DayInfo[]>([
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      date: '2026-07-11',
      year: 2026,
      dayType: 'NOTE',
      name: 'Ngày dân số thế giới',
      isGenerated: true,
    },
    {
      id: 'b2f0c9a1-0000-4000-8000-000000000027',
      date: '2026-07-27',
      year: 2026,
      dayType: 'NOTE',
      name: 'Ngày Thương binh liệt sĩ',
      isGenerated: true,
    },
    {
      id: 'b2f0c9a1-0000-4000-8000-000000000028',
      date: '2026-07-28',
      year: 2026,
      dayType: 'NOTE',
      name: 'Ngày thành lập công đoàn VN',
      isGenerated: true,
    },
    {
      id: 'b2f0c9a1-0000-4000-8000-000000000902',
      date: '2026-09-02',
      year: 2026,
      dayType: 'HOLIDAY',
      name: 'Quốc khánh',
      isGenerated: true,
    },
  ]);

  onDayInfoChange(info: DayInfo): void {
    this.dayInfos.update((list) => {
      const idx = list.findIndex((d) => d.date === info.date);
      return idx >= 0
        ? list.map((d, i) => (i === idx ? info : d))
        : [...list, info];
    });
    console.log('dayInfoChange (gọi API lưu ở đây):', info);
  }

  onDayInfoDelete(info: DayInfo): void {
    this.dayInfos.update((list) => list.filter((d) => d.id !== info.id));
    console.log('dayInfoDelete (gọi API xoá ở đây):', info);
  }
}
