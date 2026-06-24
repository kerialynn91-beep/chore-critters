import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Kid, Chore, TaskInstance, Reward, Fulfillment } from '../types';
import { useWorkspace } from './WorkspaceContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Volume2, CheckCircle, XCircle, Gift, Users } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, eachDayOfInterval, endOfWeek, isBefore, startOfDay } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';

const HABITATS = {
  JUNGLE: 'jungle',
  FANTASY: 'fantasy',
  FARM: 'farm',
  OCEAN: 'ocean',
  DOMESTIC: 'domestic',
  GARDEN: 'garden'
} as const;

type HabitatType = typeof HABITATS[keyof typeof HABITATS];

const getHabitatForAvatar = (avatar: string): HabitatType => {
  const categories = {
    [HABITATS.JUNGLE]: ['🐯', '🦁', '🐵', '🦍', '🐘', '🦛', '🦏', '🦒', '🐆', '🦓', '🐅', '🐍', '🦎', '🐊', '🐒'],
    [HABITATS.FANTASY]: ['🦄', '🐉', '🐲', '🦕', '🦖', '🦇', '🐺'],
    [HABITATS.FARM]: ['🐮', '🐷', '🐔', '🐣', '🐤', '🐑', '🐐', '🐄', '🐎', '🐏', '🐃', '🐂'],
    [HABITATS.OCEAN]: ['🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐚', '🐢', '🐧', '🦆'],
    [HABITATS.DOMESTIC]: ['🐶', '🐱', '🐹', '🐕', '🐈', '🦔', '🐿️'],
    [HABITATS.GARDEN]: ['🦋', '🐰', '🐇', '🐝', '🐛', '🐌', '🐞', '🐜', '🐦', '🦅', '🦉', '🦊', '🐻', '🐼', '🐨', '🦘', '🦌', '🐗']
  };

  for (const [habitat, emojis] of Object.entries(categories)) {
    if (emojis.includes(avatar)) return habitat as HabitatType;
  }
  return HABITATS.GARDEN;
};

