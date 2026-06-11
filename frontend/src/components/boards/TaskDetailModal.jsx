import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask, deleteTask } from '../../redux/slices/taskSlice';
import * as commentApi from '../../api/commentApi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Paperclip, Clock, Trash2, User, AlignLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const TaskDetailModal = ({ isOpen, onClose, task }) => {
  const dispatch = useDispatch();
  const { currentBoard } = useSelector((state) => state.boards);
  const { user } = useSelector((state) => state.auth);
  
  const [description, setDescription] = useState(task.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription(task.description || '');
      setIsEditingDesc(false);
      fetchComments();
    }
  }, [isOpen, task]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await commentApi.getComments(task._id);
      setComments(res.data.data);
    } catch (err) {
      console.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpdateDescription = () => {
    if (description !== task.description) {
      dispatch(updateTask({ taskId: task._id, data: { description } }));
    }
    setIsEditingDesc(false);
  };

  const handleStatusChange = (e) => {
    dispatch(updateTask({ taskId: task._id, data: { status: e.target.value } }));
  };

  const handlePriorityChange = (e) => {
    dispatch(updateTask({ taskId: task._id, data: { priority: e.target.value } }));
  };

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task._id));
      onClose();
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await commentApi.addComment(task._id, { message: newComment });
      setComments([...comments, res.data.data]);
      setNewComment('');
      // Optimistically we could update task comment count, but wait for socket or re-fetch
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Details & Comments */}
        <div className="flex-1 space-y-6">
          
          {/* Description */}
          <div>
            <div className="flex items-center space-x-2 mb-2 font-medium text-surface-800">
              <AlignLeft className="h-5 w-5 text-surface-500" />
              <h3>Description</h3>
            </div>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] custom-scrollbar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleUpdateDescription}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div 
                className="min-h-[60px] rounded-md bg-surface-100 p-3 text-sm text-surface-700 cursor-pointer hover:bg-surface-200 transition-colors"
                onClick={() => setIsEditingDesc(true)}
              >
                {description ? description : 'Add a more detailed description...'}
              </div>
            )}
          </div>

          {/* Activity / Comments */}
          <div>
            <div className="flex items-center space-x-2 mb-4 font-medium text-surface-800">
              <MessageSquare className="h-5 w-5 text-surface-500" />
              <h3>Activity</h3>
            </div>
            
            {/* Comment Input */}
            <div className="flex space-x-3 mb-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs uppercase">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[60px] custom-scrollbar"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  Save
                </Button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-4">
              {loadingComments ? (
                <div className="text-sm text-surface-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-surface-500">No comments yet.</div>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className="flex space-x-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-700 font-bold text-xs uppercase">
                      {comment.createdBy.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-semibold text-sm text-surface-900">{comment.createdBy.name}</span>
                        <span className="text-xs text-surface-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="mt-1 rounded-md bg-white border border-surface-200 p-2 text-sm text-surface-800">
                        {comment.message}
                      </div>
                      {comment.createdBy._id === user._id && (
                        <div className="mt-1 flex space-x-2 text-xs">
                          <button 
                            className="text-surface-500 hover:text-red-600 underline"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Metadata */}
        <div className="w-full md:w-48 space-y-4 shrink-0">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</label>
            <select
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={task.status}
              onChange={handleStatusChange}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Priority</label>
            <select
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={task.priority}
              onChange={handlePriorityChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Assignee</label>
            <div className="flex items-center space-x-2 rounded bg-surface-100 px-2 py-1.5 text-sm cursor-not-allowed text-surface-600">
              <User className="h-4 w-4" />
              <span>{task.assignedTo?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Due Date</label>
            <div className="flex items-center space-x-2 rounded bg-surface-100 px-2 py-1.5 text-sm cursor-not-allowed text-surface-600">
              <Clock className="h-4 w-4" />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-200">
            <Button 
              variant="danger" 
              className="w-full justify-start" 
              size="sm"
              onClick={handleDeleteTask}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
