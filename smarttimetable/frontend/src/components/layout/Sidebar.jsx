import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  
  // Define navigation items based on user role
  const getNavItems = () => {
    const items = [];
    
    if (user?.role === 'scheduler') {
      items.push(
        { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { to: '/masters', label: 'Masters', icon: 'settings' },
        { to: '/generator', label: 'Generate', icon: 'calendar_month' },
        { to: '/timetables', label: 'Timetables', icon: 'list_alt' }
      );
    } else if (user?.role === 'approver') {
      items.push(
        { to: '/approval', label: 'Pending Approvals', icon: 'pending_actions' },
        { to: '/approved', label: 'Approved', icon: 'done' }
      );
    } else {
      items.push(
        { to: '/view', label: 'View Timetables', icon: 'visibility' }
      );
    }
    
    return items;
  };
  
  const navItems = getNavItems();
  
  return (
    <div className="h-full flex flex-col bg-gray-800 text-white w-64 py-4 px-2">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold">SmartTimetable</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 text-sm rounded-lg ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`
                }
              >
                <span className="material-icons-outlined mr-3 text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 py-2 mt-6 border-t border-gray-700">
        <div className="flex items-center mb-4">
          <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">
            {user?.email ? user.email.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700"
        >
          <span className="material-icons-outlined mr-3 text-lg">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
