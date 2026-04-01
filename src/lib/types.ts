export type ProjectStatus = 'Backlog' | 'In Progress' | 'Review' | 'Completed' | 'Paid';

export type Project = {
  id: string;
  title: string;
  clientId: string;
  propertyId?: string;
  status: ProjectStatus;
  gross_price: number;
  deadline: Date;
  revisions: number;
};

export type Client = {
  id: string;
  name: string;
  fastwork_link: string;
  email: string;
  avatarUrl?: string;
};

export type Property = {
  id: string;
  clientId: string;
  name: string;
  drive_link: string;
  credentials?: {
    ota: string;
    login: string;
  };
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
