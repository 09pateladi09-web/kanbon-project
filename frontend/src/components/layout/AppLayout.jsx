import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';

const AppLayout = () => {
  const dispatch = useDispatch();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar - Desktop & Mobile */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center border-b border-surface-200 bg-white px-4 md:hidden">
          <button 
            onClick={() => dispatch(toggleSidebar())}
            className="mr-4 rounded-md p-2 hover:bg-surface-100"
          >
            <Menu className="h-5 w-5 text-surface-600" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="font-bold text-white">K</span>
            </div>
            <span className="font-semibold text-surface-900">KanbanFlow</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
