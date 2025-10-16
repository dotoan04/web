import {
  getUsers,
  saveUsers,
  getSession,
  setSession,
  clearSession,
} from './storage.js';

function hashPassword(password) {
  return btoa(password.split('').reverse().join(''));
}

export function register(username, password) {
  const users = getUsers();
  const exists = users.some((user) => user.username === username);
  if (exists) {
    throw new Error('Tên đăng nhập đã tồn tại.');
  }
  const now = Date.now();
  const nextUsers = [
    ...users,
    {
      id: `user-${now}`,
      username,
      password: hashPassword(password),
      createdAt: now,
    },
  ];
  saveUsers(nextUsers);
  setSession({ username, loginAt: now });
  return nextUsers;
}

export function login(username, password) {
  const users = getUsers();
  const hashed = hashPassword(password);
  const match = users.find(
    (user) => user.username === username && user.password === hashed,
  );
  if (!match) {
    throw new Error('Sai thông tin đăng nhập.');
  }
  const session = { username, loginAt: Date.now() };
  setSession(session);
  return session;
}

export function logout() {
  clearSession();
}

export function currentUser() {
  return getSession();
}

export function requireAuth() {
  const session = getSession();
  if (!session) {
    throw new Error('Cần đăng nhập.');
  }
  return session;
}
