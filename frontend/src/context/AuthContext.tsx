
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
  } from "react";
  
  import type { User, AuthResponse } from "../services/api";
  
  interface AuthContextType {
    user: User | null;
    login: (data: AuthResponse) => void;
    logout: () => void;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(
    undefined
  );
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
      const stored = sessionStorage.getItem("eventpro_user");
  
      if (!stored || !sessionStorage.getItem("eventpro_token")) {
        return null;
      }
  
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    });
  
    function login(data: AuthResponse) {
      sessionStorage.setItem("eventpro_token", data.token);
      sessionStorage.setItem(
        "eventpro_user",
        JSON.stringify(data.user)
      );
  
      setUser(data.user);
    }
  
    function logout() {
      sessionStorage.removeItem("eventpro_token");
      sessionStorage.removeItem("eventpro_user");
      setUser(null);
    }
  
    return (
      <AuthContext.Provider value={{ user, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error("useAuth must be used inside AuthProvider");
    }
  
    return context;
  }
  