import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongodb';
import type { KnowledgeBaseArticle } from '@/lib/types';

const COLLECTION = 'knowledge_base';

const SEED_ARTICLES: Omit<KnowledgeBaseArticle, 'id' | '_id'>[] = [
  {
    title: 'Google Maps Setup Onboarding',
    tags: ['Google Maps', 'Onboarding', 'Setup'],
    quickCredentials: [
      { id: '1', label: 'Gmail Address', value: '' },
      { id: '2', label: 'Business Name (Thai/Eng)', value: '' },
      { id: '3', label: 'Business Category', value: '' },
      { id: '4', label: 'Contact Number', value: '' },
      { id: '5', label: 'Exact Address', value: '' }
    ],
    content: `<h3>ข้อมูลและสิ่งที่ต้องขอจากลูกค้าสำหรับทำ Google Maps</h3>
<p>คัดลอกรายการนี้ส่งให้ลูกค้าทางแชทเพื่อรวบรวมข้อมูลก่อนทำงาน:</p>
<hr />
<ul>
  <li><strong>ชื่อธุรกิจ (Business Name):</strong> ภาษาไทยและภาษาอังกฤษที่ต้องการให้ปรากฏบนแผนที่</li>
  <li><strong>หมวดหมู่ธุรกิจ (Category):</strong> เช่น คาเฟ่, ร้านอาหาร, โรงแรม, คลินิกทันตกรรม</li>
  <li><strong>เบอร์โทรศัพท์ (Phone Number):</strong> เบอร์สำหรับแสดงบนแผนที่เพื่อให้ลูกค้าติดต่อ</li>
  <li><strong>ที่อยู่อย่างละเอียด (Address):</strong> บ้านเลขที่, อาคาร, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์ และจุดสังเกต</li>
  <li><strong>พิกัดละติจูด/ลองจิจูด หรือรูปแผนที่วาดมือ (Coordinates):</strong> เพื่อการปักหมุดที่แม่นยำ</li>
  <li><strong>รูปถ่ายหน้าร้านและบรรยากาศ (Photos):</strong> รูปถ่ายป้ายหน้าร้าน, รูปทางเข้า, รูปภาพภายในอย่างน้อย 5-10 รูป</li>
  <li><strong>Gmail หลักของลูกค้า:</strong> เพื่อให้ทีมงานสามารถเชิญสิทธิ์ในการเป็นเจ้าของหมุด (Owner) หลังปักสำเร็จ</li>
</ul>
<p><em>หมายเหตุ: การยืนยันตัวตน Google Business Profile บางครั้งอาจต้องใช้วิธีการถ่ายวิดีโอหน้าร้านจริง หรือรับรหัสทางไปรษณียบัตร ขึ้นอยู่กับเงื่อนไขของทาง Google</em></p>`,
    updatedAt: new Date()
  },
  {
    title: 'OTA Setup Onboarding (Booking / Agoda / Expedia)',
    tags: ['OTA', 'Onboarding', 'Hotel'],
    quickCredentials: [
      { id: '1', label: 'Gmail / Account Email', value: '' },
      { id: '2', label: 'Hotel Name (English)', value: '' },
      { id: '3', label: 'Bank Name & Account Number', value: '' },
      { id: '4', label: 'Phone Number', value: '' },
      { id: '5', label: 'Contact Person Name', value: '' }
    ],
    content: `<h3>ข้อมูลและเอกสารที่ต้องขอจากลูกค้าเพื่อลงทะเบียนขายห้องพักบน OTA</h3>
<p>ส่งข้อมูลชุดนี้ให้ลูกค้าเพื่อรวบรวมประกอบการสมัครบัญชี:</p>
<hr />
<ul>
  <li><strong>ข้อมูลบัญชีผู้ใช้ (Account Email):</strong> แนะนำให้ใช้ Gmail ใหม่ของที่พัก หรืออีเมลส่วนกลางที่สามารถแชร์รหัสผ่านให้แอดมินเข้าไปจัดการได้</li>
  <li><strong>ชื่อที่พัก (Hotel/Property Name):</strong> ชื่อภาษาอังกฤษที่เป็นทางการสำหรับการสร้างโปรไฟล์</li>
  <li><strong>เอกสารจดทะเบียน (ถ้ามี):</strong> ทะเบียนการค้า หรือใบอนุญาตประกอบธุรกิจโรงแรม (สำหรับบางระบบที่บังคับตรวจสอบ)</li>
  <li><strong>ข้อมูลบัญชีธนาคารสำหรับรับเงินโอน (Bank Details):</strong> รูปถ่ายหน้าสมุดบัญชีธนาคาร (ชื่อบัญชีต้องตรงกับเจ้าของหรือบริษัทผู้จดทะเบียนที่พัก)</li>
  <li><strong>นโยบายการจองห้องพัก (Policies):</strong> นโยบายยกเลิกการจองฟรี/แบบไม่มีการคืนเงิน, เวลา Check-in / Check-out</li>
  <li><strong>รายละเอียดห้องพัก (Room Details):</strong> จำนวนห้องทั้งหมด, ประเภทเตียงนอนในแต่ละห้อง, อุปกรณ์อำนวยความสะดวกที่มี</li>
</ul>
<p><em>ข้อควรระวัง: ห้ามนำรูปที่มีลายน้ำของช่างภาพ หรือรูปที่ละเมิดลิขสิทธิ์จากแพลตฟอร์มอื่นมาใช้ลงทะเบียนเด็ดขาด เพราะอาจถูกฟ้องร้องหรือถูกแบนบัญชีในภายหลัง</em></p>`,
    updatedAt: new Date()
  }
];

async function seedIfEmpty(db: any) {
  const count = await db.collection(COLLECTION).countDocuments();
  if (count === 0) {
    // Check if there are any JobTypes, and try to map them if possible
    const jobTypes = await db.collection('job_types').find().toArray();
    
    const seeded = SEED_ARTICLES.map(article => {
      // Find matching jobType by name substring
      const matchingType = jobTypes.find((jt: any) => 
        jt.name.toLowerCase().includes(article.title.toLowerCase().split(' ')[0].toLowerCase())
      );
      return {
        ...article,
        jobTypeId: matchingType ? matchingType._id.toString() : undefined
      };
    });
    
    await db.collection(COLLECTION).insertMany(seeded);
  }
}

export async function getArticles() {
  const { db } = await connectToDatabase();
  await seedIfEmpty(db);
  const result = await db.collection(COLLECTION).find().toArray();
  return result.map(a => ({
    ...a,
    id: a._id.toString(),
    _id: a._id.toString()
  }));
}

export async function createArticle(article: Omit<KnowledgeBaseArticle, 'id' | '_id'>) {
  const { db } = await connectToDatabase();
  const data = {
    ...article,
    updatedAt: new Date()
  };
  const result = await db.collection(COLLECTION).insertOne(data);
  return { ...data, id: result.insertedId.toString(), _id: result.insertedId.toString() };
}

export async function updateArticle(id: string, article: Partial<KnowledgeBaseArticle>) {
  const { db } = await connectToDatabase();
  const { id: _, _id: __, ...updateData } = article;
  updateData.updatedAt = new Date();
  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  return { id, _id: id, ...updateData };
}

export async function deleteArticle(id: string) {
  const { db } = await connectToDatabase();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return { id, _id: id };
}
