
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type {
  User,
  AuthResponse,
} from "../services/api";

interface AuthContextType {
  user: User | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("eventpro_user");
    const token = sessionStorage.getItem("eventpro_token");

    if (!stored || !token) return null;

    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  });

  function login(data: AuthResponse) {
    sessionStorage.setItem(
      "eventpro_token",
      data.token
    );

    sessionStorage.setItem(
      "eventpro_user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
  }

  function updateUser(updatedUser: User) {
    sessionStorage.setItem(
      "eventpro_user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);
  }

  function logout() {
    sessionStorage.removeItem("eventpro_token");
    sessionStorage.removeItem("eventpro_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
