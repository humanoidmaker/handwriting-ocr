import { useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('scribeai_user');
    const token = localStorage.getItem('scribeai_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('scribeai_token', data.token);
    localStorage.setItem('scribeai_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('scribeai_token', data.token);
    localStorage.setItem('scribeai_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('scribeai_token');
    localStorage.removeItem('scribeai_user');
    setUser(null);
  };

  return { user, loading, login, register, logout };
}
