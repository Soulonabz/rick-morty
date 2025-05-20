import React from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import logo from './assets/logo.png';

export default function Profile() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center bg-zinc-950 px-6 py-4 rounded-2xl">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full" />
          <span className="text-xl font-semibold">Tunemusic</span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="cursor-pointer hover:underline">Support</span>
          <div className="cursor-pointer flex items-center space-x-1 hover:underline">
            <span>Profile</span>
            <ChevronDown size={14} />
            {/* TODO: Add dropdown with Logout */}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-zinc-800 px-4 py-2 rounded w-full md:w-1/2 mx-auto">
        <Search size={16} className="mr-2" />
        <input
          type="text"
          placeholder="Search settings or articles"
          className="bg-transparent outline-none w-full text-sm"
        />
      </div>

      {/* Membership Notice */}
      <div className="bg-zinc-800 rounded-xl px-4 py-2 w-fit text-sm mx-auto">
        You are officially a DEMO member
      </div>

      {/* Sections */}
      <Section title="Account" options={['Edit profile', 'Recover Playlist']} />
      <Section
        title="Security and Privacy"
        options={[
          'Notification settings',
          'Account privacy',
          'Edit login methods',
          'Set web password',
          'Sign out everywhere',
        ]}
      />
      <Section title="Help" options={['Tunemusic Support']} />
    </div>
  );
}

function Section({ title, options }) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Title and Options in Same Box */}
      <div className="bg-zinc-800 rounded px-4 py-2">
        {/* Title */}
        <div className="text-sm font-semibold mb-2">{title}</div>

        {/* Options */}
        <div className="space-y-1">
          {options.map((label) => (
            <OptionRow key={label} label={label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionRow({ label }) {
  return (
    <div className="flex justify-between items-center px-4 py-2 text-sm cursor-pointer hover:bg-zinc-700 hover:rounded-xl transition-all">
      <span>{label}</span>
      <ChevronRight size={16} />
    </div>
  );
}
