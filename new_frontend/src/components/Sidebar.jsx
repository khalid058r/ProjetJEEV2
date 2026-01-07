import React from 'react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  // ... tes hooks ...

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:inset-auto
      overflow-y-auto
      scrollbar-thin scrollbar-thumb-gray-300
    `}>
      {/* Contenu de la sidebar */}
      <div className="p-4">
        <h2 className="text-xl font-bold">Sidebar</h2>
        {/* Ajoutez ici vos liens ou autres éléments */}
      </div>
    </div>
  );
}
