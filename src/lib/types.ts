export type SubTask = {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  children?: SubTask[];
};

export type ProjectStatus =
  | 'Backlog'
  | 'In Progress'
  | 'Review'
  | 'Completed'
  | 'Paid';

export type Project = {
  id: string;
  order?: number; // ลำดับใน column
  orderNo?: string;
  title: string;
  subtitle?: string;
  clientId: string;
  jobTypeId?: string; // เพิ่มฟิลด์ประเภทของงาน
  status: ProjectStatus;
  gross_price: number;
  deadline: Date;
  revisions: number;
  subTasks?: SubTask[];
  client?: Client | null;
  details?: string;
};

export type Social = {
  id: string;
  platform: string;
  value: string;
};

export type Client = {
  _id: string;
  name: string;
  fastwork_link: string;
  email: string;
  avatarUrl?: string;
  socials?: Social[];
  notes?: string;
  firstName?: string;
  lastName?: string;
  userRole?: string;
  phone?: string;
  companyName?: string;
  role?: string;
  isCompany?: boolean;
  manager?: boolean;
  inviteToWorkspace?: boolean;
  customFields?: { label: string; value: string }[];
};

export type Snippet = {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  tags: string[];
};

export type Checklist = {
  id: string;
  title: string;
  items: { id: string; text: string; completed: boolean }[];
};

export type JobType = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  checklists?: { id: string; text: string }[];
};

export type TimeLog = {
  _id?: string;
  id?: string;
  projectId?: string;
  projectTitle?: string;
  taskName: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  duration: number; // in seconds
  note?: string;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export type Invoice = {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  issueDate: string; // ISO Date string
  dueDate: string; // ISO Date string
  items: InvoiceItem[];
  taxRate: number; // e.g. 7
  discount: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  client?: Client | null;
};

export type ProposalStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined';

export type Proposal = {
  _id?: string;
  id?: string;
  proposalNumber: string;
  clientId: string;
  title: string;
  description?: string;
  issueDate: string; // ISO Date string
  validUntil: string; // ISO Date string
  items: InvoiceItem[];
  total: number;
  status: ProposalStatus;
  notes?: string;
  client?: Client | null;
};

