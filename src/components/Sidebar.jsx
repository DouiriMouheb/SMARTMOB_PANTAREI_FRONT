import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Database, Monitor, Radio } from 'lucide-react';

const navItems = [
  { to: '/acquisizioni', label: 'Acquisizioni', icon: Database },
  { to: '/postazioni', label: 'Postazioni', icon: Monitor },
  { to: '/realtime-monitoring', label: 'Monitoraggio', icon: Radio },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  return (
    <aside className={`fixed h-screen bg-black text-white flex flex-col p-4 z-40 left-0 top-0 shadow-lg transition-all duration-300 ${open ? 'w-64' : 'w-16'}`}>
      <button
        className="mb-6 flex justify-center items-center w-10 h-10 bg-gray-700 rounded text-white self-start"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Chiudi sidebar' : 'Apri sidebar'}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <nav className="flex flex-col gap-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 hover:bg-red-700 p-2 rounded ${open ? '' : 'justify-center'} ${isActive ? 'bg-red-700 text-white' : ''}`}
            >
              <Icon size={24} color={isActive ? '#ffffffff' : '#a51414ff'} />
              {open && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logo footer at the bottom: full-width white bar 
      <div className="mt-auto w-full">
        {open ? (
          <div className="w-full bg-white flex items-center justify-center py-3 ">
            <img
              src="/logoFab.png"
              alt="Smartmob Pantarei"
              className="w-32 h-auto"
            />
          </div>
        ) : (
          <div className="w-full bg-white flex items-center justify-center py-2">
            <img
              src="/logoSmallFab.png"
              alt="Logo"
              className="w-6 h-6"
            />
          </div>
        )}
      </div>*/}
    </aside>
  );
};

export default Sidebar;
