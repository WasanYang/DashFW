export type RepeatConfig = {
  interval: number;
  unit: 'Day' | 'Week' | 'Month' | 'Year';
  daysOfWeek?: string[]; // e.g. ['Mo', 'Tu']
  action?: string;
  isEnd?: boolean;
  endDate?: string | Date;
  monthlyType?: string; // 'date' | 'weekday'
  monthlyDate?: number; // 1-31
  monthlyOrdinal?: string; // 'First', 'Second', etc.
  monthlyWeekday?: string; // 'Monday', 'Tuesday', etc.
};

export type SubTask = {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  children?: SubTask[];
  startDate?: string | Date;
  dueDate?: string | Date;
  repeats?: string | RepeatConfig;
  assignee?: string;
  creator?: string;
  dependencies?: string[];
  customFields?: { label: string; value: string }[];
};

export type ProjectStatus =
  | 'Backlog'
  | 'In Progress'
  | 'Review'
  | 'Completed'
  | 'Paid';

export type Project = {
  id: string;
  title: string;
  subtitle?: string;
  clientId?: string;
  companyId?: string;
  details?: string;
  startDate?: string | Date;
  deadline?: string | Date;
  gross_price?: number;
  hourlyRate?: number;
  currency?: string;
  color?: string;
  archived?: boolean;
  billable?: boolean;
  revisions?: number;
  client?: Client | null;
  company?: Company | null;
  status?: string;
  relatedProjectIds?: string[];
  boardViews?: string[];
  detailsSections?: {
    id: string;
    title: string;
    content: string;
  }[];
};

export type Task = {
  id: string;
  order?: number; // ลำดับใน column
  orderNo?: string;
  title: string;
  details?: string;
  projectId?: string; // Links to parent Project Container
  clientId: string;   // Keeping client ID reference
  jobTypeId?: string; // Job type reference
  status: ProjectStatus; // Backlog, In Progress, etc.
  gross_price: number;
  deadline: any;
  revisions: number;
  subTasks?: SubTask[];
  client?: Client | null;
  projectTitle?: string; // De-normalized title for convenience
  color?: string;
  archived?: boolean;
  subtitle?: string;
  startDate?: string | Date;
  billable?: boolean;
  hourlyRate?: number;
  currency?: string;
  repeats?: string | RepeatConfig;
  boardView?: string;
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
  address?: string;
  city_state?: string;
  country?: string;
  zip?: string;
  timezone?: string;
  bio?: string;
  date_of_birth?: string;
  archived?: boolean;
  companyId?: string;
  company?: Company | null;
};

export type Company = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  socials?: Social[];
  customFields?: { label: string; value: string }[];
  address?: string;
  city_state?: string;
  country?: string;
  zip?: string;
  timezone?: string;
  bio?: string;
  archived?: boolean;
  notes?: string;
  clients?: Client[];
  status?: 'Active' | 'Pending' | 'Inactive';
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
  contactId?: string;
  billable?: boolean;
  costRate?: number;
  billingRate?: number;
  costStatus?: 'Paid' | 'Unpaid';
  category?: string;
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
  title?: string;
  subtotal?: number;
  paymentMethod?: string;
  paidAt?: string;
  currency?: string;
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

