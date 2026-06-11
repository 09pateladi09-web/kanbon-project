import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Home, X, Plus, Users, Hash, Settings } from 'lucide-react';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import { cn } from '../../utils/helpers';
import Button from '../common/Button';
import CreateBoardModal from '../boards/CreateBoardModal';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { items: boards } = useSelector((state) => state.boards);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    cn(
      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
    );

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-200 bg-white transition-transform duration-300 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo & Close Button (Mobile) */}
        <div className="flex h-14 items-center justify-between border-b border-surface-200 px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <span className="font-bold text-white">K</span>
            </div>
            <span className="text-lg font-bold text-surface-900">KanbanFlow</span>
          </div>
          <button
            className="md:hidden rounded-md p-1 hover:bg-surface-100"
            onClick={() => dispatch(toggleSidebar())}
          >
            <X className="h-5 w-5 text-surface-500" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div>
            <NavLink to="/dashboard" className={navItemClass}>
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </NavLink>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
              <span>Your Boards</span>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded hover:bg-surface-200 p-0.5 text-surface-500 hover:text-surface-900 transition-colors"
                title="Create Board"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {boards.map((board) => (
                <NavLink key={board._id} to={`/b/${board._id}`} className={navItemClass}>
                  <div className="mr-3 h-2 w-2 rounded-full" style={{ backgroundColor: board.color || '#0ea5e9' }} />
                  <span className="truncate">{board.title}</span>
                </NavLink>
              ))}
              {boards.length === 0 && (
                <div className="px-3 py-2 text-sm text-surface-400 italic">No boards yet</div>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-surface-200 p-4">
          <div className="mb-4 flex items-center px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-medium text-surface-900">{user?.name}</p>
              <p className="truncate text-xs text-surface-500">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" 
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Modals */}
      <CreateBoardModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </>
  );
};

export default Sidebar;
