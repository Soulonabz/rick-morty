import logo from './assets/logo.png';

export default function LoadingScreen() {
    return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 p-4">
        <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center space-y-6">
                {/* Animated Logo */}
                <div className="relative">
                    <img 
                        src={logo} 
                        alt="TuneMusic Logo" 
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-red-800/50 animate-pulse" 
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-800 to-red-600 animate-spin-slow opacity-20"></div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Loading</h2>
                    <p className="text-sm text-zinc-400">Please wait while we set up your experience</p>
                </div>

                {/* Loading Bar */}
                <div className="w-full max-w-xs">
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-800 rounded-full w-1/3 animate-loading-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}