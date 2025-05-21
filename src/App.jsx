import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Loadingscreen from './loadingscreen';
import Login from './login';
import Signup from './signup';
import SignupStep1 from './signupstep1';
import SignupStep2 from './signupstep2';
import SignupStep3 from './signupstep3';
import SignupCapcha from './signupcapcha';
import SignupEmailVerif from './signupemailverif';
import Home from './home';
import Profile from './profile';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase auth
import SpotifyCallBack from './spotifycallback';
import TestingGrounds from './testinggrounds';


function App() {
  // User state
  const [user, setUser] = useState(null); // To store user state
  const [loading, setLoading] = useState(true); // To handle loading screen

  // Firebase auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set the user when auth state changes
      setLoading(false); // Stop the loading screen once we know the user state
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loadingscreen />; // Show loading screen while checking user auth state
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} /> {/* Redirect based on user */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signupstep1" element={<SignupStep1 />} />
        <Route path="/signupstep2" element={<SignupStep2 />} />
        <Route path="/signupstep3" element={<SignupStep3 />} />
        <Route path="/signupcapcha" element={<SignupCapcha />} />
        <Route path="/signupemailverif" element={<SignupEmailVerif />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/callback" element={<SpotifyCallBack />} />
        <Route path="/testinggrounds" element={<TestingGrounds />} />
      </Routes>
    </Router>
  );
}

export default App;