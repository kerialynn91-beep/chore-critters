import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ShieldCheck, Star } from 'lucide-react';

// Views
import KidsDashboard from '.KidsDashboard';
import ParentDashboard from '.ParentDashboard';
import Home from './Home';
import FamilyChoreChart from './FamilyChoreChart';

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-zinc-900 font-sans selection:bg-yellow-200 overflow-hidden">
        <header className="mx-4 sm:mx-6 md:mx-auto max-w-7xl mt-4 px-6 py-4 flex justify-between items-center bg-white rounded-[2rem] shadow-sm border-b-4 border-yellow-400 z-50 shrink-0">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="bg-yellow-400 p-3 rounded-2xl group-hover:rotate-12 transition-transform shadow-sm shadow-yellow-100">
              <Star className="w-6 h-6 text-slate-800 fill-slate-800" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 uppercase">Chore Critters</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link to="/parents" className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] sm:text-xs font-black bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border-b-2 border-slate-200">
                <ShieldCheck className="w-4 h-4" />
                Parents
             </Link>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/kids/:kidId" element={<KidsDashboard />} />
              <Route path="/kids" element={<FamilyChoreChart />} />
              <Route path="/parents/*" element={<ParentDashboard />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}
