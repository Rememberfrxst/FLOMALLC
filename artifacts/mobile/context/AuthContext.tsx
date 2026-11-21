import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Address, User } from "@/constants/data";
import {
  api,
  saveTokens,
  clearTokens,
  getAccessToken,
  ApiUser,
} from "@/services/api";
import { signInWithGoogleFirebase, signOutFirebase } from "@/lib/firebaseAuth";

interface LocalAccountRecord {
  user: User;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "@griper_user_cache";
const LOCAL_ACCOUNTS_KEY = "@floma_local_accounts_v1";

function isOfflineOrUnavailableError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("abort") ||
    msg.includes("timeout") ||
    msg.includes("non-json") ||
    msg.includes("api error 404") ||
    msg.includes("api error 502") ||
    msg.includes("api error 503") ||
    msg.includes("api error 504")
  );
}

async function readLocalAccounts(): Promise<Record<string, LocalAccountRecord>> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LocalAccountRecord>;
  } catch {
    return {};
  }
}

async function saveLocalAccount(email: string, record: LocalAccountRecord) {
  try {
    const map = await readLocalAccounts();
    map[email.toLowerCase()] = record;
    await AsyncStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal storage issue
  }
}

function mapApiUser(apiUser: ApiUser, addresses: any[] = []): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone ?? "",
    addresses: addresses.map((a) => ({
      id: a.id,
      name: apiUser.name,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      phone: apiUser.phone ?? "",
      isDefault: a.isDefault,
    })),
    role: apiUser.role === "admin" ? "admin" : "user",
    avatarUrl: apiUser.avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await api.auth.me();
      let addresses: any[] = [];
      try {
        addresses = await api.addresses.list();
      } catch {
        // ignore address fetch errors
      }
      const mappedUser = mapApiUser(apiUser, addresses);
      setUser(mappedUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
    } catch {
      // Keep cached user when offline
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (cachedUser) setUser(JSON.parse(cachedUser) as User);

        const token = await getAccessToken();
        if (token) {
          await refreshUser();
        }
      } catch {
        // Ignore initial cache read issues
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) return false;
      try {
        const res = await api.auth.login(normalizedEmail, password);
        await saveTokens(res.accessToken, res.refreshToken);
        const mappedUser = mapApiUser(res.user);
        setUser(mappedUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
        await saveLocalAccount(normalizedEmail, { user: mappedUser, password });
        await refreshUser();
        return true;
      } catch (e) {
        if (!isOfflineOrUnavailableError(e)) {
          throw e;
        }
        const accounts = await readLocalAccounts();
        const existing = accounts[normalizedEmail];
        if (existing) {
          if (existing.password !== password) {
            throw new Error("Incorrect password. Please try again.");
          }
          setUser(existing.user);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(existing.user),
          );
          return true;
        }
        throw new Error(
          "No account found for this email yet. Tap 'Create New Account' to sign up.",
        );
      }
    },
    [refreshUser],
  );

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    const googleCreds = await signInWithGoogleFirebase();
    try {
      const res = await api.auth.google({
        idToken: googleCreds.idToken,
        email: googleCreds.email,
        name: googleCreds.name,
        avatarUrl: googleCreds.avatarUrl,
      });
      await saveTokens(res.accessToken, res.refreshToken);
      const mappedUser = mapApiUser(res.user);
      setUser(mappedUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
      await refreshUser();
      return true;
    } catch {
      if (!googleCreds.email) return false;
      const localUser: User = {
        id: googleCreds.uid,
        name: googleCreds.name || "FLOMA Shopper",
        email: googleCreds.email,
        phone: "",
        addresses: [],
        role: "user",
        avatarUrl: googleCreds.avatarUrl,
      };
      setUser(localUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
      return true;
    }
  }, [refreshUser]);

  const register = useCallback(
    async (
      name: string,
      email: string,
      phone: string,
      password: string,
    ): Promise<boolean> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!name.trim() || !normalizedEmail) return false;
      try {
        const res = await api.auth.register(
          name.trim(),
          normalizedEmail,
          phone.trim(),
          password,
        );
        await saveTokens(res.accessToken, res.refreshToken);
        const mappedUser = mapApiUser(res.user);
        setUser(mappedUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
        await saveLocalAccount(normalizedEmail, { user: mappedUser, password });
        await refreshUser();
        return true;
      } catch (e) {
        if (!isOfflineOrUnavailableError(e)) {
          throw e;
        }
        const accounts = await readLocalAccounts();
        if (accounts[normalizedEmail]) {
          throw new Error(
            "An account with this email already exists. Try signing in instead.",
          );
        }
        const localUser: User = {
          id: `local-${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          addresses: [],
          role: "user",
        };
        await saveLocalAccount(normalizedEmail, { user: localUser, password });
        setUser(localUser);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
        return true;
      }
    },
    [refreshUser],
  );

  const updateProfile = useCallback(
    async (name: string, phone: string) => {
      const token = await getAccessToken();
      if (token) {
        try {
          await api.auth.updateProfile({ name, phone });
          await refreshUser();
          return;
        } catch (e) {
          if (!isOfflineOrUnavailableError(e)) throw e;
        }
      }
      if (user) {
        const updated = { ...user, name, phone };
        setUser(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        const accounts = await readLocalAccounts();
        const key = user.email.toLowerCase();
        if (accounts[key]) {
          accounts[key].user = updated;
          await AsyncStorage.setItem(
            LOCAL_ACCOUNTS_KEY,
            JSON.stringify(accounts),
          );
        }
      }
    },
    [refreshUser, user],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore errors on logout
    }
    await signOutFirebase().catch(() => {});
    await clearTokens();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const addAddress = useCallback(
    async (address: Omit<Address, "id">) => {
      const token = await getAccessToken();
      if (token) {
        try {
          await api.addresses.add(address);
          await refreshUser();
          return;
        } catch (e) {
          if (!isOfflineOrUnavailableError(e)) throw e;
        }
      }
      if (user) {
        const next: Address = {
          ...address,
          id: `addr-${Date.now()}`,
          isDefault: user.addresses.length === 0 || !!address.isDefault,
        };
        const updated = {
          ...user,
          addresses: next.isDefault
            ? [
                ...user.addresses.map((a) => ({ ...a, isDefault: false })),
                next,
              ]
            : [...user.addresses, next],
        };
        setUser(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    },
    [refreshUser, user],
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      const token = await getAccessToken();
      if (token) {
        try {
          await api.addresses.setDefault(id);
          await refreshUser();
          return;
        } catch (e) {
          if (!isOfflineOrUnavailableError(e)) throw e;
        }
      }
      if (user) {
        const updated = {
          ...user,
          addresses: user.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        };
        setUser(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    },
    [refreshUser, user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        addAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
