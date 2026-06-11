import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { fetchBoardById } from '../redux/slices/boardSlice';
import { fetchTasks, bulkUpdatePositions, moveTaskOptimistically } from '../redux/slices/taskSlice';
import useSocket from '../hooks/useSocket';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import Column from '../components/boards/Column';
import TaskCard from '../components/boards/TaskCard';
import CreateTaskModal from '../components/boards/CreateTaskModal';
import { Plus, Users, Settings } from 'lucide-react';

const COLUMNS = ['Todo', 'In Progress', 'Done'];

const BoardPage = () => {
  const { boardId } = useParams();
  const dispatch = useDispatch();
  
  // Initialize Socket connection and listeners
  useSocket(boardId);

  const { currentBoard, currentBoardStatus } = useSelector((state) => state.boards);
  const { items: tasks, status: tasksStatus } = useSelector((state) => state.tasks);
  
  const [activeTask, setActiveTask] = useState(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState('Todo');

  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardById(boardId));
      dispatch(fetchTasks(boardId));
    }
  }, [dispatch, boardId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    const grouped = { 'Todo': [], 'In Progress': [], 'Done': [] };
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    // Sort each column by position
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    
    // Find active task
    const activeTask = tasks.find(t => t._id === activeId);
    if (!activeTask) return;

    // Determine target status
    let targetStatus = activeTask.status;
    let targetIndex = 0;

    // Is over a column?
    if (COLUMNS.includes(overId)) {
      targetStatus = overId;
      targetIndex = tasksByColumn[targetStatus].length; // Append to end
    } else {
      // Over another task
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        targetIndex = tasksByColumn[targetStatus].findIndex(t => t._id === overId);
        
        // If moving down, we might need to adjust index slightly but dnd-kit gives relative positions.
        // Actually, we'll calculate exact index.
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        targetIndex = targetIndex >= 0 ? targetIndex + modifier : tasksByColumn[targetStatus].length + 1;
      }
    }

    if (activeTask.status === targetStatus && targetIndex === tasksByColumn[targetStatus].findIndex(t => t._id === activeId)) {
      // Same spot, do nothing
      return;
    }

    // Prepare updated tasks array for bulk update
    const targetColumnTasks = [...tasksByColumn[targetStatus]];
    if (activeTask.status === targetStatus) {
      // Moving within same column
      const currentIndex = targetColumnTasks.findIndex(t => t._id === activeId);
      targetColumnTasks.splice(currentIndex, 1);
      targetColumnTasks.splice(targetIndex, 0, activeTask);
    } else {
      // Moving across columns
      targetColumnTasks.splice(targetIndex, 0, { ...activeTask, status: targetStatus });
    }

    // Recalculate positions based on fractional indexing logic (simplified here, backend handles exact spacing)
    // For payload, we'll send the ordered IDs and statuses to backend.
    const updates = targetColumnTasks.map((task, idx) => ({
      taskId: task._id,
      status: targetStatus,
      position: idx * 65536, // This will be overwritten by backend's actual fractional calc, but good for optimistic UI
      version: task.version
    }));
    
    // Let's just pass the moved task and its new surrounding context to the backend, 
    // or send the entire column's new order. Sending entire column order is robust.
    dispatch(bulkUpdatePositions({
      boardId,
      tasks: updates
    }));

    // Optimistically update
    dispatch(moveTaskOptimistically({
      taskId: activeId,
      newStatus: targetStatus,
      newPosition: updates.find(u => u.taskId === activeId).position
    }));
  };

  const openCreateModal = (status) => {
    setInitialStatus(status);
    setIsCreateTaskModalOpen(true);
  };

  if (currentBoardStatus === 'loading' || !currentBoard) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex h-full flex-col bg-surface-50">
      {/* Board Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-surface-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-surface-900">{currentBoard.title}</h1>
          <div className="flex -space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary-100 text-xs font-medium text-primary-700">
              {currentBoard.createdBy.name?.charAt(0) || 'U'}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-surface-500">
            <Users className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="sm" className="text-surface-500">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start space-x-6">
            <SortableContext items={COLUMNS} strategy={horizontalListSortingStrategy}>
              {COLUMNS.map((columnId) => (
                <Column
                  key={columnId}
                  id={columnId}
                  title={columnId}
                  tasks={tasksByColumn[columnId] || []}
                  onAddTask={() => openCreateModal(columnId)}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        boardId={boardId}
        initialStatus={initialStatus}
      />
    </div>
  );
};

export default BoardPage;
