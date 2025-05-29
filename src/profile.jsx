import React, { useState, useEffect } from 'react';
import { ChevronRight, LogOut, ArrowLeft, Eye, EyeOff, X, Check, Star, Bug, MessageCircle } from 'lucide-react';
import logo from './assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import emailjs from 'emailjs-com';
import { 
  signOut, 
  updateEmail, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updateProfile,
  sendEmailVerification,
  verifyBeforeUpdateEmail 
} from 'firebase/auth';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';

export default function Profile() {
  const navigate = useNavigate();
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [userData, setUserData] = useState(null);
  const [settingsView, setSettingsView] = useState('main'); // 'main', 'email', 'password', 'name', 'emailVerification'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [timer, setTimer] = useState(120);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });
  const [rating, setRating] = useState(0);
  const [bugReport, setBugReport] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportView, setSupportView] = useState('main'); // 'main', 'rate', 'bug'

  // Update clearAllFields function to include newName
  const clearAllFields = () => {
    setCurrentPassword('');
    setNewEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setExpectedCode('');
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setNewName('');
    setError('');
  };

  // Modify the useEffect to use clearAllFields
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserData({
            ...docSnap.data(),
            email: user.email,
          });
          setNewName(docSnap.data().name || '');
          clearAllFields();
        }
      }
    };

    fetchUserData();
  }, []);

  // Add useEffect to clear fields when settingsView changes
  useEffect(() => {
    if (settingsView === 'main') {
      clearAllFields();
    }
  }, [settingsView]);

  useEffect(() => {
    let countdown;
    if (settingsView === 'emailVerification' && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 0) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [settingsView, timer]);

  // Add effect to update dark mode when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem('darkMode');
      setDarkMode(savedMode !== null ? JSON.parse(savedMode) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Function to generate a random 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  // Function to handle email change
  const handleEmailChange = async () => {
    setError('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Validate new email
      if (!newEmail) {
        setError('Please enter a new email address');
        setLoading(false);
        return;
      }

      // Validate current password
      if (!currentPassword) {
        setError('Please enter your current password');
        setLoading(false);
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Generate verification code
      const code = generateVerificationCode();
      setExpectedCode(code.toString());

      // Send verification email using EmailJS
      const emailParams = {
        to_name: userData?.name || 'User',
        to_email: newEmail,
        verification_code: code,
      };

      await emailjs.send(
        'service_y0bjcph',
        'template_cj7glvb',
        emailParams,
        'b1fcUAopSPAyhPrEH'
      );

      // Switch to verification view
      setSettingsView('emailVerification');
      setTimer(120);
      setLoading(false);
    } catch (error) {
      console.error('Error updating email:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before changing your email.');
      } else if (error.code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    }
  };

  // Function to handle verification code submission
  const handleVerifyCode = async () => {
    setError('');
    setLoading(true);
    try {
      if (verificationCode === expectedCode) {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        // Re-authenticate before updating email
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Send verification email to new address and wait for verification
        await verifyBeforeUpdateEmail(user, newEmail);

        // Update email in Firestore after verification
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          email: newEmail
        });

        // Show success state
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSettingsView('main');
          setShowAccountSettings(false);
          // Reset all fields
          setCurrentPassword('');
          setNewEmail('');
          setVerificationCode('');
          setExpectedCode('');
        }, 2000);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before changing your email.');
      } else if (error.code === 'auth/invalid-email') {
        setError('The email address is not valid.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use by another account.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle resend verification code
  const handleResendCode = async () => {
    if (timer > 0 || loading) return;
    
    setLoading(true);
    try {
      const code = generateVerificationCode();
      setExpectedCode(code.toString());
      setTimer(120);

      const emailParams = {
        to_name: userData?.name || 'User',
        to_email: newEmail,
        verification_code: code,
      };

      await emailjs.send(
        'service_y0bjcph',
        'template_cj7glvb',
        emailParams,
        'b1fcUAopSPAyhPrEH'
      );
    } catch (error) {
      console.error('Error resending code:', error);
      setError('Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Add password validation checks
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumberOrSpecial = /[\d\W]/.test(newPassword);
  const hasTenChars = newPassword.length >= 10;
  const allValid = hasLetter && hasNumberOrSpecial && hasTenChars;

  // Function to handle password change
  const handlePasswordChange = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (!allValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Reauthenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Update password in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        password: newPassword,
        lastPasswordUpdate: new Date().toISOString()
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form and show success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSettingsView('main');
        setShowAccountSettings(false);
      }, 2000);
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before changing your password.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Modify handleNameChange to clear fields after success
  const handleNameChange = async () => {
    setError('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update name in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: newName
      });

      // Update profile in Firebase Auth
      await updateProfile(user, {
        displayName: newName
      });

      // Show success message and clear fields
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSettingsView('main');
        setShowAccountSettings(false);
        clearAllFields();
      }, 2000);

    } catch (error) {
      console.error('Error updating name:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle rating submission
  const handleRatingSubmit = async () => {
    if (rating === 0) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Add rating to Firestore
      await addDoc(collection(db, 'feedback'), {
        type: 'rating',
        rating: rating,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString()
      });

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setRating(0);
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    }
  };

  // Function to handle bug report submission
  const handleBugReportSubmit = async () => {
    if (!bugReport.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Add bug report to Firestore
      await addDoc(collection(db, 'feedback'), {
        type: 'bug',
        report: bugReport,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString()
      });

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setBugReport('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      setError('Failed to submit bug report. Please try again.');
    }
  };

  // Account Settings Modal Content
  const renderSettingsContent = () => {
    switch (settingsView) {
      case 'email':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Change Email</h3>
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-white text-center">Email successfully changed!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">New Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                      placeholder="Enter new email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white pr-12"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEmailChange}
                  disabled={loading || !newEmail || !currentPassword}
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
                    ${newEmail && currentPassword && !loading
                      ? 'bg-red-800 hover:bg-red-700 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Continue'
                  )}
                </button>
              </>
            )}
          </div>
        );

      case 'emailVerification':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Verify Email</h3>
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-white text-center">Email successfully changed!</p>
              </div>
            ) : (
              <>
                <p className="text-zinc-400 text-sm">
                  We've sent a verification code to {newEmail}. Please enter it below to complete your email change.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                      placeholder="Enter 6-digit code"
                      disabled={loading}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-zinc-400">
                      {timer > 0 ? (
                        <>
                          Resend code in{' '}
                          <span className="text-white font-medium">
                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                          </span>
                        </>
                      ) : (
                        "Didn't receive the code?"
                      )}
                    </div>
                    <button
                      onClick={handleResendCode}
                      disabled={timer > 0 || loading}
                      className={`text-sm transition-colors duration-200
                        ${timer > 0 || loading
                          ? 'text-zinc-600 cursor-not-allowed'
                          : 'text-red-800 hover:text-red-700 hover:underline'
                        }`}
                    >
                      {loading ? 'Sending...' : 'Resend verification code'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
                    ${verificationCode.length === 6 && !loading
                      ? 'bg-red-800 hover:bg-red-700 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </>
            )}
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Change Password</h3>
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-white text-center">Password successfully changed!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white pr-12"
                        placeholder="Enter current password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white pr-12"
                        placeholder="Enter new password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white pr-12"
                        placeholder="Confirm new password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="space-y-3 bg-zinc-800/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-zinc-300">Password requirements:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {hasLetter ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={hasLetter ? "text-zinc-300" : "text-zinc-500"}>
                          At least 1 letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasNumberOrSpecial ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={hasNumberOrSpecial ? "text-zinc-300" : "text-zinc-500"}>
                          1 number or special character
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {hasTenChars ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                        <span className={hasTenChars ? "text-zinc-300" : "text-zinc-500"}>
                          Minimum 10 characters
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword || !allValid}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
                      ${currentPassword && newPassword && confirmPassword && allValid && !loading
                        ? 'bg-red-800 hover:bg-red-700 text-white'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'name':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Change Name</h3>
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-white text-center">Name successfully changed!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">New Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white"
                      placeholder="Enter new name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white pr-12"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNameChange}
                  disabled={loading || !newName || !currentPassword}
                  className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
                    ${newName && currentPassword && !loading
                      ? 'bg-red-800 hover:bg-red-700 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Name'
                  )}
                </button>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Account Settings</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSettingsView('email')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 text-white hover:bg-zinc-700/50 transition-colors"
              >
                <span>Change Email</span>
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setSettingsView('password')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 text-white hover:bg-zinc-700/50 transition-colors"
              >
                <span>Change Password</span>
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setSettingsView('name')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 text-white hover:bg-zinc-700/50 transition-colors"
              >
                <span>Change Name</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-zinc-800 to-zinc-950' : 'bg-gradient-to-br from-gray-100 to-white'} p-4`}>
      {/* Main Container */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-red-800/50" 
            />
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile Settings</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium border 
              ${darkMode 
                ? 'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600' 
                : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'} 
              transition-all duration-200 group`}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Membership Notice */}
          <div className={`${darkMode ? 'bg-zinc-900/50' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Membership Status</h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>You are officially a DEMO member</p>
              </div>
              <div className="px-4 py-2 bg-red-800/20 border border-red-800/30 rounded-xl">
                <span className="text-sm font-medium text-red-500">DEMO</span>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className={`${darkMode ? 'bg-zinc-900/50' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden`}>
            <div className={`p-6 border-b ${darkMode ? 'border-zinc-800' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account</h2>
            </div>
            <div className={`divide-y ${darkMode ? 'divide-zinc-800' : 'divide-gray-200'}`}>
              <button
                onClick={() => {
                  setShowAccountSettings(true);
                  setSettingsView('main');
                }}
                className={`flex items-center justify-between w-full p-6 
                  ${darkMode 
                    ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'} 
                  transition-all duration-200`}
              >
                <span className="text-sm font-medium">Edit account settings</span>
                <ChevronRight size={18} className={darkMode ? 'text-zinc-600' : 'text-gray-400'} />
              </button>
            </div>
          </div>

          {/* Add Support button */}
          <button
            onClick={() => setShowSupport(true)}
            className={`w-full flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-zinc-900/50 hover:bg-zinc-800/50' : 'bg-white hover:bg-gray-100'} backdrop-blur-xl shadow-xl transition-colors`}
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={20} className={darkMode ? 'text-zinc-400' : 'text-gray-500'} />
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>TuneMusic Support</span>
            </div>
            <ChevronRight size={20} className={darkMode ? 'text-zinc-400' : 'text-gray-500'} />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl font-medium bg-red-800 hover:bg-red-700 
              text-white transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowAccountSettings(false);
            setSettingsView('main');
            clearAllFields();
          }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <div className={`${darkMode ? 'bg-zinc-900/90' : 'bg-white/90'} backdrop-blur-xl rounded-2xl shadow-xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                {!showSuccess && settingsView !== 'main' && (
                  <button
                    onClick={() => {
                      if (settingsView !== 'main') {
                        setSettingsView('main');
                        clearAllFields();
                      } else {
                        setShowAccountSettings(false);
                        clearAllFields();
                      }
                    }}
                    className={darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}
                  >
                    {settingsView !== 'main' ? <ArrowLeft size={20} /> : <X size={20} />}
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {renderSettingsContent()}
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!showSuccessMessage) {
                setShowSupport(false);
                setSupportView('main');
                setRating(0);
                setBugReport('');
              }
            }}
          />
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
            {/* Success Message */}
            {showSuccessMessage ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Thank you for your feedback!
                </h3>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {supportView === 'main' ? 'TuneMusic Support' :
                     supportView === 'rate' ? 'Rate TuneMusic' :
                     'Report a Bug'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowSupport(false);
                      setSupportView('main');
                      setRating(0);
                      setBugReport('');
                    }}
                    className={`${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                {supportView === 'main' ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setSupportView('rate')}
                      className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors
                        ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                    >
                      <Star className={darkMode ? 'text-zinc-400' : 'text-gray-500'} />
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>Rate TuneMusic</span>
                    </button>
                    <button
                      onClick={() => setSupportView('bug')}
                      className={`flex items-center gap-3 w-full p-4 rounded-xl transition-colors
                        ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                    >
                      <Bug className={darkMode ? 'text-zinc-400' : 'text-gray-500'} />
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>Report a Bug</span>
                    </button>
                  </div>
                ) : supportView === 'rate' ? (
                  <div className="space-y-6">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="transition-colors"
                        >
                          <Star
                            size={32}
                            className={`${
                              star <= rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : darkMode ? 'text-zinc-600' : 'text-gray-300'
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleRatingSubmit}
                      disabled={rating === 0}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
                        ${rating > 0
                          ? 'bg-red-800 hover:bg-red-700 text-white'
                          : `${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                        }`}
                    >
                      Submit Rating
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <textarea
                      value={bugReport}
                      onChange={(e) => setBugReport(e.target.value)}
                      placeholder="Please describe the issue you're experiencing..."
                      className={`w-full h-32 px-4 py-3 rounded-xl resize-none ${
                        darkMode
                          ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500'
                          : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                      } border focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all duration-200`}
                    />
                    <button
                      onClick={handleBugReportSubmit}
                      disabled={!bugReport.trim()}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
                        ${bugReport.trim()
                          ? 'bg-red-800 hover:bg-red-700 text-white'
                          : `${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                        }`}
                    >
                      Submit Report
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
