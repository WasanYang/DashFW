import { Project, Client, Property, Snippet, Checklist } from './types';

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Suanson Hotel',
    fastwork_link: 'https://fastwork.co/user/suanson',
    email: 'contact@suanson.com',
    avatarUrl: 'https://picsum.photos/seed/c1/100/100',
  },
  {
    id: 'client-2',
    name: 'Only U Villa',
    fastwork_link: 'https://fastwork.co/user/onlyuvilla',
    email: 'manager@onlyuvilla.com',
    avatarUrl: 'https://picsum.photos/seed/c2/100/100',
  },
  {
    id: 'client-3',
    name: 'John Doe',
    fastwork_link: 'https://fastwork.co/user/johndoe',
    email: 'johndoe.dev@gmail.com',
    avatarUrl: 'https://picsum.photos/seed/c3/100/100',
  },
];

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    clientId: 'client-1',
    name: 'Suanson Hotel - Main Branch',
    drive_link: 'https://drive.google.com/link-to-suanson-assets',
    credentials: {
      ota: 'Agoda',
      login: 'suanson_main',
    },
  },
  {
    id: 'prop-2',
    clientId: 'client-2',
    name: 'Only U Villa - Pool Access',
    drive_link: 'https://drive.google.com/link-to-onlyu-assets',
    credentials: {
      ota: 'Booking.com',
      login: 'onlyu_pool',
    },
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'New OTA Listing Setup',
    clientId: 'client-1',
    propertyId: 'prop-1',
    status: 'In Progress',
    gross_price: 500,
    deadline: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    revisions: 0,
    subTasks: [
        { id: 'sub-1-1', text: 'Booking.com', completed: true },
        { id: 'sub-1-2', text: 'Trip.com', completed: false },
        { id: 'sub-1-3', text: 'Agoda', completed: false },
        { id: 'sub-1-4', text: 'Line OA', completed: true },
        { id: 'sub-1-5', text: 'Facebook Page', completed: false },
    ]
  },
  {
    id: 'proj-2',
    title: 'Google Business SEO',
    clientId: 'client-2',
    propertyId: 'prop-2',
    status: 'In Progress',
    gross_price: 350,
    deadline: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    revisions: 1,
    subTasks: [
        { id: 'sub-2-1', text: 'Verify business', completed: true },
        { id: 'sub-2-2', text: 'Optimize description', completed: true },
        { id: 'sub-2-3', text: 'Upload photos', completed: false },
    ]
  },
  {
    id: 'proj-3',
    title: 'Digital Marketer Portfolio',
    clientId: 'client-3',
    status: 'Review',
    gross_price: 800,
    deadline: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    revisions: 3,
  },
  {
    id: 'proj-4',
    title: 'E-commerce Site',
    clientId: 'client-3',
    status: 'Backlog',
    gross_price: 1200,
    deadline: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    revisions: 0,
  },
  {
    id: 'proj-5',
    title: 'Logo Design',
    clientId: 'client-1',
    status: 'Completed',
    gross_price: 200,
    deadline: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    revisions: 2,
  },
  {
    id: 'proj-6',
    title: 'Social Media Campaign',
    clientId: 'client-2',
    status: 'Paid',
    gross_price: 650,
    deadline: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    revisions: 1,
  },
];

export const mockSnippets: Snippet[] = [
  {
    id: 'snip-1',
    title: 'Opening Pitch',
    content: "Hello! Thank you for your interest. I've reviewed your request and I'm confident I can deliver great results. Here's how I propose we move forward...",
    tags: ['opening', 'pitch'],
  },
  {
    id: 'snip-2',
    title: 'Requirement Request',
    content: "To get started, could you please provide the following details? 1. ... 2. ... 3. ... This will help ensure I fully understand your vision.",
    tags: ['requirements'],
  },
  {
    id: 'snip-3',
    title: 'Project Update',
    content: "Here's a quick update on your project. I've completed the initial design phase and will be moving on to development. You can view the progress here: [link]",
    tags: ['update', 'progress'],
  },
];

export const mockChecklists: Checklist[] = [
    {
      id: 'check-1',
      title: 'New OTA Listing Setup',
      items: [
        { id: 'c1-i1', text: 'Collect property photos and descriptions', completed: true },
        { id: 'c1-i2', text: 'Create profile on Booking.com', completed: true },
        { id: 'c1-i3', text: 'Set up pricing and availability calendar', completed: false },
        { id: 'c1-i4', text: 'Configure payment policies', completed: false },
        { id: 'c1-i5', text: 'Publish listing and verify', completed: false },
      ],
    },
    {
      id: 'check-2',
      title: 'Google Business SEO',
      items: [
        { id: 'c2-i1', text: 'Verify business ownership', completed: true },
        { id: 'c2-i2', text: 'Optimize business description and categories', completed: true },
        { id: 'c2-i3', text: 'Upload high-quality photos and videos', completed: true },
        { id: 'c2-i4', text: 'Set up services and product listings', completed: false },
        { id: 'c2-i5', text: 'Generate initial reviews', completed: false },
        { id: 'c2-i6', text: 'Create first 4 Google Posts', completed: false },
      ],
    },
  ];
