import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DayInfo, PerpetualCalendarComponent } from './calendar';

/**
 * App demo: host PerpetualCalendarComponent và giả lập vòng đời dữ liệu với backend.
 * Trong thực tế, thay signal `dayInfos` bằng dữ liệu từ HTTP service, và trong
 * onDayInfoChange/onDayInfoDelete gọi API lưu/xoá tương ứng.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PerpetualCalendarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly dayInfos = signal<DayInfo[]>([
    {
      id: 'b2f0c9a1-0000-4000-8000-000000000709',
      date: '2026-07-09',
      year: 2026,
      dayType: 'HOLIDAY',
      name: 'Nghỉ lễ',
      isGenerated: true,
    },
    {
      id: 'b2f0c9a1-0000-4000-8000-000000000711',
      date: '2026-07-11',
      year: 2026,
      dayType: 'COMPENSATORY',
      name: 'Làm bù',
      isGenerated: true,
    },
    {
      id: 'b2f0c9a1-0000-4000-8000-000000000717',
      date: '2026-07-17',
      year: 2026,
      dayType: 'WORKING',
      name: 'Làm việc ở nhà',
      isGenerated: false,
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
