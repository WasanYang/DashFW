import { KanbanBoard } from '@/components/board/kanban-board';
import { mockProjects } from '@/lib/data';

export default function BoardPage() {
  return (
    <div>
      <KanbanBoard initialProjects={mockProjects} />
    </div>
  );
}
