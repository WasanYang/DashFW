import { KanbanBoard } from '@/components/board/kanban-board';
import { mockClients, mockProjects } from '@/lib/data';
import { getTranslations } from 'next-intl/server';

export default async function BoardPage() {
  const t = await getTranslations('Board');

  const translations = {
    pageTitle: t('title'),
    newProject: t('newProject'),
    createNewProjectTitle: t('createNewProjectTitle'),
    createNewProjectDescription: t('createNewProjectDescription'),
    titleLabel: t('form.titleLabel'),
    clientLabel: t('form.clientLabel'),
    selectClientPlaceholder: t('form.selectClientPlaceholder'),
    priceLabel: t('form.priceLabel'),
    deadlineLabel: t('form.deadlineLabel'),
    pickDatePlaceholder: t('form.pickDatePlaceholder'),
    subtasksLabel: t('form.subtasksLabel'),
    addSubtask: t('form.addSubtask'),
    removeSubtask: t('form.removeSubtask'),
    createProjectButton: t('form.createProjectButton'),
    creatingProjectButton: t('form.creatingProjectButton'),
    titleRequired: t('form.titleRequired'),
    clientRequired: t('form.clientRequired'),
    priceRequired: t('form.priceRequired'),
    deadlineRequired: t('form.deadlineRequired'),
  };

  return (
    <div className="flex flex-col h-full">
      <KanbanBoard
        initialProjects={mockProjects}
        clients={mockClients}
        translations={translations}
      />
    </div>
  );
}
