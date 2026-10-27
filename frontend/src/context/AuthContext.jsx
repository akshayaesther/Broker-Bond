import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedBroker = localStorage.getItem('broker');
    if (token && storedBroker) {
      setBroker(JSON.parse(storedBroker));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('broker', JSON.stringify(data.broker));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setBroker(data.broker);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('broker');
    delete axios.defaults.headers.common['Authorization'];
    setBroker(null);
  };

  return (
    <AuthContext.Provider value={{ broker, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
