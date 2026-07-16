import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  firestoreError: string | null;
  setFirestoreError: (err: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch additional profile data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            setProfile({
              fullName: currentUser.displayName || '',
              email: currentUser.email || '',
              phone: ''
            });
          }
          setFirestoreError(null);
        } catch (error: any) {
          console.warn("Error fetching user profile from Firestore:", error);
          if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Permission')) {
            setFirestoreError('permission-denied');
          }
          setProfile({
            fullName: currentUser.displayName || '',
            email: currentUser.email || '',
            phone: ''
          });
        }
      } else {
        setProfile(null);
        setFirestoreError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setFirestoreError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    setFirestoreError(null);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const currentUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(currentUser, { displayName: fullName });

    // Store custom attributes in Firestore
    const userProfile: UserProfile = {
      fullName,
      email,
      phone
    };
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...userProfile,
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.warn("Firestore write permission denied during signup:", error);
      if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Permission')) {
        setFirestoreError('permission-denied');
      }
    }

    setProfile(userProfile);
  };

  const signOut = async () => {
    setFirestoreError(null);
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, firestoreError, setFirestoreError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
