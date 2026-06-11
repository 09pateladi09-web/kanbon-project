import api from './axiosInstance';

export const getComments = (taskId) => api.get(`/comments/task/${taskId}`);
export const addComment = (taskId, data) => api.post(`/comments/task/${taskId}`, data);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);
