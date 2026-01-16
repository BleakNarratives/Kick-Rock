import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Username and password can't be empty, silly!");
      return;
    }

    let success = false;
    if (isRegistering) {
      success = register(username, password);
      if (!success) {
        setError("Registration failed. Someone already snagged that name, try another, buttercup!");
      } else {
        onAuthSuccess();
      }
    } else {
      success = login(username, password);
      if (!success) {
        setError("Whoopsie! You fumbled the login. Invalid username or password, hotshot.");
      } else {
        onAuthSuccess();
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl space-y-6">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        {isRegistering ? '✍️ Sign Up, Buttercup!' : '🔑 Get In, Loser!'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label htmlFor="username" className="text-gray-700 font-semibold mb-2">
            Your Awesome Username
          </label>
          <input
            type="text"
            id="username"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="password" className="text-gray-700 font-semibold mb-2">
            Your Super Secret Password
          </label>
          <input
            type="password"
            id="password"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition duration-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isRegistering ? "new-password" : "current-password"}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative font-bold" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 px-6 bg-purple-700 text-white font-extrabold rounded-lg shadow-md hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-300 transform hover:scale-105 active:scale-95"
        >
          {isRegistering ? 'Join the Cool Kids Club!' : 'Kick Some Doors Down!'}
        </button>
      </form>
      <button
        onClick={() => setIsRegistering(!isRegistering)}
        className="w-full text-center text-purple-600 hover:underline mt-4 font-semibold transition-colors"
      >
        {isRegistering ? 'Already got your VIP pass? Log in, cool kid!' : 'New around here? Sign up, champ!'}
      </button>
    </div>
  );
};

export default AuthForm;