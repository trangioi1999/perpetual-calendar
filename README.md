# Perpetual Calendar — Lịch vạn niên (Angular 21 + Material)

Lịch vạn niên xem theo tháng, hiển thị song song ngày dương lịch và âm lịch Việt Nam
(UTC+7), kèm khả năng gắn **note / loại ngày** cho từng ngày và chỉnh sửa trực tiếp
trên lịch qua Material Dialog. Viết bằng Angular 21 standalone component + signals,
UI theo **Angular Material (M3)**, đóng gói thành common UI component để tái sử dụng.

🔗 Demo: https://trangioi1999.github.io/perpetual-calendar/

## Chạy

```bash
npm install
npm start        # ng serve — mở http://localhost:4200
npm test         # unit test (vitest qua @angular/build:unit-test)
npm run build    # build production
```

## Cấu trúc

```
src/app/calendar/
├── lunar-calendar.service.ts        # Thuật toán âm lịch Hồ Ngọc Đức (thuần TS)
├── lunar-calendar.service.spec.ts   # Unit test các ngày mốc đã biết
├── day-info.model.ts                # DayInfo, DayType, CalendarCell + cấu hình hiển thị
├── perpetual-calendar.component.*   # Component lịch (signals, OnPush, CSS Grid)
├── day-editor-dialog.component.ts   # MatDialog chỉnh sửa loại ngày / tên / ghi chú
└── index.ts                         # Public API để import từ app khác
```

## Dùng lại ở app khác

```ts
import { PerpetualCalendarComponent, DayInfo } from './calendar';
```

```html
<app-perpetual-calendar
  [dayInfos]="dayInfos()"          <!-- dữ liệu note/ngày nghỉ từ backend -->
  [editable]="true"                 <!-- false = chỉ xem -->
  (dayInfoChange)="save($event)"    <!-- user lưu -> gọi API upsert -->
  (dayInfoDelete)="remove($event)"  <!-- user xoá -> gọi API delete -->
  (monthChange)="load($event)"      <!-- chuyển tháng -> load dữ liệu tháng mới -->
/>
```

Component **không tự gọi HTTP** — nó chỉ render `dayInfos` truyền vào và emit sự kiện
khi user chỉnh sửa, nên ghép được với bất kỳ backend/state management nào.

### Model `DayInfo` (khớp payload backend)

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "date": "2026-07-15",
  "year": 2026,
  "dayType": "WORKING",
  "name": "string",
  "note": "tuỳ chọn",
  "isGenerated": true
}
```

`dayType` gồm 3 loại:

| Type | Ý nghĩa |
| --- | --- |
| `WORKING` | Ngày làm việc bình thường |
| `HOLIDAY` | Ngày nghỉ / lễ |
| `COMPENSATORY` | Ngày làm bù (ví dụ đi làm bù cho ngày lễ) |

Cần thêm loại mới thì mở rộng union `DayType`, khai báo nhãn trong
`DAY_TYPE_CONFIG` và thêm biến màu `--calendar-<cssKey>` trong SCSS.

### Theme

Component đọc màu từ **Material system tokens** (`--mat-sys-surface`,
`--mat-sys-primary`, `--mat-sys-error`...) do `mat.theme()` cung cấp, nên tự khớp
theme Angular Material của app và dark mode đi theo `color-scheme`. Riêng màu badge
theo loại ngày là biến `--calendar-*`, override tại selector cha nếu muốn đổi.

## Thuật toán âm lịch

`LunarCalendarService` implement thuật toán chuẩn của
[Hồ Ngọc Đức](https://www.informatik.uni-leipzig.de/~duc/amlich/): `jdFromDate`,
`jdToDate`, `newMoon(k)`, `sunLongitude(jdn)`, `getNewMoonDay`, `getSunLongitude`,
`getLunarMonth11`, `getLeapMonthOffset`, `convertSolar2Lunar(dd, mm, yy, timeZone=7)`
trả về `[ngày âm, tháng âm, năm âm, nhuận]`, cùng chu kỳ 60 can chi để tính can chi
năm. Không phụ thuộc thư viện âm lịch bên ngoài, tính theo múi giờ Việt Nam.

## Deploy

```bash
npx ng build --base-href /perpetual-calendar/
# push nội dung dist/perpetual-calendar/browser lên branch gh-pages
```
