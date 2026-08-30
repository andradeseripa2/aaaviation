import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile as updateFirebaseUserProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { User } from '../types';
import { AUTHOR_ALEXANDRE } from '../data/seedData';
import {
  safeGetJSON,
  safeSetJSON,
  safeRemoveItem
} from '../lib/safeStorage';
import { compressAvatar } from '../lib/imageUtils';

interface AuthContextType {
  user: User | null;
  usersList: User[];
  isAdmin: boolean;
  loadingAuth: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  signup: (name: string, email: string, pass: string, title?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  deleteUserByAdmin: (userId: string) => Promise<void>;
  toggleUserRole: (userId: string) => Promise<void>;
  grantBadgeToUser: (userId: string, badgeId: string) => Promise<{ success: boolean; error?: string }>;
  removeBadgeFromUser: (userId: string, badgeId: string) => Promise<{ success: boolean; error?: string }>;
  toggleEquippedBadge: (badgeId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'andradeseripa2@gmail.com';
const STORAGE_KEY_USER = 'aaa_auth_user_v1';
const STORAGE_KEY_DEMO_MODE = 'aaa_demo_mode_v1';

const isMasterAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any legacy test/demo mode on startup
  useEffect(() => {
    safeRemoveItem(STORAGE_KEY_DEMO_MODE);
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = safeGetJSON<User | null>(STORAGE_KEY_USER, null);
      // Discard legacy mock users from local storage
      if (savedUser && savedUser.id && (savedUser.id.startsWith('usr-') || savedUser.email?.includes('example.com'))) {
        safeRemoveItem(STORAGE_KEY_USER);
        return null;
      }
      return savedUser;
    } catch {
      return null;
    }
  });

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Sync users collection from Firestore in real-time
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'users'),
        snapshot => {
          const list: User[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as User;
            if (data && (data.email || data.name)) {
              list.push({ ...data, id: docSnap.id });
            }
          });
          setUsersList(list);

