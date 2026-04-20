import { SubTask } from '@/lib/types';

export const updateSubtaskRecursively = (
  tasks: SubTask[],
  taskId: string,
  field: 'text' | 'description' | 'completed',
  value: string | boolean,
): SubTask[] => {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, [field]: value };
    }
    if (task.children) {
      return {
        ...task,
        children: updateSubtaskRecursively(task.children, taskId, field, value),
      };
    }
    return task;
  });
};

export const removeSubtaskRecursively = (
  tasks: SubTask[],
  taskId: string,
): SubTask[] => {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) =>
      task.children
        ? { ...task, children: removeSubtaskRecursively(task.children, taskId) }
        : task,
    );
};

export const addChildToSubtaskRecursively = (
  tasks: SubTask[],
  parentId: string,
  newSubtask: SubTask,
): SubTask[] => {
  return tasks.map((task) => {
    if (task.id === parentId) {
      const children = task.children
        ? [...task.children, newSubtask]
        : [newSubtask];
      return { ...task, children };
    }
    if (task.children) {
      return {
        ...task,
        children: addChildToSubtaskRecursively(task.children, parentId, newSubtask),
      };
    }
    return task;
  });
};

export const calculateProgress = (tasks: SubTask[] | undefined): number => {
  if (!tasks || tasks.length === 0) return 0;
  let totalTasks = 0;
  let completedTasks = 0;
  const countTasks = (t: SubTask[]) => {
    t.forEach((task) => {
      totalTasks++;
      if (task.completed) completedTasks++;
      if (task.children) countTasks(task.children);
    });
  };
  countTasks(tasks);
  if (totalTasks === 0) return 0;
  return (completedTasks / totalTasks) * 100;
};

export const countAllSubtasks = (subtasks: SubTask[] | undefined): number => {
  if (!Array.isArray(subtasks)) return 0;
  let count = 0;
  for (const st of subtasks) {
    count++;
    if (Array.isArray(st.children)) count += countAllSubtasks(st.children);
  }
  return count;
};

export const countCompletedSubtasks = (
  subtasks: SubTask[] | undefined,
): [number, number] => {
  let total = 0,
    done = 0;
  if (!Array.isArray(subtasks)) return [0, 0];
  for (const st of subtasks) {
    total++;
    if (st.completed) done++;
    if (Array.isArray(st.children)) {
      const [t, d] = countCompletedSubtasks(st.children);
      total += t;
      done += d;
    }
  }
  return [total, done];
};
