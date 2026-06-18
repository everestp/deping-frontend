import { createContext, useContext } from 'react';
import {
    LoginPayload,
    RegisterPayload,
    useAuth as useAuthHook,
    UserInfo
} from '../api/auth-api';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  loggedIn: boolean;
  error: string | null;
  doLogin: (payload: LoginPayload) => Promise<any>;
  doRegister: (payload: RegisterPayload) => Promise<any>;
  doLogout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // We call the hook ONCE at the top level
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use in components
export const useAuth = () => useContext(AuthContext);
