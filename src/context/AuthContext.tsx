import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Category } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  familyId: string | null;
  familyName: string | null;
  billingCycleStartDay: number;
  customCategories: Category[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, familyName: string) => Promise<void>;
  registerAndJoin: (email: string, password: string, inviteCode: string) => Promise<void>;
  createFamilyForCurrentUser: (name: string) => Promise<void>;
  joinFamilyForCurrentUser: (inviteCode: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateFamilySettings: (settings: { billingCycleStartDay?: number; customCategories?: Category[] }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [billingCycleStartDay, setBillingCycleStartDay] = useState<number>(25);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // Prevents onAuthStateChanged from overwriting familyId set during registration
  const skipNextLoad = useRef(false);

  const loadFamilyData = async (uid: string) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) return;
      const fid = userSnap.data().familyId as string;
      setFamilyId(fid);
      const familySnap = await getDoc(doc(db, 'families', fid));
      if (familySnap.exists()) {
        const d = familySnap.data();
        setFamilyName(d.name ?? null);
        setBillingCycleStartDay(d.billingCycleStartDay ?? 25);
        setCustomCategories(d.customCategories ?? []);
      }
    } catch (e) {
      console.warn('loadFamilyData error:', e);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && !skipNextLoad.current) {
        await loadFamilyData(u.uid);
      }
      skipNextLoad.current = false;
      setLoading(false);
    });
  }, []);

  // ─── Email/Password sign in ──────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle loading family data
  };

  // ─── Register + create new family ────────────────────────────────────────────

  const register = async (email: string, password: string, name: string) => {
    skipNextLoad.current = true; // We'll set familyId ourselves below
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fid = cred.user.uid;
    await setDoc(doc(db, 'families', fid), { name, members: [fid] });
    await setDoc(doc(db, 'users', fid), { familyId: fid, email });
    setUser(cred.user);
    setFamilyId(fid);
    setFamilyName(name);
    setBillingCycleStartDay(25);
    setCustomCategories([]);
    setLoading(false);
  };

  // ─── Register + join existing family ─────────────────────────────────────────

  const registerAndJoin = async (email: string, password: string, inviteCode: string) => {
    skipNextLoad.current = true;
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    try {
      const familySnap = await getDoc(doc(db, 'families', inviteCode));
      if (!familySnap.exists()) throw new Error('Invalid invite code. Ask your family admin.');
      
      await updateDoc(doc(db, 'families', inviteCode), { members: arrayUnion(cred.user.uid) });
      await setDoc(doc(db, 'users', cred.user.uid), { familyId: inviteCode, email });
      
      setUser(cred.user);
      setFamilyId(inviteCode);
      setFamilyName(familySnap.data().name ?? null);
      setBillingCycleStartDay(familySnap.data().billingCycleStartDay ?? 25);
      setCustomCategories(familySnap.data().customCategories ?? []);
    } catch (e) {
      setUser(cred.user);
      setFamilyId(null);
      setFamilyName(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // ─── For Google-signed-in users who still need a family ──────────────────────

  const createFamilyForCurrentUser = async (name: string) => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    const uid = auth.currentUser.uid;
    await setDoc(doc(db, 'families', uid), { name, members: [uid] });
    await setDoc(doc(db, 'users', uid), { familyId: uid, email: auth.currentUser.email }, { merge: true });
    setFamilyId(uid);
    setFamilyName(name);
    setBillingCycleStartDay(25);
    setCustomCategories([]);
  };

  const joinFamilyForCurrentUser = async (inviteCode: string) => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    const familySnap = await getDoc(doc(db, 'families', inviteCode));
    if (!familySnap.exists()) throw new Error('Invalid invite code. Ask your family admin.');
    const uid = auth.currentUser.uid;
    await updateDoc(doc(db, 'families', inviteCode), { members: arrayUnion(uid) });
    await setDoc(doc(db, 'users', uid), { familyId: inviteCode, email: auth.currentUser.email }, { merge: true });
    setFamilyId(inviteCode);
    setFamilyName(familySnap.data().name ?? null);
    setBillingCycleStartDay(familySnap.data().billingCycleStartDay ?? 25);
    setCustomCategories(familySnap.data().customCategories ?? []);
  };

  // ─── Google Sign-In ───────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Check if this Google user already has a family set up
    const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
    if (userSnap.exists()) {
      await loadFamilyData(cred.user.uid);
    }
    // If no family yet → familyId stays null → LoginScreen shows family setup UI
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────

  const logout = async () => {
    await signOut(auth);
    setFamilyId(null);
    setFamilyName(null);
    setBillingCycleStartDay(25);
    setCustomCategories([]);
  };

  const updateFamilySettings = async (settings: { billingCycleStartDay?: number; customCategories?: Category[] }) => {
    if (!familyId) return;
    await updateDoc(doc(db, 'families', familyId), settings as any);
    if (settings.billingCycleStartDay !== undefined) {
      setBillingCycleStartDay(settings.billingCycleStartDay);
    }
    if (settings.customCategories !== undefined) {
      setCustomCategories(settings.customCategories);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, familyId, familyName, billingCycleStartDay, customCategories, loading,
      login, register, registerAndJoin,
      createFamilyForCurrentUser, joinFamilyForCurrentUser,
      signInWithGoogle, logout, updateFamilySettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