          // Keep current logged-in user in sync with Firestore document
          if (auth.currentUser) {
            const currentDbUser = list.find(
              u =>
                u.id === auth.currentUser?.uid ||
                (u.email && auth.currentUser?.email && u.email.toLowerCase() === auth.currentUser.email.toLowerCase())
            );
            if (currentDbUser) {
              setUser(prev => {
                if (!prev) return currentDbUser;
                // Guard against stale firestore snapshot overriding fresh local edits
                const prevUpdated = prev.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
                const dbUpdated = currentDbUser.updatedAt ? new Date(currentDbUser.updatedAt).getTime() : 0;
                if (prevUpdated > dbUpdated) {
                  return { ...currentDbUser, ...prev };
                }
                return currentDbUser;
              });
              safeSetJSON(STORAGE_KEY_USER, currentDbUser);
            }
          }
        },
        error => {
          console.warn('Firestore users snapshot listener notice:', error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to listen to users collection:', e);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          const isMaster = isMasterAdminEmail(firebaseUser.email);

          if (userSnap.exists()) {
            const data = userSnap.data() as User;
            // Ensure admin role if it's Alexandre's master email
            if (isMaster && data.role !== 'admin') {
              data.role = 'admin';
              await updateDoc(userRef, { role: 'admin' }).catch(() => {});
            }
            setUser(data);
            safeSetJSON(STORAGE_KEY_USER, data);
          } else {
            // Check if there is an existing user doc in 'users' with matching email
            let existingUserData: User | null = null;
            try {
              if (firebaseUser.email) {
                const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email.toLowerCase()));
                const querySnap = await getDocs(q);
                if (!querySnap.empty) {
                  existingUserData = querySnap.docs[0].data() as User;
                }
              }
            } catch (e) {
              console.warn('Query existing user note:', e);
            }

            if (existingUserData) {
              const mergedUser: User = {
                ...existingUserData,
                id: firebaseUser.uid,
                email: firebaseUser.email || existingUserData.email,
                role: isMaster ? 'admin' : existingUserData.role || 'reader',
                avatar: existingUserData.avatar || firebaseUser.photoURL || AUTHOR_ALEXANDRE.avatar,
                name: existingUserData.name || firebaseUser.displayName || 'Alexandre Andrade',
                title: existingUserData.title || (isMaster ? 'Especialista em Manutenção & Investigador SIPAER' : 'Membro da Comunidade'),
                bio: existingUserData.bio !== undefined ? existingUserData.bio : (isMaster ? AUTHOR_ALEXANDRE.bio : '')
              };
              await setDoc(userRef, mergedUser, { merge: true });
              setUser(mergedUser);
              safeSetJSON(STORAGE_KEY_USER, mergedUser);
            } else {
              // Create user profile in Firestore
              const newUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name:
                  firebaseUser.displayName ||
                  (isMaster ? 'Alexandre Andrade' : firebaseUser.email?.split('@')[0] || 'Leitor'),
                role: isMaster ? 'admin' : 'reader',
                avatar:
                  firebaseUser.photoURL ||
                  (isMaster
                    ? AUTHOR_ALEXANDRE.avatar
                    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        firebaseUser.displayName || firebaseUser.email || 'User'
                      )}&backgroundColor=0A192F,1D4ED8`),
                title: isMaster
                  ? 'Especialista em Manutenção & Investigador SIPAER'
                  : 'Membro da Comunidade',
                bio: isMaster ? AUTHOR_ALEXANDRE.bio : '',
                createdAt: new Date().toISOString()
              };

              await setDoc(userRef, newUser);
              setUser(newUser);
              safeSetJSON(STORAGE_KEY_USER, newUser);
            }
          }
        } catch (err) {
          console.error('Error fetching/creating user in Firestore:', err);
        }
      } else {
        setUser(null);
        safeRemoveItem(STORAGE_KEY_USER);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Save current active user to local storage
  useEffect(() => {
    if (user) {
      safeSetJSON(STORAGE_KEY_USER, user);
    } else {
      safeRemoveItem(STORAGE_KEY_USER);
    }
  }, [user]);

  // Login with Email & Password via Firebase Auth
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const u = userSnap.data() as User;
        setUser(u);
        safeSetJSON(STORAGE_KEY_USER, u);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Firebase login error:', err);
      let message = 'Falha ao autenticar. Verifique seu e-mail e senha.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Senha incorreta.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas sem sucesso. Tente novamente mais tarde ou redefina sua senha.';
      }
      return { success: false, error: message };
    }
  };

  // Login with Google Popup
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; cancelled?: boolean }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const u = userSnap.data() as User;
        setUser(u);
        safeSetJSON(STORAGE_KEY_USER, u);
      } else {
        const isMaster = isMasterAdminEmail(cred.user.email);

        // Check if user exists by email in Firestore
        let existingUserData: User | null = null;
        try {
          if (cred.user.email) {
            const q = query(collection(db, 'users'), where('email', '==', cred.user.email.toLowerCase()));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              existingUserData = querySnap.docs[0].data() as User;
            }
          }
        } catch (e) {
          console.warn('Query existing user note:', e);
        }

        if (existingUserData) {
          const mergedUser: User = {
            ...existingUserData,
            id: cred.user.uid,
            email: cred.user.email || existingUserData.email,
            role: isMaster ? 'admin' : existingUserData.role || 'reader',
            avatar: existingUserData.avatar || cred.user.photoURL || AUTHOR_ALEXANDRE.avatar,
            name: existingUserData.name || cred.user.displayName || 'Alexandre Andrade',
            title: existingUserData.title || (isMaster ? 'Especialista em Manutenção & Investigador SIPAER' : 'Membro da Comunidade'),
            bio: existingUserData.bio !== undefined ? existingUserData.bio : (isMaster ? AUTHOR_ALEXANDRE.bio : '')
          };
          await setDoc(userRef, mergedUser, { merge: true });
          setUser(mergedUser);
          safeSetJSON(STORAGE_KEY_USER, mergedUser);
        } else {
          const newUser: User = {
            id: cred.user.uid,
            email: cred.user.email || '',
            name:
              cred.user.displayName ||
              (isMaster ? 'Alexandre Andrade' : cred.user.email?.split('@')[0] || 'Leitor'),
            role: isMaster ? 'admin' : 'reader',
            avatar:
              cred.user.photoURL ||
              (isMaster
                ? AUTHOR_ALEXANDRE.avatar
                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    cred.user.displayName || 'Google User'
                  )}&backgroundColor=0A192F,1D4ED8`),
            title: isMaster
              ? 'Especialista em Manutenção & Investigador SIPAER'
              : 'Membro da Comunidade',
            bio: isMaster ? AUTHOR_ALEXANDRE.bio : '',
            createdAt: new Date().toISOString()
          };

          await setDoc(userRef, newUser);
          setUser(newUser);
          safeSetJSON(STORAGE_KEY_USER, newUser);
        }
      }
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User deliberately closed the Google popup window or opened another popup;
        // treat as graceful cancellation without an intrusive error state.
        return { success: false, cancelled: true };
      }
      console.error('Google sign-in error:', err);
      let errorMsg = err.message || 'Falha ao autenticar com Google.';
      if (err.code === 'auth/popup-blocked') {
        errorMsg = 'O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para este site.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Falha de conexão com os servidores de autenticação do Google.';
      }
      return { success: false, error: errorMsg };
    }
  };

  // Signup with Email & Password via Firebase Auth
  const signup = async (
    name: string,
    email: string,
    pass: string,
    title?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);

      const isMaster = isMasterAdminEmail(trimmedEmail);

      const newUser: User = {
        id: cred.user.uid,
        email: trimmedEmail,
        name: name.trim(),
        role: isMaster ? 'admin' : 'reader',
        avatar: isMaster
          ? AUTHOR_ALEXANDRE.avatar
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              name.trim()
            )}&backgroundColor=0A192F,1D4ED8`,
        title: isMaster
          ? 'Especialista em Manutenção & Investigador SIPAER'
          : (title?.trim() || 'Leitor / Entusiasta de Aviação'),
        bio: isMaster ? AUTHOR_ALEXANDRE.bio : '',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setUser(newUser);
      return { success: true };
    } catch (err: any) {
      console.error('Firebase signup error:', err);
      let message = 'Falha ao realizar cadastro.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso por outra conta. Faça login ou recupere sua senha.';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha deve ter no mínimo 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      }
      return { success: false, error: message };
    }
  };

  // Logout
  const logout = async () => {
    safeRemoveItem(STORAGE_KEY_DEMO_MODE);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout note:', e);
    }
    setUser(null);
    safeRemoveItem(STORAGE_KEY_USER);
  };

  // Password reset via Email
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      let message = 'Erro ao enviar e-mail de recuperação.';
      if (err.code === 'auth/user-not-found') {
        message = 'Nenhuma conta cadastrada com este endereço de e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'E-mail inválido.';
      }
      return { success: false, error: message };
    }
  };

  // Change Password in Profile (with old password verification)
  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'A nova senha deve possuir pelo menos 6 caracteres.' };
    }

    const currentFirebaseUser = auth.currentUser;

    if (currentFirebaseUser && user.email) {
      try {
        const credential = EmailAuthProvider.credential(user.email, oldPass);
        await reauthenticateWithCredential(currentFirebaseUser, credential);
        await updatePassword(currentFirebaseUser, newPass);
        return { success: true };
      } catch (err: any) {
        console.error('Firebase update password error:', err);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          return { success: false, error: 'A senha atual informada está incorreta.' };
        }
        return { success: false, error: err.message || 'Erro ao alterar a senha.' };
      }
    }

    return { success: false, error: 'Sessão expirada. Faça login novamente.' };
  };

  // Update Profile in Firestore & Firebase Auth
  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Não autenticado' };
    const currentUid = auth.currentUser?.uid || user.id;

    // Compress avatar if it is a large base64 or file data URL
    let processedAvatar = updates.avatar !== undefined ? updates.avatar : user.avatar;
    if (processedAvatar && processedAvatar.startsWith('data:image')) {
      try {
        processedAvatar = await compressAvatar(processedAvatar, 320, 320, 0.85);
      } catch (err) {
        console.warn('Avatar compression error in updateProfile:', err);
      }
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      avatar: processedAvatar,
      id: currentUid,
      updatedAt: new Date().toISOString()
    };

    // Instant local state update
    setUser(updatedUser);
    safeSetJSON(STORAGE_KEY_USER, updatedUser);

    setUsersList(prev => {
      const exists = prev.some(u => u.id === currentUid || u.id === user.id);
      if (exists) {
        return prev.map(u => (u.id === currentUid || u.id === user.id ? updatedUser : u));
      }
      return [...prev, updatedUser];
    });

    // Sync with Firebase Auth user profile
    if (auth.currentUser) {
      try {
        await updateFirebaseUserProfile(auth.currentUser, {
          displayName: updatedUser.name,
          photoURL: updatedUser.avatar
        });
      } catch (authErr) {
        console.warn('Firebase Auth user profile sync note:', authErr);
      }
    }

    // Persist to Firestore with timeout protection
    try {
      const userRef = doc(db, 'users', currentUid);
      const firestorePromise = setDoc(userRef, updatedUser, { merge: true });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 4000)
      );
      await Promise.race([firestorePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Firestore user update write note:', e);
    }

    return { success: true };
  };

  const deleteUserByAdmin = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('User deletion note:', e);
    }
    setUsersList(prev => prev.filter(u => u.id !== userId));
    if (user?.id === userId) {
      setUser(null);
    }
  };

  const toggleUserRole = async (userId: string) => {
    const target = usersList.find(u => u.id === userId);
    if (!target) return;
    const newRole = target.role === 'admin' ? 'reader' : 'admin';

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (e) {
      console.warn('Toggle user role note:', e);
    }

    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (user?.id === userId) {
      setUser(prev => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const grantBadgeToUser = async (userId: string, badgeId: string): Promise<{ success: boolean; error?: string }> => {
    const target = usersList.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Usuário não encontrado' };

    const currentBadges = Array.isArray(target.badges) ? target.badges : [];
    if (currentBadges.includes(badgeId)) {
      return { success: true };
    }

    const newBadges = [...currentBadges, badgeId];
    const currentEquipped = Array.isArray(target.equippedBadges) ? target.equippedBadges : [];
    const newEquipped = currentEquipped.length < 3 ? [...currentEquipped, badgeId] : currentEquipped;

    try {
      await updateDoc(doc(db, 'users', userId), {
        badges: newBadges,
        equippedBadges: newEquipped
      });

      // Also create an in-app notification for the user
      const notifId = `notif-${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId,
        type: 'badge_unlocked',
        title: 'Nova Badge Concedida! 🎖️',
        message: 'Você recebeu uma insígnia honorária de reconhecimento da administração do portal.',
        badgeId,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Grant badge note:', e);
    }

    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, badges: newBadges, equippedBadges: newEquipped } : u))
    );

    if (user?.id === userId) {
      const updatedUser: User = { ...user, badges: newBadges, equippedBadges: newEquipped };
      setUser(updatedUser);
      safeSetJSON(STORAGE_KEY_USER, updatedUser);
    }

    return { success: true };
  };

  const removeBadgeFromUser = async (userId: string, badgeId: string): Promise<{ success: boolean; error?: string }> => {
    const target = usersList.find(u => u.id === userId);
    if (!target) return { success: false, error: 'Usuário não encontrado' };

    const currentBadges = Array.isArray(target.badges) ? target.badges : [];
    const newBadges = currentBadges.filter(b => b !== badgeId);
    const currentEquipped = Array.isArray(target.equippedBadges) ? target.equippedBadges : [];
    const newEquipped = currentEquipped.filter(b => b !== badgeId);

    try {
      await updateDoc(doc(db, 'users', userId), {
        badges: newBadges,
        equippedBadges: newEquipped
      });
    } catch (e) {
      console.warn('Remove badge note:', e);
    }

    setUsersList(prev =>
      prev.map(u => (u.id === userId ? { ...u, badges: newBadges, equippedBadges: newEquipped } : u))
    );

    if (user?.id === userId) {
      const updatedUser: User = { ...user, badges: newBadges, equippedBadges: newEquipped };
      setUser(updatedUser);
      safeSetJSON(STORAGE_KEY_USER, updatedUser);
    }

    return { success: true };
  };

  const toggleEquippedBadge = async (badgeId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const isUserAdmin = user.role === 'admin' || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const currentBadges = Array.isArray(user.badges) ? user.badges : [];
    
    // Non-admins must have unlocked the badge; admins have all badges available
    if (!isUserAdmin && !currentBadges.includes(badgeId)) {
      return { success: false, error: 'Você ainda não desbloqueou esta badge.' };
    }

    const currentEquipped = Array.isArray(user.equippedBadges) ? user.equippedBadges : [];
    let newEquipped: string[];

    if (currentEquipped.includes(badgeId)) {
      newEquipped = currentEquipped.filter(b => b !== badgeId);
    } else {
      if (currentEquipped.length >= 4) {
        return { success: false, error: 'Você pode equipar no máximo 4 badges simultâneas.' };
      }
      newEquipped = [...currentEquipped, badgeId];
    }

    const updatedUser: User = { ...user, equippedBadges: newEquipped };
    setUser(updatedUser);
    safeSetJSON(STORAGE_KEY_USER, updatedUser);

    setUsersList(prev =>
      prev.map(u => (u.id === user.id ? updatedUser : u))
    );

    try {
      await updateDoc(doc(db, 'users', user.id), {
        equippedBadges: newEquipped
      });
    } catch (e) {
      console.warn('Toggle equipped badge note:', e);
    }

    return { success: true };
  };

  const isAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        user,
        usersList,
        isAdmin,
        loadingAuth,
        login,
        loginWithGoogle,
        signup,
        logout,
        resetPassword,
        changePassword,
        updateProfile,
        deleteUserByAdmin,
        toggleUserRole,
        grantBadgeToUser,
        removeBadgeFromUser,
        toggleEquippedBadge
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  usersList: [],
  isAdmin: false,
  loadingAuth: false,
  login: async () => ({ success: false, error: 'Auth not initialized' }),
  loginWithGoogle: async () => ({ success: false, error: 'Auth not initialized' }),
  signup: async () => ({ success: false, error: 'Auth not initialized' }),
  logout: async () => {},
  resetPassword: async () => ({ success: false, error: 'Auth not initialized' }),
  changePassword: async () => ({ success: false, error: 'Auth not initialized' }),
  updateProfile: async () => ({ success: false, error: 'Auth not initialized' }),
  deleteUserByAdmin: async () => {},
  toggleUserRole: async () => {},
  grantBadgeToUser: async () => ({ success: false, error: 'Auth not initialized' }),
  removeBadgeFromUser: async () => ({ success: false, error: 'Auth not initialized' }),
  toggleEquippedBadge: async () => ({ success: false, error: 'Auth not initialized' })
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};
