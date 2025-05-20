import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function SpotifyCallBack() {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.hash).get('access_token');
    const error = new URLSearchParams(window.location.hash).get('error');
    
    // If user is authenticated, redirect to login (as per your requirement)
    const auth = getAuth();
    const user = auth.currentUser; // Get the current authenticated user
    
    if (user) {
      // If user is authenticated, redirect to login
      navigate('/login');
    } else if (error) {
      console.error('Spotify authorization error:', error);
      navigate('/login'); // Navigate to login if there's an error
    } else if (accessToken) {
      // If access token is available, store it and then redirect to login
      storeAccessTokenInFirestore(accessToken);
    } else {
      console.error('No access token found in URL.');
      navigate('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const storeAccessTokenInFirestore = async (accessToken) => {
    const auth = getAuth();
    const user = auth.currentUser; // Get the authenticated user

    if (!user) {
      // If no user is authenticated, navigate to login page
      navigate('/login');
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid); // Reference to the user's document

    // Store the access token in Firestore under the user's document
    await setDoc(userRef, {
      spotifyAccessToken: accessToken,
    }, { merge: true }); // Merge ensures we don't overwrite other user data

    // Optionally, store the access token in localStorage as well
    localStorage.setItem('spotifyAccessToken', accessToken);

    // After storing the token, redirect the user to login page
    navigate('/login');
  };

  return (
    <div className="text-white flex justify-center items-center h-screen bg-black">
      Logging in with Spotify...
    </div>
  );
}
