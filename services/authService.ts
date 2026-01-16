import { User } from '../types';

const USERS_STORAGE_KEY = 'kickrocks_users';
const CURRENT_USER_STORAGE_KEY = 'kickrocks_currentUser';

interface StoredUser {
  username: string;
  passwordHash: string; // In a real app, this would be a securely hashed password
  musicGenerationsToday: number;
  lastLoginDate: string;
}

function getUsersFromLocalStorage(): StoredUser[] {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

function saveUsersToLocalStorage(users: StoredUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function registerUser(username: string, password: string): boolean {
  const users = getUsersFromLocalStorage();
  if (users.some(u => u.username === username)) {
    return false; // User already exists
  }
  const newUser: StoredUser = {
    username,
    passwordHash: btoa(password), // Simple base64 encode for mock password hashing
    musicGenerationsToday: 0,
    lastLoginDate: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);
  saveUsersToLocalStorage(users);
  return true;
}

export function loginUser(username: string, password: string): User | null {
  const users = getUsersFromLocalStorage();
  const foundUser = users.find(u => u.username === username && u.passwordHash === btoa(password));

  if (foundUser) {
    // Update last login date and reset music generations if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (foundUser.lastLoginDate !== today) {
      foundUser.musicGenerationsToday = 0;
      foundUser.lastLoginDate = today;
      saveUsersToLocalStorage(users); // Save updated user info
    }

    const user: User = {
      username: foundUser.username,
      musicGenerationsToday: foundUser.musicGenerationsToday,
      lastLoginDate: foundUser.lastLoginDate,
    };
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (userJson) {
    const user: User = JSON.parse(userJson);
    // Ensure usage is reset for a new day on subsequent loads if not already
    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate !== today) {
      user.musicGenerationsToday = 0;
      user.lastLoginDate = today;
      updateCurrentUser(user); // Save updated user info
    }
    return user;
  }
  return null;
}

export function updateCurrentUser(user: User): void {
  const users = getUsersFromLocalStorage();
  const userIndex = users.findIndex(u => u.username === user.username);
  if (userIndex !== -1) {
    // Update only the mutable fields that are part of User, preserving password hash
    users[userIndex].musicGenerationsToday = user.musicGenerationsToday;
    users[userIndex].lastLoginDate = user.lastLoginDate;
    saveUsersToLocalStorage(users);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user)); // Update current user session
  }
}
