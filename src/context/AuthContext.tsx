import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  familyId: string | null;
  familyName: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, familyName: string) => Promise<void>;
  registerAndJoin: (email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load familyId + familyName for a given UID
  const loadFamilyData = async (uid: string) => {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return;
    const fid = userSnap.data().familyId as string;
    setFamilyId(fid);
    const familySnap = await getDoc(doc(db, 'families', fid));
    if (familySnap.exists()) {
      setFamilyName(familySnap.data().name ?? null);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadFamilyData(u.uid);
      } else {
        setFamilyId(null);
        setFamilyName(null);
      }
      setLoading(false);
    });
  }, []);

  // Sign in existing user
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Register + create a new family group
  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fid = cred.user.uid; // Use UID as familyId — this is the invite code
    await setDoc(doc(db, 'families', fid), { name, members: [cred.user.uid] });
    await setDoc(doc(db, 'users', cred.user.uid), { familyId: fid, email });
    setFamilyId(fid);
    setFamilyName(name);
  };

  // Register + join existing family via invite code
  const registerAndJoin = async (email: string, password: string, inviteCode: string) => {
    const familySnap = await getDoc(doc(db, 'families', inviteCode));
    if (!familySnap.exists()) throw new Error('Invalid invite code. Ask your family admin.');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateDoc(doc(db, 'families', inviteCode), {
      members: arrayUnion(cred.user.uid),
    });
    await setDoc(doc(db, 'users', cred.user.uid), { familyId: inviteCode, email });
    setFamilyId(inviteCode);
    setFamilyName(familySnap.data().name ?? null);
  };

  const logout = async () => {
    await signOut(auth);
    setFamilyId(null);
    setFamilyName(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, familyId, familyName, loading, login, register, registerAndJoin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
