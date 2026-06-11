import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { taskSchema } from '../../utils/validationSchemas';
import { createTask } from '../../redux/slices/taskSlice';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const CreateTaskModal = ({ isOpen, onClose, boardId, initialStatus }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'Medium'
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      const taskData = { ...data, status: initialStatus };
      const resultAction = await dispatch(createTask({ boardId, data: taskData }));
      
      if (createTask.fulfilled.match(resultAction)) {
        toast.success('Task created');
        onClose();
      } else {
        toast.error(resultAction.payload || 'Failed to create task');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Task to ${initialStatus}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="What needs to be done?"
          {...register('title')}
          error={errors.title?.message}
          autoFocus
        />
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700">Description</label>
          <textarea
            className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 custom-scrollbar"
            rows={3}
            placeholder="Add details..."
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700">Priority</label>
            <select
              className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('priority')}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <Input
            label="Due Date"
            type="date"
            {...register('dueDate')}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