const HabitatBackground = ({ habitat }: { habitat: HabitatType | 'picker' }) => {
  const getStyles = () => {
    switch (habitat) {
      case 'jungle':
        return {
          gradient: 'from-emerald-900 to-green-950',
          pattern: (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Sun filtering through */}
              <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-yellow-500/10 rounded-full blur-3xl" />
              
              {/* Vector Jungle SVGs */}
              <svg className="absolute inset-x-0 bottom-0 w-full h-[60%] opacity-30 text-emerald-800" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background trees */}
                <path d="M120 600V200C120 200 180 150 250 200C320 250 350 180 420 150C490 120 540 220 600 200C660 180 720 120 800 180C880 240 920 180 1000 160C1080 140 1150 220 1250 220C1350 220 1400 300 1440 320V600H120Z" fill="currentColor" fillOpacity="0.4" />
                
                {/* Foreground larger leaves & trees */}
                <path d="M0 600V100C0 100 40 50 100 100C160 150 200 120 250 80C300 40 350 120 450 100C550 80 600 200 700 180C800 160 850 100 950 140C1050 180 1100 90 1200 110C1300 130 1380 250 1440 280V600H0Z" fill="currentColor" fillOpacity="0.7" />
              </svg>

              {/* Hanging Vines from Top */}
              <svg className="absolute top-0 inset-x-0 w-full h-[40%] opacity-30 text-emerald-850" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left vine with leaves */}
                <path d="M 50,-50 Q 80,100 60,250 T 100,400" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M60 120 C70 120 80 140 60 150 C40 140 50 120 60 120" fill="currentColor" />
                <path d="M70 200 C85 205 90 220 70 230 C50 220 55 205 70 200" fill="currentColor" />
                
                {/* Center vine */}
                <path d="M 720,-50 Q 750,150 700,280 T 730,380" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M 725 150 C 740 150 750 165 725 180 C 700 165 710 150 725 150" fill="currentColor" />
                
                {/* Right vine */}
                <path d="M 1300,-50 Q 1250,120 1280,260 T 1250,420" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M 1260 180 C 1245 180 1235 195 1260 210 C 1285 195 1275 180 1260 180" fill="currentColor" />
              </svg>

              {/* Little floating elements/leaves */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -40, 0], 
                    x: [0, 15, 0], 
                    opacity: [0.1, 0.4, 0.1],
                    rotate: [0, 45, 0]
                  }}
                  transition={{ 
                    duration: 6 + Math.random() * 8, 
                    repeat: Infinity,
                    delay: Math.random() * i
                  }}
                  className="absolute text-emerald-300 text-lg opacity-20 pointer-events-none"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                >
                  🍃
                </motion.div>
              ))}
            </div>
          )
        };
      case 'fantasy':
        return {
          gradient: 'from-sky-400 via-sky-200 to-white',
          pattern: (
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {/* Warm bright soft sun in the sky */}
               <div className="absolute top-[8%] left-[15%] w-36 h-36 rounded-full bg-yellow-100/30 blur-2xl" />

               {/* Layered Realistic Slate & Blue Cartoon Mountains */}
               <svg className="absolute inset-x-0 bottom-0 w-full h-[55%] opacity-40 text-slate-700" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                 {/* Far Back Mountain line - lighter grayish blue */}
                 <path d="M0 600 L150 400 L400 500 L650 320 L950 480 L1200 350 L1440 500 L1440 600 Z" fill="#64748b" fillOpacity="0.4" />
                 
                 {/* Middle Mountain line with distinct peaks - medium slate */}
                 <path d="M0 320 L250 410 L500 520 L800 360 L1100 490 L1350 380 L1440 450 L1440 600 Z" fill="#475569" fillOpacity="0.6" />
                 
                 {/* Foreground Mountain tips - deep rich slate-gray */}
                 <path d="M0 600 L150 480 L350 430 L600 530 L900 420 L1150 510 L1440 410 L1440 600 Z" fill="#334155" fillOpacity="0.8" />
               </svg>

               {/* Fluffy Cartoon Clouds (white and grey) drifting slowly */}
               {[
                 { top: '10%', left: '5%', size: 'scale-[1.2]', duration: 42, delay: 0, color: 'text-white' },
                 { top: '22%', left: '42%', size: 'scale-[1.4]', duration: 52, delay: -12, color: 'text-slate-100' },
                 { top: '15%', left: '72%', size: 'scale-[0.95]', duration: 46, delay: -4, color: 'text-white' },
                 { top: '32%', left: '15%', size: 'scale-[1.3]', duration: 58, delay: -22, color: 'text-slate-200/90' },
                 { top: '28%', left: '78%', size: 'scale-[1.1]', duration: 49, delay: -8, color: 'text-white/95' },
               ].map((cloud, i) => (
                 <motion.div
                   key={i}
                   animate={{ x: ['-30%', '130%'] }}
                   transition={{ duration: cloud.duration, repeat: Infinity, ease: 'linear', delay: cloud.delay }}
                   className={`absolute opacity-90 filter drop-shadow-md ${cloud.color} ${cloud.size}`}
                   style={{ top: cloud.top, left: cloud.left }}
                 >
                   <svg width="200" height="100" viewBox="0 0 200 100" fill="currentColor">
                     <path d="M 30,70 A 25,25 0 0,1 45,30 A 35,35 0 0,1 110,25 A 30,30 0 0,1 155,40 A 25,25 0 0,1 170,70 Z" />
                   </svg>
                 </motion.div>
               ))}
             </div>
          )
        };
      case 'farm':
        return {
          gradient: 'from-amber-50 to-sky-200',
          pattern: (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Sun in the corner */}
              <div className="absolute top-10 right-20 w-36 h-36 rounded-full bg-yellow-300/30 blur-2xl" />
              <div className="absolute top-16 right-26 w-24 h-24 rounded-full bg-yellow-400/20 border-4 border-yellow-200/20" />

              {/* Floating white clouds */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ x: ['-40%', '130%'] }}
                  transition={{ duration: 45 + i * 12, repeat: Infinity, ease: 'linear', delay: i * -15 }}
                  className="absolute opacity-25 text-white scale-75"
                  style={{ top: `${15 + i * 12}%`, left: `${10 + i * 20}%` }}
                >
                  <svg width="180" height="90" viewBox="0 0 200 100" fill="currentColor">
                    <path d="M 30,70 A 25,25 0 0,1 45,30 A 35,35 0 0,1 110,25 A 30,30 0 0,1 155,40 A 25,25 0 0,1 170,70 Z" />
                  </svg>
                </motion.div>
              ))}

              {/* Rolling Green Hills */}
              <svg className="absolute inset-x-0 bottom-0 w-full h-[50%] opacity-30 text-emerald-600" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 600 V350 C300 250, 450 450, 800 300 C1100 200, 1300 350, 1440 320 V600 H0Z" fill="currentColor" fillOpacity="0.4" />
                <path d="M0 600 V400 C400 350, 600 250, 1000 400 C1200 450, 1350 350, 1440 370 V600 H0Z" fill="currentColor" fillOpacity="0.6" />
                <path d="M0 600 V460 C250 400, 550 460, 850 380 C1150 320, 1300 460, 1440 450 V600 H0Z" fill="currentColor" fillOpacity="0.8" />
              </svg>

              {/* Cartoon Barn House in background */}
              <div className="absolute bottom-[15%] left-[10%] w-48 h-40 opacity-20 flex flex-col items-center">
                {/* Roof */}
                <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[40px] border-b-red-700" />
                {/* Barn Body */}
                <div className="w-24 h-24 bg-red-600 relative border-l-4 border-r-4 border-b-4 border-red-700 flex justify-center items-end">
                  {/* Cross wood door lines */}
                  <div className="w-10 h-14 bg-white/10 border-2 border-white/20 relative">
                     <div className="absolute inset-0 border-t-2 border-white/20 rotate-45 transform origin-top-left" style={{ width: '141%' }} />
                     <div className="absolute inset-0 border-t-2 border-white/20 -rotate-45 transform origin-top-right" style={{ width: '141%' }} />
                  </div>
                </div>
              </div>

              {/* Wooden Fence silhouette */}
              <div className="absolute bottom-[8%] right-[15%] opacity-15 flex gap-1">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="relative flex flex-col items-center">
                    <div className="w-3 h-16 bg-amber-850 rounded-t-md" />
                    {idx < 5 && <div className="absolute top-4 left-2 w-12 h-2 bg-amber-850" />}
                    {idx < 5 && <div className="absolute top-10 left-2 w-12 h-2 bg-amber-850" />}
                  </div>
                ))}
              </div>
            </div>
          )
        };
      case 'ocean':
        return {
          gradient: 'from-sky-400 via-cyan-800 to-blue-950',
          pattern: (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Sunbeams under sea */}
              <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-white/10 to-transparent opacity-40" style={{ clipPath: 'polygon(15% 0%, 35% 0%, 55% 100%, 25% 100%)' }} />
              <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-white/10 to-transparent opacity-40" style={{ clipPath: 'polygon(60% 0%, 75% 0%, 90% 100%, 70% 100%)' }} />

              {/* Air Bubbles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: ['110vh', '-10vh'], 
                    x: [0, (i % 2 === 0 ? 15 : -15), 0]
                  }}
                  transition={{ 
                    duration: 10 + Math.random() * 8, 
                    repeat: Infinity, 
                    ease: 'easeInOut',
                    delay: Math.random() * 10
                  }}
                  className="absolute rounded-full border border-white/25 bg-white/5 shadow-inner"
                  style={{ 
                    left: `${Math.random() * 100}%`, 
                    width: `${Math.max(6, Math.random() * 20)}px`,
                    height: `${Math.max(6, Math.random() * 20)}px`
                  }}
                />
              ))}

              {/* Sea bed with plants */}
              <svg className="absolute inset-x-0 bottom-0 w-full h-[40%] opacity-20 text-cyan-900" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Seabed */}
                <path d="M0 400 V300 C300 280, 500 350, 800 290 C1100 250, 1250 320, 1440 300 V400 H0Z" fill="#1e3a8a" fillOpacity="0.8" />
                <path d="M0 400 V340 C400 320, 700 380, 1000 330 C1200 310, 1350 360, 1440 350 V400 H0Z" fill="#0f172a" fillOpacity="0.6" />
                
                {/* Seaweed */}
                <path d="M150 320 Q130 200 160 100 T140 20 Q160 100 170 200 T150 320" fill="currentColor" fillOpacity="0.7" />
                <path d="M190 340 Q210 240 180 150 T200 50 Q180 150 210 240 T190 340" fill="currentColor" fillOpacity="0.5" />
                <path d="M1200 310 Q1220 200 1190 120 T1210 40 Q1190 120 1230 200 T1200 310" fill="currentColor" fillOpacity="0.7" />
                <path d="M1250 330 Q1230 220 1260 140 T1240 60 Q1260 140 1270 220 T1250 330" fill="currentColor" fillOpacity="0.6" />
              </svg>
            </div>
          )
        };
      case 'domestic': {
        // Generate beautiful zigzagging trails of varied paw prints along the left and right margins
        const dogTrail = [
          { top: '86%', left: '3%', r: -15 },
          { top: '76%', left: '10%', r: 25 },
          { top: '66%', left: '4%', r: -10 },
          { top: '56%', left: '11%', r: 35 },
          { top: '46%', left: '3%', r: -20 },
          { top: '36%', left: '10%', r: 30 },
          { top: '26%', left: '2%', r: -5 },
          { top: '14%', left: '8%', r: -35 },
        ];

        const catTrail = [
          { top: '84%', left: '94%', r: 15 },
          { top: '74%', left: '87%', r: -25 },
          { top: '64%', left: '93%', r: 20 },
          { top: '54%', left: '86%', r: -30 },
          { top: '44%', left: '92%', r: 10 },
          { top: '34%', left: '85%', r: -20 },
          { top: '24%', left: '91%', r: 5 },
          { top: '14%', left: '84%', r: -45 },
        ];

        const bunnyTrail = [
          { top: '80%', left: '14%', r: -20 },
          { top: '70%', left: '21%', r: 15 },
          { top: '60%', left: '15%', r: -30 },
          { top: '50%', left: '22%', r: 25 },
          { top: '40%', left: '16%', r: -15 },
          { top: '30%', left: '23%', r: 10 },
          { top: '20%', left: '15%', r: -40 },
          { top: '10%', left: '22%', r: 5 },
        ];

        return {
          gradient: 'from-amber-100 via-rose-50 to-orange-100/95',
          pattern: (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Soft pet wallpaper base pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Dog Paw Prints Trail (Zigzagging, warm rose-copper tint) */}
              {dogTrail.map((p, i) => (
                <motion.div
                  key={`dog-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: [0.25, 0.6, 0.25], 
                    scale: [0.95, 1.05, 0.95],
                    rotate: p.r
                  }}
                  transition={{ duration: 4.5, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute text-rose-450 pointer-events-none text-4xl md:text-5xl"
                  style={{ top: p.top, left: p.left }}
                >
                  🐾
                </motion.div>
              ))}

              {/* Cat Paw Prints Trail (Delicate steps, soft amber gold tint) */}
              {catTrail.map((p, i) => (
                <motion.div
                  key={`cat-${i}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ 
                    opacity: [0.3, 0.65, 0.3], 
                    scale: [0.95, 1.05, 0.95],
                    rotate: p.r
                  }}
                  transition={{ duration: 4.8, repeat: Infinity, delay: i * 0.35 }}
                  className="absolute text-amber-500 pointer-events-none text-3xl md:text-4xl"
                  style={{ top: p.top, left: p.left }}
                >
                  🐾
                </motion.div>
              ))}

              {/* Bunny Hop Footprints (Paired tiny hops, soft terracotta coral tint) */}
              {bunnyTrail.map((p, i) => (
                <motion.div
                  key={`bunny-${i}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: [0.3, 0.7, 0.3], 
                    scale: [0.95, 1.05, 0.95],
                    rotate: p.r
                  }}
                  transition={{ duration: 4.2, repeat: Infinity, delay: i * 0.25 }}
                  className="absolute flex gap-1 items-center text-rose-600 pointer-events-none text-2xl md:text-3xl"
                  style={{ top: p.top, left: p.left }}
                >
                  <span>🐾</span>
                  <span className="mt-[2px]">🐾</span>
                </motion.div>
              ))}
            </div>
          )
        };
      }
      case 'garden':
        return {
          gradient: 'from-amber-150 to-green-300',
          pattern: (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-8 left-12 w-28 h-28 rounded-full bg-yellow-300/40 border border-yellow-200/20 blur-xl animate-pulse" />
              
              {/* Fluttering butterflies/pollen */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -30, 0],
                    x: [0, Math.sin(i) * 35, 0],
                    scale: [1, 1.15, 1],
                    rotate: [0, i % 2 === 0 ? 30 : -30, 0]
                  }}
                  transition={{ duration: 7 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 4 }}
                  className="absolute text-emerald-600/30 text-2xl"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: `${15 + Math.random() * 55}%`,
                  }}
                >
                  {i % 2 === 0 ? '🦋' : '🌸'}
                </motion.div>
              ))}

              {/* Layered Grass & Flowers */}
              <svg className="absolute inset-x-0 bottom-0 w-full h-[50%] opacity-25 text-emerald-800" viewBox="0 0 1440 500" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Grass hills */}
                <path d="M0 500 Q 250 400 500 480 T 1000 450 T 1440 430 V 500 H 0 Z" fill="currentColor" fillOpacity="0.4" />
                <path d="M0 500 Q 300 460 600 440 T 1200 460 T 1440 460 V 500 H 0 Z" fill="currentColor" fillOpacity="0.6" />
                
                {/* Flower stalks */}
                <path d="M220 500 L220 400" stroke="currentColor" strokeWidth="3" />
                <circle cx="220" cy="400" r="10" fill="#facc15" />
                <path d="M250 500 L250 380" stroke="currentColor" strokeWidth="4" />
                <circle cx="250" cy="380" r="12" fill="#f43f5e" />
                <path d="M1100 500 L1100 410" stroke="currentColor" strokeWidth="3" />
                <circle cx="1100" cy="410" r="11" fill="#ec4899" />
                <path d="M1140 500 L1130 390" stroke="currentColor" strokeWidth="3" />
                <circle cx="1130" cy="390" r="9" fill="#06b6d4" />
              </svg>
            </div>
          )
        };
      case 'picker':
        return {
          gradient: 'from-slate-800 via-slate-900 to-slate-950',
          pattern: (
             <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <Sparkles className="w-full h-full text-white/5 blur-sm" />
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 5 + Math.random() * 5, repeat: Infinity }}
                    className="absolute w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  />
                ))}
             </div>
          )
        };
    }
  };

  const { gradient, pattern } = getStyles();

  return (
    <div className={`fixed inset-0 z-0 bg-gradient-to-b ${gradient} transition-all duration-1000 overflow-hidden`}>
      {pattern}
    </div>
  );
};

export default function KidsDashboard() {
  const { getCollectionName, mode, workspaceId, familyName } = useWorkspace();
  const { kidId } = useParams();
  const navigate = useNavigate();
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);

  const validTasks = React.useMemo(() => {
    return tasks.filter(t => chores.some(c => c.id === t.choreId) || t.status === 'completed' || !!t.choreTitle);
  }, [tasks, chores]);

  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [interceptReward, setInterceptReward] = useState<Reward | null>(null);
  const [showCelebration, setShowCelebration] = useState<{ avatar: string; color: string } | null>(null);

  const triggerCelebration = (avatar: string, color: string) => {
    setShowCelebration({ avatar, color });
    
    // Play a delightful, programmatically synthesized 2-3 second happy celebration jingle
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Warm master volume & vintage low-pass filter to remove digital harshness
        const masterVolume = ctx.createGain();
        masterVolume.gain.setValueAtTime(0.12, now);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now); // Warm filter to make it sound incredibly cozy and sweet
        
        masterVolume.connect(filter);
        filter.connect(ctx.destination);

        // Helper to synthesize a gorgeous "Vocal Whistling" voice node with organic LFO vibrato
        const createCuteVocalVoice = (startFreq: number, slides: { t: number, f: number }[], duration: number) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle'; // Safe, friendly woodwind timbre
          osc.frequency.setValueAtTime(startFreq, now);
          
          slides.forEach(slide => {
            // Apply a vocal-like sliding transition (portamento) between musical notes
            osc.frequency.setValueAtTime(osc.frequency.value, now + slide.t - 0.05);
            osc.frequency.exponentialRampToValueAtTime(slide.f, now + slide.t);
          });
          
          // Add a natural 6.2Hz vibrato LFO to simulate the warmth of a real singing or humming human voice
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(6.2, now); 
          lfoGain.gain.setValueAtTime(6, now); 
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          
          // Soft volume envelope curve to design a gentle, pleasing sound
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gainNode.gain.setValueAtTime(0.12, now + duration - 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
          
          osc.connect(gainNode);
          gainNode.connect(masterVolume);
          
          lfo.start(now);
          osc.start(now);
          
          lfo.stop(now + duration + 0.1);
          osc.stop(now + duration + 0.1);
        };

        // Synthesize an adorable, harmonized 3-voice chord sequence that slides musically upwards in C Major:
        // Chord 1 (Root, 3rd, 5th): C5 (523.25) -> Chord 2: D5 (587.33) -> Chord 3: E5 (659.25)
        createCuteVocalVoice(523.25, [
          { t: 0.22, f: 587.33 },
          { t: 0.44, f: 659.25 }
        ], 1.2);

        // Thirds: E5 (659.25) -> F5 (698.46) -> G5 (783.99)
        createCuteVocalVoice(659.25, [
          { t: 0.22, f: 698.46 },
          { t: 0.44, f: 783.99 }
        ], 1.2);

        // Fifths: G5 (783.99) -> A5 (880.00) -> C6 (1046.50)
        createCuteVocalVoice(783.99, [
          { t: 0.22, f: 880.00 },
          { t: 0.44, f: 1046.50 }
        ], 1.2);

        // Connect a high sparkling stardust arpeggio at the end of the choir song (from 1.1s to 1.8s)
        const arpeggio = [1046.50, 1318.51, 1567.98, 2093.00];
        arpeggio.forEach((f, index) => {
          const noteTime = 1.1 + index * 0.11;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + noteTime);
          
          gainNode.gain.setValueAtTime(0, now + noteTime);
          gainNode.gain.linearRampToValueAtTime(0.08, now + noteTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + noteTime + 0.22);
          
          osc.connect(gainNode);
          gainNode.connect(masterVolume);
          
          osc.start(now + noteTime);
          osc.stop(now + noteTime + 0.25);
        });
      }
    } catch (e) {
      console.warn('Web Audio initialization or playback failed:', e);
    }

    // Sing them a cute short celebratory phrase/song using Speech Synthesis
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear any ongoing voice output

        const rawName = selectedKid?.name || 'superstar';
        const kidName = rawName.trim().toLowerCase() === 'ki' ? 'Kie' : rawName;
        const songs = [
          `Yay, ${kidName}, you did it!`,
          `Hooray, ${kidName}, great job!`,
          `Super stellar, ${kidName}!`,
          `Woohoo, go ${kidName}, go!`
        ];
        const selectedSong = songs[Math.floor(Math.random() * songs.length)];
        
        const utterance = new SpeechSynthesisUtterance(selectedSong);
        utterance.rate = 1.35; // Fast, bouncy, cheerful tempo to fit under 2 seconds!
        utterance.pitch = 1.45; // Sweet, high-pitched, childish and super enthusiastic

        // Select an optimal kid-friendly/high-pitched english voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          (v.name.includes('Google') && v.name.includes('English')) || 
          v.name.includes('Samantha') || 
          v.name.includes('Zira') || 
          v.lang.startsWith('en-')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Slight offset so the opening singing chord music triggers first to build anticipation
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 150);
      }
    } catch (e) {
      console.warn('Speech synthesis playback failed:', e);
    }

    setTimeout(() => setShowCelebration(null), 3000);
  };

  useEffect(() => {
    const unsubKids = onSnapshot(collection(db, getCollectionName('kids')), (snapshot) => {
      const kidsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Kid));
      setKids(kidsList.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    const unsubRewards = onSnapshot(collection(db, getCollectionName('rewards')), (snapshot) => {
      setRewards(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reward)));
    });
    const unsubChores = onSnapshot(collection(db, getCollectionName('chores')), (snapshot) => {
      setChores(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chore)));
    });
    const unsubConfig = onSnapshot(doc(db, getCollectionName('config'), 'categories'), (snapshot) => {
      if (snapshot.exists()) {
        setCategoryOrder(snapshot.data().categories || []);
      }
    });

    return () => {
      unsubKids();
      unsubRewards();
      unsubChores();
      unsubConfig();
    };
  }, [getCollectionName]);

  // Handle URL param selection
  useEffect(() => {
    if (kidId && kids.length > 0) {
      const kid = kids.find(k => k.id === kidId);
      if (kid) {
        setSelectedKid(kid);
      }
    }
  }, [kidId, kids]);

  useEffect(() => {
    if (!selectedKid) return;
    
    // Fetch all tasks for this kid and filter client-side for the view range
    const unsubTasks = onSnapshot(
      query(collection(db, getCollectionName('tasks')), where('kidId', '==', selectedKid.id)),
      (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaskInstance)));
      }
    );

    // Update local kid data if balance changes
    const unsubKidSync = onSnapshot(doc(db, getCollectionName('kids'), selectedKid.id), (doc) => {
      if (doc.exists()) {
        setSelectedKid({ id: doc.id, ...doc.data() } as Kid);
      }
    });

    const unsubFulfill = onSnapshot(
      query(collection(db, getCollectionName('fulfillments')), where('kidId', 'in', [selectedKid.id, 'family'])),
      (snapshot) => {
        setFulfillments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fulfillment)));
      }
    );

    return () => {
      unsubTasks();
      unsubKidSync();
      unsubFulfill();
    };
  }, [selectedKid?.id, getCollectionName]);

  // Generate tasks for the day if they don't exist
  const generationLock = React.useRef(false);
  useEffect(() => {
    if (!selectedKid || chores.length === 0 || generationLock.current) return;

    const generateDailyTasks = async () => {
      generationLock.current = true;
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const dayOfWeek = new Date().getDay();
        const dateOfMonth = new Date().getDate();

        // Check against BOTH Firestore and local state for maximum safety
        const existingTasksSnap = await getDocs(query(collection(db, getCollectionName('tasks')), where('kidId', '==', selectedKid.id), where('dueDate', '==', todayStr)));
        const dbChoreIds = new Set(existingTasksSnap.docs.map(d => (d.data() as TaskInstance).choreId));
        const localChoreIds = new Set(validTasks.filter(t => t.dueDate === todayStr).map(t => t.choreId));
        const allExistingChoreIds = new Set([...dbChoreIds, ...localChoreIds]);
        
        const relevantChores = chores.filter(c => c.assignedTo.includes(selectedKid.id) && c.active);

        const batch = writeBatch(db);
        let added = false;

        relevantChores.forEach(chore => {
           if (!allExistingChoreIds.has(chore.id)) {
             let shouldCreate = false;
             
             if (chore.frequency === 'daily') {
               shouldCreate = true;
             } else if (chore.frequency === 'weekdays') {
               shouldCreate = dayOfWeek >= 1 && dayOfWeek <= 5;
             } else if (chore.frequency === 'weekly') {
               shouldCreate = !chore.days || chore.days.length === 0 || chore.days.includes(dayOfWeek);
             } else if (chore.frequency === 'monthly') {
               shouldCreate = !chore.days || chore.days.length === 0 || chore.days.includes(dateOfMonth);
             } else if (chore.frequency === 'by-deadline') {
               // Create once at start of week
               shouldCreate = dayOfWeek === 1;
             }

             if (shouldCreate) {
               const newTaskRef = doc(collection(db, getCollectionName('tasks')));
               batch.set(newTaskRef, {
                 choreId: chore.id,
                 kidId: selectedKid.id,
                 status: 'pending',
                 dueDate: todayStr,
                 pointsValue: chore.points,
                 isBonus: chore.isBonus || false,
                  choreTitle: chore.title,
                  choreIcon: chore.icon,
                  choreCategory: chore.category || ''
               });
               allExistingChoreIds.add(chore.id);
               added = true;
             }
           }
        });

        if (added) await batch.commit();
      } catch (e) {
        console.error("Task generation failed:", e);
      } finally {
        generationLock.current = false;
      }
    };

    generateDailyTasks();
  }, [selectedKid?.id, chores, validTasks.length > 0]); // Re-run if chores change or tasks loaded

  // Refined filtering to handle work-ahead and overdue tasks without duplicates
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const isPastView = isBefore(startOfDay(selectedDate), today);
  const isToday = isSameDay(selectedDate, new Date());
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const filteredTasks = React.useMemo(() => {
    // 1. Get all tasks associated with this literal day
    const dayTasks = validTasks.filter(t => t.dueDate === selectedDateStr);
    
    if (!isToday) return dayTasks;

    // 2. For Today's view, we add specific categories of extra tasks
    const otherTasks = validTasks.filter(t => t.dueDate !== selectedDateStr);
    
    const overdueTasks = otherTasks.filter(t => {
      if (t.dueDate < selectedDateStr && t.status === 'pending') {
        const chore = chores.find(c => c.id === t.choreId);
        // Exclude weekly chores that occur on specific days of the week from overdue listings on other days
        if (chore && chore.frequency === 'weekly' && chore.days && chore.days.length > 0) {
          return false;
        }
        return true;
      }
      return false;
    });

    const workAheadTasks = otherTasks.filter(t => {
      const chore = chores.find(c => c.id === t.choreId);
      // Exclude weekly chores that occur on specific days of the week from work-ahead listings on other days
      if (chore && chore.frequency === 'weekly' && chore.days && chore.days.length > 0) {
        return false;
      }
      if (t.status === 'completed') {
        // If it was completed TODAY but was due in the future
        const compDateStr = typeof t.completedAt === 'string' ? t.completedAt.split('T')[0] : '';
        return compDateStr === todayStr && t.dueDate > todayStr && t.dueDate <= weekEndStr;
      } else {
        // Pending future tasks for specific frequencies
        const isHighFrequency = chore && (chore.frequency === 'weekly' || chore.frequency === 'by-deadline' || chore.frequency === 'monthly');
        return isHighFrequency && t.dueDate > todayStr && t.dueDate <= weekEndStr;
      }
    });

    // Combine and deduplicate: Only show ONE pending instance per chore for future/overdue to avoid clutter
    const combined = [...dayTasks];
    const seenChoreIds = new Set(dayTasks.map(t => t.choreId));

    // Add overdue (don't add if already showing a task for this chore today)
    overdueTasks.forEach(t => {
      if (!seenChoreIds.has(t.choreId)) {
        combined.push(t);
        seenChoreIds.add(t.choreId);
      }
    });

    // Add work-ahead (don't add if already showing a task for this chore today/overdue)
    workAheadTasks.forEach(t => {
      if (!seenChoreIds.has(t.choreId)) {
        combined.push(t);
        seenChoreIds.add(t.choreId);
      } else if (t.status === 'completed') {
        // Always show what was completed today, even if it's a "duplicate" chore name (it represents work done)
        combined.push(t);
      }
    });

    return combined;
  }, [validTasks, selectedDateStr, isToday, chores, todayStr, weekEndStr]);

  const visibleTasks = React.useMemo(() => {
    const isBonusTask = (t: TaskInstance) => {
      if (t.isBonus) return true;
      const chore = chores.find(c => c.id === t.choreId) || (t.choreTitle ? {
        id: t.choreId,
        title: t.choreTitle,
        icon: t.choreIcon || '🚀',
        category: t.choreCategory || '',
        points: t.pointsValue,
        active: false,
        assignedTo: [t.kidId],
        createdAt: '',
        order: 0,
        frequency: 'daily'
      } as Chore : undefined);
      if (chore?.isBonus) return true;
      return (chore?.category || '').trim().toLowerCase() === 'bonus chores';
    };

    const requiredTasks = filteredTasks.filter(t => !isBonusTask(t));
    const allRequiredCompleted = requiredTasks.length > 0 && requiredTasks.every(t => t.status === 'completed');
    
    // Show bonus chores if:
    // 1. All required chores are completed
    // 2. OR there are NO required chores for the day (unlikely but possible)
    if (allRequiredCompleted || requiredTasks.length === 0) {
      return filteredTasks;
    }
    return requiredTasks;
  }, [filteredTasks, chores]);

  if (!selectedKid) {
    if (kidId) {
       return (
         <div className="relative min-h-[60vh] flex flex-col items-center justify-center">
            <HabitatBackground habitat="picker" />
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }} className="relative z-10">
               <Sparkles className="w-12 h-12 text-slate-300" />
            </motion.div>
            <p className="mt-4 font-black text-slate-300 relative z-10">Finding your critter...</p>
         </div>
       );
    }
    return (
      <div className="relative min-h-[60vh] flex flex-col items-center justify-center gap-12 py-12">
         <HabitatBackground habitat="picker" />
         
         <motion.div className="flex flex-col items-center gap-4 relative z-10">
           <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-white tracking-tight drop-shadow-lg"
           >
             Choose Your Profile!
           </motion.h1>
           <div className="flex items-center gap-2">
             {mode === 'demo' && (
                <span className="text-[10px] bg-yellow-400 text-slate-900 px-3 py-1 rounded-full animate-pulse border-b-2 border-yellow-600 font-black">DEMO</span>
              )}
              {workspaceId && mode === 'live' && (
                <span className="text-[10px] bg-green-400 text-slate-900 px-3 py-1 rounded-full border-b-2 border-green-600 font-black uppercase tracking-widest">{familyName || `Family ${workspaceId}`}</span>
              )}
           </div>
         </motion.div>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
            {kids.map(kid => (
              <motion.button
                key={kid.id}
                whileHover={{ scale: 1.1, y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedKid(kid)}
                style={{ borderBottomColor: kid.color }}
                className="bg-white/90 backdrop-blur-md p-10 rounded-[40px] shadow-xl border-b-8 flex flex-col items-center gap-6 transition-all hover:brightness-105 border border-white/20"
              >
                <div className="text-8xl drop-shadow-sm">{kid.avatar}</div>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{kid.name}</span>
              </motion.button>
            ))}
         </div>
      </div>
    );
  }

  
  // Group tasks by chore category and sort by order
  const groupedTasks = visibleTasks.reduce((acc, task) => {
    const chore = chores.find(c => c.id === task.choreId);
    const category = chore?.category || '';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, TaskInstance[]>);

  // Get sorted list of categories
  const sortedCategories = categoryOrder.filter(cat => groupedTasks[cat]);
  // Add any categories not in order but present in tasks
  Object.keys(groupedTasks).forEach(cat => {
    if (!sortedCategories.includes(cat)) {
      sortedCategories.push(cat);
    }
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Try to find a gentle female voice
      const gentleVoice = voices.find(v => 
        (v.name.includes('Google') && v.name.includes('English')) || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') || 
        v.name.includes('Female')
      );
      if (gentleVoice) utterance.voice = gentleVoice;
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = 1.0;  // More natural pitch
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)]">
      <HabitatBackground habitat={selectedKid ? getHabitatForAvatar(selectedKid.avatar) : 'picker'} />
      
      <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header 
          style={{ borderBottomColor: selectedKid.color }}
          className="flex justify-between items-center bg-white/90 backdrop-blur-md rounded-[30px] p-4 shadow-sm border-b-4"
        >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/kids')} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div 
            style={{ backgroundColor: selectedKid.color }}
            className="p-2 rounded-xl"
          >
             <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Back to Family</h1>
            {mode === 'demo' && (
              <span className="text-[8px] bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full border-b border-yellow-600 font-black w-fit mt-1">DEMO</span>
            )}
            {workspaceId && mode === 'live' && (
              <span className="text-[8px] bg-green-400 text-slate-900 px-2 py-0.5 rounded-full border-b border-green-600 font-black uppercase tracking-widest w-fit mt-1">{familyName || `Family ${workspaceId}`}</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {kids.map(k => (
            <button 
              key={k.id}
              onClick={() => navigate(`/kids/${k.id}`)}
              style={k.id === selectedKid.id ? { borderColor: k.color, backgroundColor: `${k.color}10` } : {}}
              className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center text-xl ${
                k.id === selectedKid.id ? 'scale-110 shadow-md' : 'border-white opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
            >
              {k.avatar}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Profile */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <div 
            style={{ borderBottomColor: selectedKid.color }}
            className="bg-white/80 backdrop-blur-md rounded-[40px] p-8 shadow-md border-b-8 flex flex-col items-center text-center text-slate-800"
          >
            <div 
              style={{ backgroundColor: `${selectedKid.color}10`, borderColor: `${selectedKid.color}30` }}
              className="w-32 h-32 rounded-full flex items-center justify-center text-7xl mb-4 border-4 shadow-inner"
            >
              {selectedKid.avatar}
            </div>
            <h2 className="text-3xl font-black text-slate-800">{selectedKid.name}</h2>
            <div className="mt-4 flex flex-col items-center gap-1">
              <div 
                style={{ color: selectedKid.color }}
                className="text-4xl font-black flex items-center gap-2"
              >
                <Star className="w-8 h-8 fill-current" />
                {selectedKid.isNonReader 
                  ? Math.floor((selectedKid.stars || 0) / (selectedKid.stickerValue || 5))
                  : selectedKid.stars
                }
              </div>
              <span className="text-[10px] font-black tracking-wide text-slate-600">
                {selectedKid.isNonReader ? 'Stickers Earned' : 'Stars Earned'}
              </span>
              {selectedKid.isNonReader && (
                <span className="text-[8px] font-bold text-slate-400 tracking-tight">
                  ({selectedKid.stars} stars total)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calendar & Tasks */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-6 shadow-md border-b-8 border-slate-200">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Chore Chart</h3>
              <div className="flex gap-2">
                <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 hover:bg-slate-50 rounded-xl">
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="px-4 py-2 bg-slate-50 rounded-xl font-black text-slate-800 text-sm">
                  Week of {format(weekStart, 'MMM d')}
                </div>
                <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-slate-50 rounded-xl">
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayTasks = validTasks.filter(t => t.dueDate === dayStr);
                const completedCount = dayTasks.filter(t => t.status === 'completed').length;
                const totalCount = dayTasks.length;
                const filteredCompleted = dayTasks.filter(t => t.status === 'completed');
                const dayStickersCount = selectedKid.isNonReader 
                  ? filteredCompleted.reduce((acc, t) => acc + Math.floor(t.pointsValue / (selectedKid.stickerValue || 5)), 0)
                  : 0;

                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    style={isSelected ? { backgroundColor: selectedKid.color } : {}}
                    className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${
                      isSelected ? 'text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-black tracking-wide opacity-70">{format(day, 'EEE')}</span>
                    <span className="text-2xl font-black">{format(day, 'd')}</span>
                    {selectedKid.isNonReader && dayStickersCount > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 max-w-[80px] mt-1 px-1">
                        {Array.from({ length: dayStickersCount }).map((_, idx) => {
                          // Scale icons based on how many there are to fit the box
                          const iconSize = dayStickersCount > 6 ? 'w-5 h-5 text-[10px]' : dayStickersCount > 4 ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-base';
                          
                          return (
                            <div 
                              key={idx} 
                              className={`${iconSize} rounded-lg flex items-center justify-center shadow-sm border-2 transition-transform hover:scale-110 ${
                                isSelected ? 'bg-white/30 border-white/40' : 'bg-white border-slate-100'
                              }`}
                            >
                              ⭐
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!selectedKid.isNonReader && totalCount > 0 && (
                      <div className={`w-2 h-2 rounded-full ${completedCount === totalCount ? (isSelected ? 'bg-white/30' : 'bg-green-500') : (isSelected ? 'bg-black/10' : 'bg-slate-200')}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-8 shadow-md border-b-8 border-green-200 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isToday ? "Today's" : format(selectedDate, 'EEEE\'s')} Chores
                </h3>
                {(isPastView || isToday) && (
                  <div className="flex items-center gap-2 mt-1">
                    {selectedKid.isNonReader ? (
                      <span className="text-2xl">⭐</span>
                    ) : (
                      <Star 
                        style={{ color: selectedKid.color, fill: selectedKid.color }}
                        className="w-4 h-4" 
                      />
                    )}
                    <span className="text-sm font-black text-slate-500">
                      {selectedKid.isNonReader ? (
                        (() => {
                          const stickersCount = Math.floor(visibleTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.pointsValue, 0) / (selectedKid.stickerValue || 5));
                          return `${stickersCount} ${stickersCount === 1 ? 'sticker today' : 'stickers today'}`;
                        })()
                      ) : (
                        `${visibleTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.pointsValue, 0)} Stars Earned`
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className={`px-4 py-2 rounded-full font-black text-xs ${
                isPastView && visibleTasks.every(t => t.status === 'completed') 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {visibleTasks.filter(t => t.status === 'completed').length} / {visibleTasks.length} Done
              </div>
            </div>
            <div className="space-y-8">
              {visibleTasks.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-black tracking-wide">No Tasks Scheduled</div>
              ) : (
                sortedCategories.map((category) => {
                  const categoryTasks = groupedTasks[category];
                  if (!categoryTasks || categoryTasks.length === 0) return null;

                  return (
                    <div key={category || 'uncategorized'} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px bg-slate-100 flex-1" />
                        <h4 className="text-[10px] font-black tracking-wide text-slate-600">
                          {category || 'General'}
                        </h4>
                        <div className="h-px bg-slate-100 flex-1" />
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categoryTasks.sort((a, b) => {
                          // Keep completed at bottom
                          if (a.status === 'completed' && b.status !== 'completed') return 1;
                          if (a.status !== 'completed' && b.status === 'completed') return -1;
                          
                          const choreA = chores.find(c => c.id === a.choreId);
                          const choreB = chores.find(c => c.id === b.choreId);
                          
                          // Sort by chore order
                          if ((choreA?.order ?? 0) !== (choreB?.order ?? 0)) {
                             return (choreA?.order ?? 0) - (choreB?.order ?? 0);
                          }

                          // Sort by due date for early tasks
                          return a.dueDate.localeCompare(b.dueDate);
                        }).map(task => {
                          const chore = chores.find(c => c.id === task.choreId) || (task.choreTitle ? {
                            id: task.choreId,
                            title: task.choreTitle,
                            icon: task.choreIcon || '🚀',
                            category: task.choreCategory || '',
                            points: task.pointsValue,
                            active: false,
                            assignedTo: [task.kidId],
                            createdAt: '',
                            order: 0,
                            frequency: 'daily'
                          } as Chore : undefined);
                          return (
                            <ChoreCard 
                              key={task.id} 
                              task={task} 
                              chore={chore} 
                              kid={selectedKid as Kid} 
                              isPastDate={isPastView}
                              onComplete={() => triggerCelebration(selectedKid.avatar, selectedKid.color)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-blue-600 rounded-[40px] p-8 shadow-md border-b-8 border-blue-800 text-white mb-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Gift className="w-32 h-32 rotate-12" />
            </div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-3xl font-black tracking-tight italic">My Shop</h3>
                <span className="text-[10px] font-black tracking-wide opacity-60">Rewards just for me</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
               {rewards.filter(r => (r.type || 'kid') === 'kid' && (r.allowedKids?.includes(selectedKid.id) || !r.allowedKids || r.allowedKids.length === 0)).sort((a,b) => (a.cost || 0) - (b.cost || 0)).map(reward => {
                 return (
                   <RewardCard key={reward.id} reward={reward} kid={selectedKid as Kid} />
                 );
               })}
            </div>
          </div>

          <div className="bg-emerald-950 rounded-[40px] p-8 shadow-md border-b-8 border-emerald-900 text-white mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Users className="w-32 h-32 -rotate-12" />
            </div>
            <div className="flex items-end justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-400/20 p-3 rounded-2xl backdrop-blur-sm border border-emerald-400/30">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-3xl font-black tracking-tight italic">Family Shop</h3>
                  <span className="text-[10px] font-black tracking-wide opacity-40">Shared big prizes</span>
                </div>
              </div>
              {kids.length > 0 && (
                <div className="flex items-center gap-2 bg-emerald-900/50 px-4 py-2 rounded-2xl border border-emerald-800">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-300">
                    {kids.length} Kids Sharing
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-sm font-black text-emerald-400 mb-6 flex items-center gap-2 italic">
              <Sparkles className="w-4 h-4" />
              Team up with your siblings to unlock these!
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10">
             {rewards.filter(r => (r.type || 'kid') === 'family').sort((a,b) => (a.cost || 0) - (b.cost || 0)).map(reward => {
               const totalStars = kids.reduce((acc, k) => acc + (k.stars || 0), 0);
               const perKid = Math.ceil(reward.cost / (kids.length || 1));
               const baseShare = Math.floor(reward.cost / (kids.length || 1));
               const remainder = reward.cost % (kids.length || 1);
               const canAfford = kids.every((k, idx) => (k.stars || 0) >= (baseShare + (idx < remainder ? 1 : 0)));
               const stickersPerKid = selectedKid.isNonReader ? Math.ceil(perKid / (selectedKid.stickerValue || 5)) : 0;

               return (
                 <motion.button 
                   key={reward.id} 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className={`border-4 p-6 rounded-[32px] flex flex-col items-center text-center gap-4 transition-all group relative overflow-hidden shadow-xl ${
                     canAfford 
                      ? 'bg-white border-white text-slate-800 cursor-pointer' 
                      : 'bg-emerald-900/40 border-emerald-800/50 text-emerald-100/40 opacity-50 grayscale pointer-events-none'
                   }`}
                   onClick={() => canAfford && setInterceptReward(reward)}
                 >
                   <div className={`text-5xl group-hover:scale-125 transition-transform duration-300 ${canAfford ? 'drop-shadow-lg' : 'grayscale opacity-30'}`}>
                     {reward.icon}
                   </div>
                   <div className="space-y-2">
                     <h4 className={`text-[10px] font-black tracking-tight leading-tight ${canAfford ? 'text-slate-800' : 'text-emerald-300/40'}`}>
                       {reward.title}
                     </h4>
                     
                     {selectedKid.isNonReader ? (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-1 p-3 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/50 min-h-[60px] justify-items-center">
                {Array.from({ length: stickersPerKid }).map((_, i) => {
                  const scale = Math.max(0.6, 1 - (stickersPerKid * 0.01)); // Subtle scale for many stickers
                  return (
                    <div 
                      key={i} 
                      className={`rounded-lg flex items-center justify-center shadow-md border-2 transition-transform ${
                        canAfford ? 'bg-white border-emerald-100' : 'bg-white/5 border-white/5'
                      }`}
                      style={{ 
                        width: `${32 * scale}px`,
                        height: `${32 * scale}px`,
                        fontSize: `${18 * scale}px`
                      }}
                    >
                      ⭐
                    </div>
                  );
                })}
              </div>
              <div className={`flex flex-col items-center justify-center gap-0 px-3 py-1 rounded-full font-black border ${
                 canAfford ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white/5 border-white/5 text-emerald-300/30'
              }`}>
                 <span className="text-sm leading-none">{stickersPerKid}</span>
                 <span className="text-[6px] tracking-wide leading-none">Each</span>
              </div>
              <p className={`text-[8px] font-black tracking-tight opacity-40`}>
                {reward.cost} Total Stars
              </p>
            </div>
                     ) : (
                       <div className={`flex flex-col items-center gap-1`}>
                         <div className={`flex items-center justify-center gap-1 text-xs font-black px-3 py-1 rounded-full border-2 ${
                            canAfford ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white/5 border-white/5 text-emerald-300/30'
                         }`}>
                            <Star className={`w-3 h-3 ${canAfford ? 'fill-emerald-500' : 'fill-currentColor'}`} />
                            {reward.cost}
                         </div>
                         <p className={`text-[8px] font-black tracking-tight opacity-60`}>
                           {perKid} stars each
                         </p>
                       </div>
                     )}
                   </div>
                     {canAfford && (
                       <div className="absolute top-2 right-2">
                         <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                       </div>
                     )}
                   </motion.button>
                 );
               })}
            </div>
          </div>

          {fulfillments.filter(f => f.status === 'pending').length > 0 && (
            <div className="bg-slate-800 rounded-[40px] p-8 shadow-md border-b-8 border-slate-900 text-white">
              <h3 className="font-black tracking-wide text-xs opacity-70 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Purchased & Waiting
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fulfillments
                  .filter(f => f.status === 'pending')
                  .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
                  .map(f => (
                  <div key={f.id} className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <div className="text-3xl bg-white/10 w-12 h-12 flex items-center justify-center rounded-xl">{f.rewardIcon}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-white text-sm leading-tight">
                        {f.rewardTitle} {f.kidId === 'family' && <span className="opacity-60 text-[10px] ml-1">👪</span>}
                      </h4>
                      <p className="text-[9px] font-black tracking-wide opacity-60">
                        Waiting for Parent
                      </p>
                    </div>
                    <div className="bg-yellow-400 p-1.5 rounded-full animate-pulse">
                      <Gift className="w-4 h-4 text-slate-900" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {interceptReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 sm:space-y-6 border-b-8 border-emerald-400 overflow-y-auto max-h-[95vh] relative"
            >
              <div className="bg-emerald-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-5xl relative group">
                {interceptReward.icon}
                <button 
                  onClick={() => {
                    const perPerson = Math.ceil(interceptReward.cost / (kids.length || 1));
                    speak(`${interceptReward.title} is a prize for everyone. It costs ${interceptReward.cost} stars total, which is ${perPerson} stars from each of you. To buy it, you and all your siblings need to agree together in the Family Shop!`);
                  }}
                  className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg text-emerald-600 hover:scale-110 transition-transform"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Family Reward!</h2>
                  <p className="text-slate-500 font-bold">
                    {interceptReward.title} is a prize for <span className="text-emerald-600">everyone</span>. 
                    To buy it, you and all your siblings need to agree together in the Family Shop!
                  </p>
                </div>

                <div className="bg-emerald-50 rounded-3xl p-6 border-b-4 border-emerald-200">
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Total Reward Cost</span>
                    <div className="flex items-center gap-2">
                       <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                       <span className="text-5xl font-black text-emerald-700">{interceptReward.cost}</span>
                    </div>
                  </div>
                  
                  <div className="h-px bg-emerald-200/50 w-full mb-4" />
                  
                  <div className="flex justify-between items-center bg-white/60 rounded-2xl p-4 border border-emerald-100">
                    <div className="flex flex-col text-left">
                      <span className="text-slate-600 font-black text-xs">Stars Per Person</span>
                      <p className="text-[10px] text-slate-400 font-bold italic">Split between {kids.length} kids</p>
                    </div>
                    <span className="text-emerald-700 font-black text-2xl">
                      {Math.ceil(interceptReward.cost / (kids.length || 1))}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-emerald-600 font-black mt-4 text-center">
                    ✨ Your family star total will go down by {interceptReward.cost} stars when you buy this!
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate('/kids', { state: { scrollTo: 'family-shop' } });
                    setInterceptReward(null);
                  }}
                  className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black tracking-wide text-sm hover:bg-emerald-700 active:translate-y-1 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Go to Family Shop
                </button>
                <button
                  onClick={() => setInterceptReward(null)}
                  className="w-full py-4 text-slate-400 font-black tracking-wide text-xs hover:text-slate-600"
                >
                  Return to {selectedKid.name}'s page
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay 
            avatar={showCelebration.avatar} 
            color={showCelebration.color} 
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function CelebrationOverlay({ avatar, color }: { avatar: string; color: string }) {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Main jumping avatar */}
      <motion.div
        initial={{ scale: 0, y: 100, rotate: -20 }}
        animate={{ 
          scale: [0, 1.5, 1.2], 
          y: [100, -50, 0],
          rotate: [-20, 20, 0]
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.8, times: [0, 0.6, 1], ease: "easeOut" }}
        className="text-9xl drop-shadow-2xl z-50"
      >
        {avatar}
      </motion.div>

      {/* Floating mini critters */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`critter-${i}`}
          initial={{ 
            x: 0, 
            y: 200, 
            opacity: 0,
            scale: 0.5 + Math.random() 
          }}
          animate={{ 
            x: (Math.random() - 0.5) * 800,
            y: -window.innerHeight - 100,
            opacity: [0, 1, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: "easeOut"
          }}
          className="absolute text-4xl"
        >
          {avatar}
        </motion.div>
      ))}

      {/* Confetti pieces */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={`confetti-${i}`}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0,
            scale: 1
          }}
          animate={{ 
            x: (Math.random() - 0.5) * 1000,
            y: (Math.random() - 0.5) * 1000,
            opacity: [0, 1, 1, 0],
            rotate: Math.random() * 720
          }}
          transition={{ 
            duration: 1.5 + Math.random(),
            delay: Math.random() * 0.2,
            ease: "circOut"
          }}
          style={{ backgroundColor: color }}
          className="absolute w-4 h-4 rounded-sm shadow-sm"
        />
      ))}

      {/* Burst circles */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1 }}
        style={{ borderColor: color }}
        className="absolute border-8 rounded-full w-40 h-40"
      />
      
      <motion.h2
        initial={{ opacity: 0, scale: 0.5, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 150 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="absolute font-black text-6xl text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] italic tracking-tighter"
      >
        HOORAY!
      </motion.h2>
    </div>
  );
}

function ChoreCard({ task, chore, kid, isPastDate = false, onComplete }: { task: TaskInstance, chore?: Chore, kid: Kid, isPastDate?: boolean, onComplete?: () => void, key?: React.Key }) {
  const { getCollectionName } = useWorkspace();
  const [completing, setCompleting] = useState(false);
  const completingRef = React.useRef(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticStatus(null);
  }, [task.status]);

  const currentStatus = optimisticStatus !== null ? optimisticStatus : task.status;

  const toggleComplete = async () => {
    if (isPastDate || completing || completingRef.current) return;
    
    const isUndoing = currentStatus === 'completed';

    completingRef.current = true;
    setCompleting(true);
    setOptimisticStatus(isUndoing ? 'pending' : 'completed');

    try {
      const batch = writeBatch(db);
      
      if (isUndoing) {
        batch.update(doc(db, getCollectionName('tasks'), task.id), {
          status: 'pending',
          completedAt: null
        });
        batch.update(doc(db, getCollectionName('kids'), kid.id), {
          stars: Math.max(0, (kid.stars || 0) - task.pointsValue)
        });
        const transRef = doc(collection(db, getCollectionName('transactions')));
        batch.set(transRef, {
          kidId: kid.id,
          amount: -task.pointsValue,
          type: 'undo',
          description: `Undid: ${chore?.title || 'Task'}`,
          timestamp: serverTimestamp()
        });
      } else {
        batch.update(doc(db, getCollectionName('tasks'), task.id), {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        batch.update(doc(db, getCollectionName('kids'), kid.id), {
          stars: (kid.stars || 0) + task.pointsValue
        });

        const transRef = doc(collection(db, getCollectionName('transactions')));
        batch.set(transRef, {
          kidId: kid.id,
          amount: task.pointsValue,
          type: 'earn',
          description: chore?.title || 'Completed task',
          timestamp: serverTimestamp()
        });

        // Trigger celebration on complete
        if (onComplete) onComplete();
      }

      await batch.commit();
    } catch (e) {
      console.error(e);
      setOptimisticStatus(null);
    } finally {
      completingRef.current = false;
      setCompleting(false);
    }
  };

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const text = `${chore?.title || 'Task'}. Worth ${task.pointsValue} stars.`;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const gentleVoice = voices.find(v => 
        (v.name.includes('Google') && v.name.includes('English')) || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') || 
        v.name.includes('Female')
      );
      if (gentleVoice) utterance.voice = gentleVoice;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div
      whileHover={!isPastDate ? { scale: 1.02, x: 4 } : {}}
      whileTap={!isPastDate ? { scale: 0.98 } : {}}
      onClick={toggleComplete}
      className={`group w-full flex items-center p-4 rounded-3xl border-2 transition-all relative cursor-pointer ${
        currentStatus === 'completed' 
          ? 'bg-slate-50 border-transparent hover:border-rose-300 opacity-70 hover:opacity-100 shadow-sm' 
          : isPastDate
            ? 'bg-slate-100 border-dashed border-slate-200 opacity-70 cursor-not-allowed'
            : 'bg-white border-transparent hover:border-green-400 shadow-sm shadow-slate-100'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl mr-4 shadow-inner relative overflow-hidden transition-all ${
        currentStatus === 'completed' 
          ? 'bg-slate-200 group-hover:bg-rose-100/50' 
          : isPastDate 
            ? 'bg-slate-200 grayscale' 
            : 'bg-blue-50'
      }`}>
        <span className={currentStatus === 'completed' || isPastDate ? 'opacity-20' : ''}>
          {chore?.icon || '🚀'}
        </span>
        
        {isPastDate && currentStatus !== 'completed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/20">
            <XCircle className="w-8 h-8 text-red-500/80 drop-shadow-sm" />
          </div>
        )}
        {currentStatus === 'completed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-50/20 group-hover:bg-rose-50/20 transition-all duration-200">
            <CheckCircle className="w-8 h-8 text-green-500/80 drop-shadow-sm group-hover:hidden" />
            <XCircle className="w-8 h-8 text-rose-500 drop-shadow-sm hidden group-hover:block" />
          </div>
        )}
      </div>
      <div className="flex-1 text-left flex items-start justify-between">
        <div className="flex-1">
          <h4 className={`font-black tracking-tight ${currentStatus === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {chore?.title || 'Task'}
          </h4>
          {(() => {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            if (task.dueDate > todayStr) {
              const [y, m, d] = task.dueDate.split('-').map(Number);
              const dDate = new Date(y, m - 1, d);
              return <p style={{ color: kid.color }} className="text-xs font-black tracking-wide mt-0.5 animate-pulse">Due {format(dDate, 'EEEE')}</p>;
            }
            return null;
          })()}
        </div>
        
        {currentStatus !== 'completed' && (
          <button 
            onClick={speak}
            style={{ color: `${kid.color}80` }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors hover:brightness-75"
            title="Read Aloud"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className={`flex items-center font-black ${currentStatus === 'completed' ? 'text-slate-400' : ''} ml-4`}
        style={currentStatus !== 'completed' ? { color: kid.color } : {}}
      >
        {kid.isNonReader ? (
          <div className="flex flex-col items-center pr-2">
            <div className="flex items-center gap-3">
              <span className={`text-5xl font-black italic tracking-tighter ${currentStatus === 'completed' ? 'text-slate-400 line-through' : ''}`}>
                {Math.floor(task.pointsValue / (kid.stickerValue || 5))}
              </span>
              <div className="flex flex-wrap items-center -space-x-4 max-w-[200px] justify-end">
                {Array.from({ length: Math.floor(task.pointsValue / (kid.stickerValue || 5)) }).map((_, idx) => {
                  const stickerCount = Math.floor(task.pointsValue / (kid.stickerValue || 5));
                  const stickerScale = Math.max(0.7, 1 - (stickerCount * 0.05));
                  return (
                    <div 
                      key={idx} 
                      className={`rounded-2xl flex items-center justify-center shadow-md border-4 transition-transform hover:scale-110 hover:z-50 ${
                        currentStatus === 'completed' 
                          ? 'bg-slate-200 border-slate-300 opacity-40 grayscale' 
                          : 'bg-white border-slate-50'
                      }`}
                      style={{ 
                        zIndex: 20 - idx,
                        width: `${56 * stickerScale}px`,
                        height: `${56 * stickerScale}px`,
                        fontSize: `${36 * stickerScale}px`,
                        transform: `rotate(${idx * 4 - (stickerCount * 2)}deg)`
                      }}
                    >
                      ⭐
                    </div>
                  );
                })}
              </div>
            </div>
            <span className={`text-xs font-black flex items-center mt-1 opacity-60 ${currentStatus === 'completed' ? 'line-through text-slate-400' : ''}`}>
              +{task.pointsValue} <Star className="w-3 h-3 ml-0.5 fill-current" />
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-end pr-2">
            <span className={`text-xl ${currentStatus === 'completed' ? 'line-through text-slate-400' : ''}`}>+{task.pointsValue} ⭐</span>
          </div>
        )}
      </div>
      {completing && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl flex items-center justify-center">
           <Sparkles className="w-6 h-6 text-green-500 animate-bounce" />
        </div>
      )}
    </motion.div>
  );
}

function RewardCard({ reward, kid }: { reward: Reward, kid: Kid, key?: React.Key }) {
  const { getCollectionName } = useWorkspace();
  const [buying, setBuying] = useState(false);
  const canAfford = (kid.stars || 0) >= reward.cost;

  const buyReward = async () => {
    if (!canAfford || buying) return;
    if (!confirm(`Spend ${reward.cost} stars on ${reward.title}?`)) return;

    setBuying(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, getCollectionName('kids'), kid.id), {
        stars: (kid.stars || 0) - reward.cost
      });

      const transRef = doc(collection(db, getCollectionName('transactions')));
      batch.set(transRef, {
        kidId: kid.id,
        amount: -reward.cost,
        type: 'spend',
        description: `Bought ${reward.title}`,
        timestamp: serverTimestamp()
      });

      // Create Fulfillment record
      const fulfillRef = doc(collection(db, getCollectionName('fulfillments')));
      batch.set(fulfillRef, {
        kidId: kid.id,
        rewardId: reward.id,
        rewardTitle: reward.title,
        rewardIcon: reward.icon,
        cost: reward.cost,
        type: 'kid',
        status: 'pending',
        purchasedAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (e) {
      console.error(e);
    } finally {
      setBuying(false);
    }
  };

  const speakReward = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const text = `${reward.title}. Costs ${reward.cost} stars. ${canAfford ? 'You have enough stars!' : `You need ${reward.cost - (kid.stars || 0)} more stars.`}`;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const gentleVoice = voices.find(v => 
        (v.name.includes('Google') && v.name.includes('English')) || 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') || 
        v.name.includes('Female')
      );
      if (gentleVoice) utterance.voice = gentleVoice;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div
      whileHover={canAfford ? { scale: 1.05, y: -5 } : {}}
      whileTap={canAfford ? { scale: 0.95 } : {}}
      onClick={canAfford && !buying ? buyReward : undefined}
      className={`w-full p-6 rounded-[32px] border-4 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden ${
        canAfford 
          ? 'bg-white border-white text-slate-800 shadow-xl hover:shadow-2xl cursor-pointer' 
          : 'bg-black/10 border-white/5 opacity-40 grayscale cursor-not-allowed'
      }`}
      role="button"
      tabIndex={canAfford ? 0 : -1}
      onKeyDown={(e) => {
        if (canAfford && !buying && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          buyReward();
        }
      }}
    >
      <div className={`text-6xl mb-2 transition-transform duration-300 ${canAfford ? 'group-hover:scale-110 drop-shadow-md' : 'opacity-40'} relative`}>
        {reward.icon}
        <button 
          onClick={speakReward}
          className={`absolute -bottom-1 -right-3 p-1.5 rounded-full shadow-sm transition-all ${
            canAfford ? 'bg-blue-50 text-blue-600 hover:scale-110' : 'bg-white/10 text-white/40'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        <h5 className={`text-xs font-black tracking-tight leading-tight ${canAfford ? 'text-slate-800' : 'text-white'}`}>
          {reward.title}
        </h5>
        
        <div className="flex flex-col items-center gap-2">
          {kid.isNonReader ? (
            <div className="space-y-3 w-full">
              <div className="grid grid-cols-5 gap-1 p-3 bg-blue-50/30 rounded-2xl border-2 border-dashed border-blue-200/50 min-h-[60px] justify-items-center">
                {Array.from({ length: Math.ceil(reward.cost / (kid.stickerValue || 5)) }).map((_, i) => {
                  const stickerCount = Math.ceil(reward.cost / (kid.stickerValue || 5));
                  const scale = Math.max(0.6, 1 - (stickerCount * 0.01));
                  return (
                    <div 
                      key={i} 
                      className={`rounded-xl flex items-center justify-center shadow-md border-2 transition-transform ${
                        canAfford 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white/10 border-white/10'
                      }`}
                      style={{ 
                        width: `${36 * scale}px`,
                        height: `${36 * scale}px`,
                        fontSize: `${20 * scale}px`
                      }}
                    >
                      ⭐
                    </div>
                  );
                })}
              </div>
              <div className={`flex flex-col items-center justify-center gap-0.5 py-2 px-6 rounded-full font-black border-2 mx-auto w-fit ${
                canAfford 
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg' 
                  : 'bg-white/10 border-white/10 text-white'
              }`}>
                <span className="text-xl leading-none">{Math.ceil(reward.cost / (kid.stickerValue || 5))}</span>
                <span className="text-[8px] tracking-wide leading-none">Stickers</span>
              </div>
              <p className={`text-[10px] font-black tracking-tight opacity-60 ${canAfford ? 'text-blue-600' : 'text-white/40'}`}>
                {reward.cost} Stars
              </p>
            </div>
          ) : (
            <div className={`flex items-center justify-center gap-1.5 py-1 px-4 rounded-full font-black text-sm border-2 ${
              canAfford 
                ? 'bg-blue-50 border-blue-100 text-blue-600' 
                : 'bg-white/10 border-white/10 text-white'
            }`}>
               <Star className={`w-4 h-4 ${canAfford ? 'fill-blue-500' : 'fill-white'}`} />
               {reward.cost}
            </div>
          )}
        </div>
      </div>

      {!canAfford && (
        <div className="absolute top-2 right-2 text-[10px] font-black tracking-tight text-white/40">
          Need {reward.cost - (kid.stars || 0)} More
        </div>
      )}

      {buying && (
        <div className="absolute inset-0 bg-blue-500/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
           <Sparkles className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </motion.div>
  );
}
