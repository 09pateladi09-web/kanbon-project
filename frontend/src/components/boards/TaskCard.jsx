import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../utils/helpers';
import { MessageSquare, Paperclip, Clock, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { deleteTask } from '../../redux/slices/taskSlice';
import TaskDetailModal from './TaskDetailModal';

const priorityColors = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
};

const TaskCard = ({ task, isOverlay }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task._id));
    }
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-28 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 opacity-50"
      />
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "group relative flex cursor-grab flex-col gap-3 rounded-lg border border-surface-200 bg-white p-3 shadow-sm hover:border-primary-300 hover:shadow-md active:cursor-grabbing",
          isOverlay && "cursor-grabbing rotate-2 scale-105 shadow-xl"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {task.priority && (
              <span className={cn("rounded px-2 py-0.5 text-xs font-medium", priorityColors[task.priority] || priorityColors.Medium)}>
                {task.priority}
              </span>
            )}
          </div>
          <button 
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-red-600 transition-opacity"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm font-medium text-surface-900 line-clamp-2">
          {task.title}
        </p>

        <div className="flex items-center justify-between text-xs text-surface-500 mt-1">
          <div className="flex items-center space-x-3">
            {task.dueDate && (
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center">
              <MessageSquare className="mr-1 h-3 w-3" />
              <span>{task.commentsCount || 0}</span>
            </div>
            {task.attachments?.length > 0 && (
              <div className="flex items-center">
                <Paperclip className="mr-1 h-3 w-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
          </div>
          {task.assignedTo && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-[10px] font-medium text-surface-700">
              {task.assignedTo.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={task} 
      />
    </>
  );
};

export default TaskCard;
