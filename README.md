# DevFlow Pro (DashFW)

ระบบจัดการและติดตามงานฟรีแลนซ์สำหรับ Full-stack Developer & Digital Marketer ออกแบบมาเพื่อเพิ่มประสิทธิภาพในการจดบันทึก ติดตามสถานะงาน คำนวณรายได้ และทำงานร่วมกับเทคโนโลยี AI ช่วยเหลือในการวิเคราะห์และตอบกลับลูกค้า

---

## 🌟 ฟีเจอร์หลัก (Core Features)

1. **Kanban Board & Sub-task Management**
   - บอร์ดติดตามสถานะของโปรเจกต์ (Backlog, In Progress, Review, Completed, Paid)
   - ระบบเพิ่มและอัปเดตงานย่อย (Sub-tasks / Nested tasks) บันทึกลงฐานข้อมูล MongoDB เรียบร้อย
   - **AI Sub-tasks Generator:** ระบบผู้ช่วย AI ร่างรายการเช็คลิสต์ที่จำเป็นต้องทำตามรายละเอียดโครงการอัตโนมัติ

2. **Client CRM**
   - บันทึกข้อมูลประวัติลูกค้า ข้อมูลติดต่อ ลิงก์ Fastwork โน้ตย่อ และโซเชียลมีเดีย

3. **Checklist & Job Types**
   - จัดการประเภทงานหลัก (เช่น Facebook, OTA) พร้อมเช็คลิสต์เริ่มต้น
   - **AI Checklist Creator:** ใส่คำอธิบายสั้นๆ แล้วให้ AI แนะนำรายการเช็คลิสต์เริ่มต้นเพื่อประหยัดเวลา

4. **AI-Powered Snippet Manager**
   - **AI Generator:** พิมพ์ Prompt เพื่อให้ AI เจนเนอเรตข้อความตอบกลับลูกค้าแบบมืออาชีพตามสถานการณ์ต่างๆ
   - **Snippet Saver:** สามารถแก้ไข ตั้งชื่อ ติดแท็ก และบันทึกข้อความเก็บไว้ใช้งานซ้ำได้ในตัวระบบ

5. **Financial Dashboard**
   - คำนวณยอดรายได้หมุนเวียน (Money in Pipeline) และรายรับสุทธิที่ถอนได้ (Withdrawn Earnings) จริงจากระบบฐานข้อมูล
   - เครื่องคำนวณหักค่าธรรมเนียมของระบบ Fastwork 10% อัตโนมัติ (Auto-Fee Calculator)
   - กราฟสรุปผลงานและรายได้เปรียบเทียบย้อนหลัง 6 เดือนย่อยสลายแบบเรียลไทม์

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** Next.js 15 (App Router), React 19
- **Styling:** Tailwind CSS, Radix UI (shadcn), Lucide icons
- **State Management:** Redux Toolkit & RTK Query
- **Database:** MongoDB
- **Authentication:** Firebase Auth
- **AI Integration:** Google Genkit & Google GenAI SDK (Gemini 2.5 Flash)

---

## ⚙️ การตั้งค่าสภาพแวดล้อม (Environment Variables)

สร้างไฟล์ `.env.local` ไว้ที่รูทของโปรเจกต์ และระบุคีย์ดังนี้:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_uri
MONGODB_DB=your_database_name

# Firebase Client configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini API key (สำหรับระบบ Genkit AI)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 การเริ่มทำงาน (Getting Started)

1. ติดตั้ง Dependencies:
```bash
yarn install
# หรือ
npm install
```

2. รันแอปพลิเคชันในโหมดพัฒนา (Development):
```bash
yarn dev
# หรือ
npm run dev
```
เข้าใช้งานได้ผ่าน [http://localhost:9002](http://localhost:9002)

3. ทดสอบการรันระบบเพื่อการใช้งานจริง (Production Build):
```bash
yarn build
yarn start
# หรือ
npm run build
npm start
```

4. รันเครื่องมือ Genkit Developer UI:
```bash
yarn genkit:dev
# หรือ
npm run genkit:dev
```
