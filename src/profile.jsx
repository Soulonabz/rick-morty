import React, { useState } from 'react';
import { ChevronRight, LogOut, ArrowLeft } from 'lucide-react';
import logo from './assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-800 to-zinc-950 p-4">
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
            <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium border 
              border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 
              transition-all duration-200 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Membership Notice */}
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Membership Status</h2>
                <p className="text-zinc-400 text-sm mt-1">You are officially a DEMO member</p>
              </div>
              <div className="px-4 py-2 bg-red-800/20 border border-red-800/30 rounded-xl">
                <span className="text-sm font-medium text-red-500">DEMO</span>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white">Account</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              <OptionButton label="Edit profile" />
              <OptionButton label="Edit account settings" />
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white">Help</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              <OptionButton label="Tunemusic Support" />
            </div>
          </div>

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
    </div>
  );
}

function OptionButton({ label }) {
  return (
    <button className="flex items-center justify-between w-full p-6 text-zinc-300 
      hover:text-white hover:bg-zinc-800/50 transition-all duration-200">
      <span className="text-sm font-medium">{label}</span>
      <ChevronRight size={18} className="text-zinc-600" />
    </button>
  );
}
