import logo from '../assets/logo2.png';

export default function LoadingScreen() {
    return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 flex-col">
        <img src={logo} alt='TuneMusic Logo' className='w-70 h-70 mx-auto rounded-full object-cover'/>
        <div className="flex space-x-2 mt-4">
        <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
        </div>
    </div>
    );
}