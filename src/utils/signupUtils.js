import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';

// Check if signup is complete
export const checkSignupComplete = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.signupCompleted === true;
  } catch (error) {
    console.error('Error checking signup completion:', error);
    return false;
  }
};

// Clean up incomplete signup
export const cleanupIncompleteSignup = async (userId) => {
  try {
    // Delete user document
    await deleteDoc(doc(db, 'users', userId));
    
    // Delete auth user if they're still signed in
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === userId) {
      await deleteUser(currentUser);
    }
    
    // Clear any stored signup data
    localStorage.removeItem('signupData');
    localStorage.removeItem('verificationCode');
  } catch (error) {
    console.error('Error cleaning up incomplete signup:', error);
  }
};

// Update signup progress
export const updateSignupProgress = async (userId, step) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      signupStep: step,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating signup progress:', error);
  }
};

// Mark signup as complete
export const completeSignup = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      signupStep: 'completed',
      signupCompleted: true,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing signup:', error);
  }
}; 