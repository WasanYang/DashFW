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
};

export type Snippet = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

export type Checklist = {
  id: string;
  title: string;
  items: { id: string; text: string; completed: boolean }[];
};
