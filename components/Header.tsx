import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="text-center mb-8 w-full max-w-md">
      <h1 className="text-5xl font-extrabold text-white leading-tight mb-4 tracking-wider animate-bounce-slow">
        🎶🎸 Kick Rocks! 🥁🎤
      </h1>
      <p className="text-lg text-white text-opacity-80 max-w-2xl mx-auto italic mb-4">
        👋😜 Your Go-To for Gloriously Grumpy Goodbyes & Tunes that'll Make 'Em Squirm! 😂🎶
      </p>
      {currentUser && (
        <div className="text-white text-opacity-90 flex items-center justify-center gap-2">
          <span>Welcome, {currentUser.username}!</span>
          <button
            onClick={logout}
            className="ml-2 px-3 py-1 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;