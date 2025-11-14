// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  // On app start, check for a saved user object
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.warn('Failed to load user from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Login function (this is now correct)
  const login = async (userData, authToken, rememberMe) => {
    setUser(userData);
    setToken(authToken); 
    if (rememberMe) {
      try {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.warn("Failed to save user to storage", e);
      }
    }
  };

  // ⬇️ *** THIS IS THE FIX *** ⬇️
  // The logout function should NOT handle navigation.
  // It just clears the state. RootNavigator will handle the rest.
  const logout = async () => {
    console.log("[AuthContext] Logging out and clearing user state.");
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.warn("Failed to remove user from storage", e);
    }
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2F6C4F" />
      </View>
    );
  }

  // Provide the state
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};