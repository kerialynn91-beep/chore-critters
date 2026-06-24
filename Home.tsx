import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Star } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col justify-start pt-4 sm:pt-10 lg:pt-16 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl mx-auto px-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -8 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/kids')}
          className="group relative h-52 sm:h-72 md:h-80 bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-md border-b-8 border-yellow-300 transition-all flex flex-col items-center justify-center text-center gap-4 sm:gap-6"
        >
          <div className="bg-yellow-400 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] group-hover:bg-yellow-500 transition-colors shadow-lg border-2 sm:border-4 border-yellow-100">
             <Star className="w-8 h-8 sm:w-16 sm:h-16 text-slate-800 fill-slate-800" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 uppercase tracking-tight">Kids Mode</h2>
            <p className="text-slate-500 font-bold mt-1 sm:mt-2 uppercase tracking-widest text-[10px] sm:text-xs">Family Chore Chart</p>
          </div>
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400 animate-ping"></div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -8 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/parents')}
          className="group relative h-52 sm:h-72 md:h-80 bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-md border-b-8 border-green-200 transition-all flex flex-col items-center justify-center text-center gap-4 sm:gap-6"
        >
          <div className="bg-green-600 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] group-hover:bg-green-700 transition-colors shadow-lg border-2 sm:border-4 border-green-100">
            <ShieldCheck className="w-8 h-8 sm:w-16 sm:h-16 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 uppercase tracking-tight">Parent Mode</h2>
            <p className="text-slate-500 font-bold mt-1 sm:mt-2 uppercase tracking-widest text-[10px] sm:text-xs">Manage & Setup</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
