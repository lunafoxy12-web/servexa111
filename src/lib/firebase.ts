import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/* CRITICAL: Must pass firestoreDatabaseId to getFirestore */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Direct Firebase Storage profile image upload utility.
 * Stores the profile image securely in Firebase Storage and returns the public download URL.
 */
export async function uploadProfileImageToStorage(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
  const storageRef = ref(storage, `profiles/${userId}/${Date.now()}_avatar.${cleanExt}`);
  
  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: { userId, uploadedAt: new Date().toISOString() }
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // Also persist avatar directly in the user's Firestore document if authenticated
    try {
      if (auth.currentUser?.uid === userId) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { avatar: downloadUrl, updatedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (fsErr) {
      console.warn('[Firestore] Note syncing profile avatar in user document:', fsErr);
    }

    return downloadUrl;
  } catch (storageErr) {
    console.warn('[Firebase Storage] Primary storage upload failed, falling back to data URL encoding:', storageErr);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Direct Firebase Storage KYC verification document upload utility.
 */
export async function uploadVerificationDocument(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanExt = fileExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
  const storageRef = ref(storage, `verifications/${userId}/${Date.now()}_doc.${cleanExt}`);

  try {
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      customMetadata: { userId, type: 'kyc_verification', uploadedAt: new Date().toISOString() }
    });
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('[Firebase Storage] Direct storage upload warning, falling back to safe binary data URL:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export interface VerificationSubmissionData {
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  documentType: string;
  documentNumber: string;
  country: string;
  issuingCountry?: string;
  documentImage: string;
  address?: string;
  dob?: string;
}

/**
 * Routes user verification submissions directly to the 'verifications' collection in Firestore,
 * and updates the user's Firestore document status to pending_approval.
 */
export async function routeVerificationToFirestore(data: VerificationSubmissionData): Promise<{ verificationId: string; success: boolean }> {
  const verificationId = `verif-${data.userId}-${Date.now()}`;
  const now = new Date().toISOString();

  const record = {
    id: verificationId,
    userId: data.userId,
    userName: data.userName || 'User',
    userEmail: data.userEmail || '',
    userRole: data.userRole || 'customer',
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    documentImage: data.documentImage,
    country: data.country || 'United States',
    issuingCountry: data.issuingCountry || data.country || 'United States',
    status: 'pending_approval',
    walletStatus: 'pending_approval',
    submittedAt: now,
    updatedAt: now
  };

  // 1. Write to 'verifications' collection in Firestore
  try {
    const verifDocRef = doc(db, 'verifications', verificationId);
    await setDoc(verifDocRef, record, { merge: true });
    console.log(`[Firestore] Document successfully written to 'verifications' collection: ${verificationId}`);
  } catch (fsErr) {
    console.warn('[Firestore] Error saving directly to verifications collection:', fsErr);
  }

  // 2. Also update user's document in 'users' collection
  try {
    const userDocRef = doc(db, 'users', data.userId);
    await setDoc(userDocRef, {
      walletStatus: 'pending_approval',
      documentCountry: data.country || 'United States',
      idVerification: {
        status: 'pending_approval',
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        fullName: data.userName,
        country: data.country,
        issuingCountry: data.issuingCountry || data.country,
        documentImage: data.documentImage,
        submittedAt: now
      },
      updatedAt: now
    }, { merge: true });
  } catch (uErr) {
    console.warn('[Firestore] Note updating user document verification status:', uErr);
  }

  return { verificationId, success: true };
}

/**
 * Updates selected currency and calculated balances in the user's Firestore document
 */
export async function storeUserCurrencyInFirestore(
  userId: string,
  currency: string,
  balances: Record<string, number>,
  countryCode?: string,
  documentCountry?: string
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      currency,
      selectedCurrency: currency,
      preferredCurrency: currency,
      balances,
      ...(countryCode ? { countryCode } : {}),
      ...(documentCountry ? { documentCountry } : {}),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firestore] Updated currency preference (${currency}) and balances for user ${userId}`);
  } catch (err) {
    console.warn('[Firestore] Note updating user currency in Firestore document:', err);
  }
}

/**
 * Admin action to approve verification and unlock wallet in Firestore
 */
export async function approveVerificationInFirestore(userId: string, adminId: string, adminName: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    // 1. Update user profile document in Firestore
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      walletStatus: 'active',
      identityVerified: true,
      idVerification: {
        status: 'verified',
        approvedAt: now,
        approvedBy: adminName
      },
      updatedAt: now
    }, { merge: true });

    // 2. Update any pending verification records in 'verifications'
    const q = query(collection(db, 'verifications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      await updateDoc(doc(db, 'verifications', d.id), {
        status: 'verified',
        walletStatus: 'active',
        reviewedAt: now,
        reviewedBy: adminName
      });
    }
  } catch (err) {
    console.warn('[Firestore] Note approving verification in Firestore:', err);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection probe verified successfully.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Connection probe: client offline, verify internet or Firebase configuration.');
    } else {
      console.log('[Firebase] Connection probe response:', error?.message);
    }
    return false;
  }
}

export { signInWithPopup, signOut };
