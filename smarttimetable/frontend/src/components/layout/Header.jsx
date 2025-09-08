import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for notifications in location state (from redirects)
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info'
      });
      
      // Clear the notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Function to dismiss notification manually
  const dismissNotification = () => {
    setNotification(null);
  };

  // Get the current page title based on the URL path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.startsWith('/dashboard') || path === '/') {
      return 'Dashboard';
    } else if (path.startsWith('/masters')) {
      return 'Master Data Management';
    } else if (path.startsWith('/generator')) {
      return 'Timetable Generator';
    } else if (path.startsWith('/timetables')) {
      return 'Timetables';
    } else if (path.startsWith('/approval')) {
      return 'Pending Approvals';
    } else if (path.startsWith('/approved')) {
      return 'Approved Timetables';
    } else if (path.startsWith('/view')) {
      return 'View Timetables';
    } else if (path.startsWith('/timetable/')) {
      return 'Timetable Details';
    } else {
      return 'SmartTimetable';
    }
  };
  
  // Toggle user menu dropdown
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  // Close the dropdown if clicked outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showUserMenu]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center">
            {/* Search bar - can be enabled if needed */}
            {/* <div className="max-w-lg w-full lg:max-w-xs mr-4">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-sm">search</span>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </div> */}
            
            {/* User menu dropdown */}
            <div className="ml-4 relative user-menu-container">
              <div>
                <button
                  type="button"
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  id="user-menu-button"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  onClick={toggleUserMenu}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      {user?.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                    <span className="ml-2 text-gray-700 truncate max-w-[150px]">
                      {user?.email || 'User'}
                    </span>
                    <span className="material-icons text-gray-400 text-sm ml-1">
                      {showUserMenu ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                  </div>
                </button>
              </div>
              
              {/* Dropdown menu */}
              {showUserMenu && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex="-1"
                >
                  <div className="py-1">
                    <div className="block px-4 py-2 text-sm text-gray-500 border-b">
                      <div>{user?.email}</div>
                      <div className="font-medium text-gray-800 capitalize">{user?.role || 'User'}</div>
                    </div>
                    {/* <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      id="user-menu-item-0"
                    >
                      Your Profile
                    </a> */}
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                      id="user-menu-item-2"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification banner */}
      {notification && (
        <div className={`
          p-3 border-l-4 
          ${notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 
            notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 
            'bg-blue-50 border-blue-500 text-blue-800'}
        `}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="material-icons mr-2 text-sm">
                {notification.type === 'success' ? 'check_circle' :
                 notification.type === 'error' ? 'error' :
                 notification.type === 'warning' ? 'warning' : 'info'}
              </span>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button 
              onClick={dismissNotification} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Dismiss"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
