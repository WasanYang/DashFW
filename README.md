# DevFlow Pro (DashFW)

ระบบจัดการและติดตามงานฟรีแลนซ์สำหรับ Full-stack Developer & Digital Marketer ออกแบบมาเพื่อเพิ่มประสิทธิภาพในการทำงาน ติดตามสถานะโปรเจกต์ จัดการเช็คลิสต์ คำนวณรายรับ ดำเนินการออกใบเสนอราคา/ใบแจ้งหนี้ และผสานเทคโนโลยี Generative AI เพื่อการวิเคราะห์ช่วยเหลือในการทำงานอย่างเป็นระบบ

เอกสารประกอบการออกแบบเพิ่มเติมสามารถดูได้ที่ [docs/blueprint.md](file:///D:/Work/DashFW/docs/blueprint.md)

---

## 🌟 การอัปเดตสถาปัตยกรรมใหม่ (New Architecture & Core Features)

ระบบมีการยกระดับสถาปัตยกรรมขนานใหญ่ โดยเปลี่ยนผ่านจากโครงสร้างเดิมสู่แบบโครงสร้างสองระดับ (Two-tier Task/Container Architecture) และเพิ่มระบบความสัมพันธ์องค์กร:

1. **สถาปัตยกรรมโครงการย่อย (Projects & Tasks Architecture)**
   - **Projects (โครงการหลัก):** ทำหน้าที่เป็น Container ครอบคลุมงานทั้งหมดของลูกค้า มีรายละเอียดการตั้งค่าสกุลเงิน ยอดชำระเงินตามชั่วโมง (`hourlyRate`), การตั้งสเปกตรัมสี (Color code), แท็บการเข้าถึงบอร์ดเฉพาะด้าน และการสร้างหมวดเนื้อหาอิสระ (`detailsSections`)
   - **Tasks (งานย่อยบนบอร์ด):** คืองานเฉพาะชิ้นที่อยู่บน **Kanban Board** (ย้ายสถานะผ่าน Backlog, In Progress, Review, Completed, Paid) โดยจะถูกเชื่อมโยงกลับไปหาโครงการหลักผ่านฟิลด์ `projectId`
   - **Repeating Tasks:** รองรับการสร้างคอนฟิกงานทำซ้ำรายวัน รายสัปดาห์ รายเดือน หรือรายปี ผ่านโมเดล [RepeatConfig](file:///D:/Work/DashFW/src/lib/types.ts#L1)

2. **ระบบการจัดการข้อมูลบริษัท (Company CRM & Contacts)**
   - เพิ่มฟังก์ชันจัดการองค์กร/บริษัทคู่ค้า [Company](file:///D:/Work/DashFW/src/lib/types.ts#L127) ช่วยแยกประวัติการติดต่อของลูกค้า (Client / Contacts) ออกจากกันเป็นหลายแผนก แต่สามารถสังกัดอยู่ในบริษัทแม่เดียวกันได้

3. **หน้าจอแก้ไขข้อความรูปแบบใหม่ (Novel Rich Text Editor)**
   - เปลี่ยนจากตัวแก้ไขข้อความตัวเดิมมาเป็น **Novel Editor** ในไฟล์ [editable-novel-field.tsx](file:///D:/Work/DashFW/src/components/ui/editable-novel-field.tsx) ซึ่งอิงจาก **Tiptap/ProseMirror** มอบฟังก์ชันเขียนตารางสร้าง Task checklist ภายในแบบ nested โค้ดคอมไพล์ และจัดหน้าเอกสารขั้นสูง

4. **ระบบวิเคราะห์และสรุปผลด้านเวลา (Enhanced Time Logger)**
   - บันทึกการทำงานโดยละเอียดของแต่ละงานย่อย รองรับการตั้งค่าบิลค่าบริการ (`billable`), อัตราต้นทุน (`costRate`), อัตราการเรียกเก็บเงิน (`billingRate`) และระบุหมวดหมู่การทำงาน

5. **สคริปต์ย้ายข้อมูลหลังบ้าน (Database Migration & Seed Script)**
   - มีระบบรันคำสั่ง Migration ย้ายฐานข้อมูลจากสคีมาแบบเดิมสู่แบบใหม่ (ปรับโครงสร้าง collection `projects` -> `tasks` และสร้างโครงการหลักระดับสูงขึ้นมารองรับงานเดิม) ผ่านสคริปต์ในห้อง [scratch/](file:///D:/Work/DashFW/scratch/)

---

## 📂 โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Directory Structure)

โปรเจกต์นี้เขียนด้วย **Next.js 15 (App Router)** และ **React 19**:

```text
DashFW/
├── docs/
│   └── blueprint.md                # พิมพ์เขียวและแนวทางการออกแบบสไตล์ของระบบ
├── scratch/                        # สคริปต์ชั่วคราวและคำสั่งย้ายข้อมูลฐานข้อมูล (Migration Scripts)
│   ├── check.js
│   ├── check2.js
│   ├── migrate.js                  # ย้ายคอลเล็กชันจาก Projects เก่าสู่ระบบ Tasks/Projects ใหม่
│   ├── migrate2.js
│   └── test.js
├── src/
│   ├── ai/
│   │   ├── flows/                  # โฟลว์การทำงานร่วมกับ AI Genkit
│   │   │   ├── ai-checklist-creator-flow.ts
│   │   │   └── ai-powered-snippet-generator-flow.ts
│   │   ├── dev.ts                  # รัน AI Developer UI
│   │   └── genkit.ts               # การกำหนดค่าเริ่มต้นของ Genkit
│   ├── app/
│   │   ├── (protect)/              # โครงสร้างหน้าที่ต้องการการยืนยันตัวตน
│   │   │   ├── board/              # จัดการ Tasks บนบอร์ดคัมบังและการสลับ Views
│   │   │   ├── checklists/         # จัดการเช็คลิสต์
│   │   │   ├── clients/            # คอนแทกต์ลูกค้า & ข้อมูลบริษัทแยกกลุ่ม
│   │   │   ├── dashboard/          # แดชบอร์ดสรุปงาน ปฏิทิน และตารางเวลา (Timesheets)
│   │   │   ├── financials/         # แดชบอร์ดสรุปรายรับและการคำนวณภาษี
│   │   │   ├── invoices/           # ส่วนจัดการใบแจ้งหนี้และข้อตกลงสัญญา (Proposals & Contracts)
│   │   │   ├── job-types/          # แม่แบบงาน (Job Templates)
│   │   │   └── projects/           # หน้าโครงการหลักระดับสูง (Project Containers)
│   │   ├── api/                    # API Routes สำหรับการเชื่อมต่อฐานข้อมูล MongoDB
│   │   │   ├── client/route.ts     # API คอนแทกต์ลูกค้า
│   │   │   ├── company/route.ts    # API ข้อมูลบริษัท (ใหม่)
│   │   │   ├── invoice/route.ts    # API ข้อมูลใบแจ้งหนี้
│   │   │   ├── job-type/route.ts   # API ข้อมูลประเภทแม่แบบงาน
│   │   │   ├── migrate-db/route.ts # API สำหรับสั่ง Migrate ฐานข้อมูลจากหน้าบ้าน
│   │   │   ├── project/route.ts    # API ข้อมูลโปรเจกต์คอนเทนเนอร์หลัก (ใหม่)
│   │   │   ├── proposal/route.ts   # API ข้อมูลใบเสนอราคา
│   │   │   ├── task/route.ts       # API จัดการงาน Kanban (ย้ายจาก Project เดิม)
│   │   │   └── time-log/route.ts   # API จัดการประวัติติดตามเวลาทำงาน
│   │   ├── globals.css             # การตั้งค่า Tailwind CSS และ Custom CSS
│   │   └── layout.tsx              # Root Layout
│   ├── components/                 # คอมโพเนนต์ UI ร่วมในระบบ
│   │   ├── ui/                     # UI components จาก shadcn/ui และ Novel Rich Editor
│   │   │   ├── editable-novel-field.tsx # ตัวแต่งข้อความ Novel Editor (แทนที่ Quill เดิม)
│   │   │   └── repeats-popover.tsx      # ส่วนเลือกตั้งค่าเวลาการทำซ้ำของงาน
│   │   ├── board/                  # ส่วนประกอบต่างๆ บนบอร์ดคัมบัง (Card, Column, Forms)
│   │   ├── clients/                # ส่วนจัดการข้อมูลผู้ติดต่อและฟอร์มบริษัท
│   │   ├── sidebar.tsx             # เมนูด้านข้างแบ่งกลุ่มการทำงาน (Grouped Navigation)
│   │   └── header.tsx              # ส่วนหัวของแอปพลิเคชันและเมนูส่วนตัวผู้รันระบบ
│   ├── lib/
│   │   ├── mongodb.ts              # คลาสจัดการการเชื่อมต่อ MongoDB
│   │   ├── types.ts                # TypeScript Types หลักของแอปพลิเคชัน
│   │   └── data.ts                 # ข้อมูลสำหรับเตรียม Seed หรือจำลองระบบ
│   ├── services/                   # RTK Query APIs สำหรับสตรีมข้อมูลหน้าหลังบ้าน
│   │   ├── clientApi.ts
│   │   ├── companyApi.ts           # จัดการ API บริษัท (ใหม่)
│   │   ├── invoiceApi.ts
│   │   ├── jobTypeApiSlice.ts
│   │   ├── projectApi.ts           # จัดการ API โปรเจกต์คอนเทนเนอร์ (อัปเดตใหม่)
│   │   ├── taskApi.ts              # จัดการ API งานย่อยบนบอร์ด (ใหม่)
│   │   ├── proposalApi.ts
│   │   ├── snippetApiSlice.ts
│   │   └── timeLogApi.ts
│   └── store.ts                    # การรวม Store หลักของ Redux Toolkit
```

---

## 🗃️ โมเดลข้อมูลและประเภทข้อมูลหลัก (Data Models & TypeScript Types)

รายละเอียดโครงสร้างประเภทข้อมูลล่าสุดกำหนดไว้ที่ไฟล์ [src/lib/types.ts](file:///D:/Work/DashFW/src/lib/types.ts):

### 1. การตั้งค่าระบบงานทำซ้ำ (RepeatConfig)
* **[RepeatConfig](file:///D:/Work/DashFW/src/lib/types.ts#L1)**
  - `interval`: number
  - `unit`: `'Day' | 'Week' | 'Month' | 'Year'`
  - `daysOfWeek`: string[] (optional - เช่น `['Mo', 'Tu']`)
  - `endDate`: string | Date (optional)
  - `monthlyType`: string (optional - `'date' | 'weekday'`)

### 2. โครงสร้างโครงการหลักระดับสูง (Project Container)
* **[Project](file:///D:/Work/DashFW/src/lib/types.ts#L36)**
  - `id`: string (Project ID)
  - `title`: string (ชื่อโครงการ)
  - `clientId` / `companyId`: string (อ้างอิงลูกค้าหรือบริษัท)
  - `details`: string (คำอธิบาย)
  - `hourlyRate` / `currency`: number / string (การตั้งราคาตามเวลาสะสม)
  - `color`: string (สีประจำตัวโครงการ)
  - `boardViews`: string[] (มุมมองบอร์ดที่ได้รับสิทธิ์แสดงผล)
  - `detailsSections`: `{ id, title, content }[]` (หมวดหมู่โน้ตจดบันทึกภายในโครงการ)

### 3. โครงสร้างงานหลักคัมบัง (Task)
* **[Task](file:///D:/Work/DashFW/src/lib/types.ts#L64)**
  - `id`: string (Task ID)
  - `projectId`: string (เชื่อมต่อกลับไปยัง Project Container)
  - `clientId` / `jobTypeId`: string (อ้างอิงข้อมูลผู้เกี่ยวข้อง)
  - `status`: `ProjectStatus` (`'Backlog' | 'In Progress' | 'Review' | 'Completed' | 'Paid'`)
  - `title` / `subtitle` / `details`: string (รายละเอียดงานย่อย)
  - `gross_price` / `revisions`: number (ราคาและรอบการส่งตรวจของงาน)
  - `subTasks`: `SubTask[]`
  - `repeats`: `RepeatConfig` (กำหนดความถถี่การวนลูปงาน)

### 4. โครงสร้างสมาชิกและบริษัท (Client & Company)
* **[Client](file:///D:/Work/DashFW/src/lib/types.ts#L97)** (ข้อมูลคอนแทกต์ลูกค้า)
  - `_id`: string
  - `name`: string (ชื่อที่แสดงผล)
  - `email` / `phone` / `address`: string (ข้อมูลติดต่อ)
  - `isCompany` / `companyId`: boolean / string (ความเกี่ยวข้องกับบริษัทต้นสังกัด)
* **[Company](file:///D:/Work/DashFW/src/lib/types.ts#L127)** (ข้อมูลบริษัทลูกค้า)
  - `_id`: string
  - `name`: string
  - `email` / `phone` / `address` / `country`: string
  - `clients`: `Client[]` (รายชื่อลูกจ้างหรือคู่ติดต่อในบริษัทนี้)

---

## 🔄 การจัดการสถานะด้วย Redux Toolkit & RTK Query

การจัดการสถานะประสานงานผ่าน Redux ในไฟล์ [src/store.ts](file:///D:/Work/DashFW/src/store.ts) ใช้ API Slice ดังนี้:

1. **[clientApi](file:///D:/Work/DashFW/src/services/clientApi.ts)** -> จัดการข้อมูลลูกค้าและคอนแทกต์ติดต่อเดี่ยว (`client`)
2. **[companyApi](file:///D:/Work/DashFW/src/services/companyApi.ts)** -> จัดการกลุ่มบริษัทองค์กรพาร์ตเนอร์ (`company`)
3. **[projectApi](file:///D:/Work/DashFW/src/services/projectApi.ts)** -> จัดการโปรเจกต์คอนเทนเนอร์ระดับสูง (`project`)
4. **[taskApi](file:///D:/Work/DashFW/src/services/taskApi.ts)** -> จัดการงานแต่ละรายการที่เคลื่อนไหวบน Kanban board (`task`)
5. **[jobTypeApi](file:///D:/Work/DashFW/src/services/jobTypeApiSlice.ts)** -> แม่แบบรายการเช็คลิสต์สำเร็จรูปตามสายงาน (`job-type`)
6. **[snippetApi](file:///D:/Work/DashFW/src/services/snippetApiSlice.ts)** -> จัดการคลังสคริปต์ข้อความตอบกลับ AI (`snippet`)
7. **[timeLogApi](file:///D:/Work/DashFW/src/services/timeLogApi.ts)** -> ระบบประเมินประสิทธิภาพและชั่วโมงงาน (`time-log`)
8. **[invoiceApi](file:///D:/Work/DashFW/src/services/invoiceApi.ts)** -> ระบบออกใบแจ้งหนี้ (`invoice`)
9. **[proposalApi](file:///D:/Work/DashFW/src/services/proposalApi.ts)** -> ระบบข้อเสนอโครงการและแผนงาน (`proposal`)

---

## 🧭 โครงสร้างของแถบเมนูด้านข้าง (Grouped Sidebar Navigation)

แถบเมนูด้านข้างถูกจัดหมวดหมู่อย่างเป็นระเบียบในไฟล์ [sidebar.tsx](file:///D:/Work/DashFW/src/components/sidebar.tsx) ดังนี้:

- **Core (ระบบหลัก):**
  - Home (แดชบอร์ดหลัก) -> `/dashboard`
  - Projects (โครงการหลักทั้งหมด) -> `/projects`
  - Tasks (บอร์ดคัมบังและการจัดการงานย่อย) -> `/board`
  - Inbox (ระบบกล่องข้อความ / จัดการ Snippet) -> `/snippets` (WIP)
- **Business (งานบริการธุรกิจ):**
  - Contacts (ผู้ติดต่อและบริษัท) -> `/clients`
  - Proposals (ใบเสนอราคาแผนงาน) -> `/invoices`
  - Financials (รายงานกระแสการเงิน) -> `/financials`
- **AI / Settings (ระบบปัญญาประดิษฐ์และตั้งค่าระบบ):**
  - AI Snippets (ตัวเจนเทมเพลตพูดคุยผ่าน AI) -> `/snippets`
  - AI Checklists (ตัวเจนเช็คลิสต์ผ่าน AI) -> `/checklists`
  - Templates (ตั้งค่าประเภทงานหลัก) -> `/job-types`

---

## ⚙️ การตั้งค่าสภาพแวดล้อมและการรันระบบ

ศึกษาเพิ่มเติมการตั้งค่าสภาพแวดล้อมได้ในไฟล์สภาพแวดล้อม `.env.local` และรันคำสั่งพื้นฐานดังนี้:

1. ติดตั้งไลบรารี: `npm install` หรือ `yarn install`
2. รันโหมดผู้พัฒนา: `npm run dev` (เปิดใช้งานระบบที่ [http://localhost:9002](http://localhost:9002))
3. รันสคริปต์เช็คโครงสร้าง TypeScript: `npm run typecheck`
4. คำสั่งย้ายระบบฐานข้อมูล (Database Migration):
   ```bash
   node scratch/migrate.js
   ```
