# Perpetual Calendar — Lịch vạn niên (Angular 21)

Lịch vạn niên xem theo tháng, hiển thị song song ngày dương lịch và âm lịch Việt Nam
(UTC+7), kèm khả năng gắn **note / loại ngày** cho từng ngày và chỉnh sửa trực tiếp
trên lịch. Viết bằng Angular 21 standalone component + signals, đóng gói thành
**common UI component** để tái sử dụng ở app khác.

## Chạy

```bash
npm install
npm start        # ng serve — mở http://localhost:4200
npm test         # unit test (vitest qua @angular/build:unit-test)
npm run build    # build production
```

## Cấu trúc

```
src/app/lich-van-nien/
├── lunar-calendar.service.ts        # Thuật toán âm lịch Hồ Ngọc Đức (thuần TS)
├── lunar-calendar.service.spec.ts   # Unit test các ngày mốc đã biết
├── day-info.model.ts                # DayInfo, DayType + cấu hình hiển thị
├── lich-van-nien.component.ts       # Component lịch (signals, OnPush)
├── lich-van-nien.component.html
├── lich-van-nien.component.scss     # CSS Grid, responsive, dark mode qua CSS vars
└── index.ts                         # Public API để import từ app khác
```

## Dùng lại ở app khác

```ts
import { LichVanNienComponent, DayInfo } from './lich-van-nien';
```

```html
<app-lich-van-nien
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

`dayType`: `WORKING | WEEKEND | HOLIDAY | LEAVE | NOTE` — thêm loại mới bằng cách mở
rộng union `DayType` và khai báo nhãn/màu trong `DAY_TYPE_CONFIG`.

### Tuỳ biến theme

Toàn bộ màu đi qua CSS variables (`--lvn-*`), override tại selector cha là đổi được
theme; dark mode tự động theo `prefers-color-scheme` hoặc ép qua `[data-theme="dark"]`.

## Thuật toán âm lịch

`LunarCalendarService` implement thuật toán chuẩn của
[Hồ Ngọc Đức](https://www.informatik.uni-leipzig.de/~duc/amlich/): `jdFromDate`,
`jdToDate`, `newMoon(k)`, `sunLongitude(jdn)`, `getNewMoonDay`, `getSunLongitude`,
`getLunarMonth11`, `getLeapMonthOffset`, `convertSolar2Lunar(dd, mm, yy, timeZone=7)`
trả về `[ngày âm, tháng âm, năm âm, nhuận]`, cùng chu kỳ 60 can chi để tính can chi
năm. Không phụ thuộc thư viện âm lịch bên ngoài, tính theo múi giờ Việt Nam.
