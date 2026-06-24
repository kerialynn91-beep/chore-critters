import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, query, onSnapshot, where, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Kid, Chore, TaskInstance, Reward, Fulfillment } from '../types';
import { useWorkspace } from '.WorkspaceContext';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle, ChevronRight, Gift, Sparkles, X, Check, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

function AgreementModal({ 
  reward, 
  kids, 
  onConfirm, 
  onCancel 
}: { 
  reward: Reward; 
  kids: Kid[]; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  const [agreedKids, setAgreedKids] = useState<Set<string>>(new Set());

  const toggleKid = (id: string) => {
    const next = new Set(agreedKids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAgreedKids(next);
  };

  const allAgreed = agreedKids.size === kids.length && kids.length > 0;

const speak = () => {
    if ('speechSynthesis' in window) {
      const perPerson = Math.ceil(reward.cost / (kids.length || 1));
      const text = `Do You All Agree? Together, this prize costs ${reward.cost} stars. That means everyone contributes ${perPerson} stars each. Tap your critter if you agree to spend them on ${reward.title}!`;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      const gentleVoice = voices.find(v => 
        v.lang.toLowerCase().includes('en-gb') && 
        (v.name.includes('Female') || v.name.includes('Serena') || v.name.includes('Susan') || v.name.includes('Hazel') || v.name.includes('Kate'))
      ) || voices.find(v => 
        v.lang.toLowerCase().includes('en-gb')
      ) || voices.find(v => 
        v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female')
      );
      if (gentleVoice) utterance.voice = gentleVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[40px] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border-b-8 border-green-400 overflow-y-auto max-h-[95vh]"
      >
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-6">
          <div className="bg-green-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-5xl relative group">
            {reward.icon}
            <button 
              onClick={speak}
              className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg text-green-600 hover:scale-110 transition-transform"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Do You All Agree?</h2>
              <p className="text-slate-500 font-bold mt-2">Everyone must tap their critter to agree to buy <span className="text-slate-800 italic">"{reward.title}"</span> together!</p>
            </div>

            <div className="bg-emerald-50 rounded-3xl p-6 border-b-4 border-emerald-200">
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Total Reward Cost</span>
                <div className="flex items-center gap-2">
                   <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                   <span className="text-5xl font-black text-emerald-700">{reward.cost}</span>
                </div>
              </div>
              
              <div className="h-px bg-emerald-200/50 w-full mb-4" />
              
              <div className="flex justify-between items-center bg-white/60 rounded-2xl p-4 border border-emerald-100">
                <div className="flex flex-col text-left">
                  <span className="text-slate-600 font-black text-xs">Stars Per Person</span>
                  <p className="text-[10px] text-slate-400 font-bold italic">Split between {kids.length} kids</p>
                </div>
                <span className="text-emerald-700 font-black text-2xl">
                  {Math.ceil(reward.cost / (kids.length || 1))}
                </span>
              </div>
              
              <p className="text-[10px] text-emerald-600 font-black mt-4 text-center">
                ✨ Your family star total will go down by {reward.cost} stars when you buy this!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-[32px] border-2 border-slate-100">
            {kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => toggleKid(kid.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all border-2 ${
                  agreedKids.has(kid.id) 
                    ? 'bg-white border-green-400 shadow-md ring-4 ring-green-50' 
                    : 'bg-transparent border-transparent opacity-60'
                }`}
              >
                <div className="text-2xl bg-white w-10 h-10 flex items-center justify-center rounded-xl shadow-sm">
                  {kid.avatar}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agree?</p>
                  <p className="font-black text-slate-800 text-xs">{kid.name}</p>
                </div>
                {agreedKids.has(kid.id) && <Check className="w-5 h-5 text-green-500" />}
              </button>
            ))}
          </div>

          <button
            disabled={!allAgreed}
            onClick={onConfirm}
            className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2 ${
              allAgreed 
                ? 'bg-green-600 text-white hover:bg-green-700 active:translate-y-1 active:shadow-none' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {allAgreed ? <Sparkles className="w-5 h-5" /> : null}
            {allAgreed ? 'Buy This Reward!' : 'Waiting for Everyone...'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const HabitatBackground = ({ habitat }: { habitat: 'picker' | 'family' }) => {
  const getStyles = () => {
    switch (habitat) {
      case 'family':
        return {
          gradient: 'from-emerald-800 to-green-950',
          pattern: (
            <div className="absolute inset-0 pointer-events-none opacity-20">
               {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -10, 0],
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 8 + Math.random() * 4, 
                      repeat: Infinity,
                      delay: Math.random() * 4
                    }}
                    className="absolute text-5xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  >
                    {['🌳', '🌲', '🍃', '✨', '🏰'][Math.floor(Math.random() * 5)]}
                  </motion.div>
               ))}
            </div>
          )
        };
      case 'picker':
        return {
          gradient: 'from-slate-800 via-slate-900 to-slate-950',
          pattern: (
             <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <Sparkles className="w-full h-full text-white/5 blur-sm" />
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

export default function FamilyChoreChart() {
  const { getCollectionName, mode, workspaceId, familyName } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const shopRef = useRef<HTMLDivElement>(null);
  const [kids, setKids] = useState<Kid[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const unsubKids = onSnapshot(collection(db, getCollectionName('kids')), (snapshot) => {
      const kidsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Kid));
      setKids(kidsList.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    const unsubChores = onSnapshot(collection(db, getCollectionName('chores')), (snapshot) => {
      setChores(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chore)));
    });
    const unsubRewards = onSnapshot(collection(db, getCollectionName('rewards')), (snapshot) => {
      setRewards(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Reward)));
    });
    const unsubTasks = onSnapshot(
      query(collection(db, getCollectionName('tasks')), where('dueDate', '==', todayStr)),
      (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaskInstance)));
      }
    );
    const unsubFulfill = onSnapshot(
      query(collection(db, getCollectionName('fulfillments')), where('kidId', '==', 'family')),
      (snapshot) => {
        setFulfillments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fulfillment)));
      }
    );

    return () => {
      unsubKids();
      unsubChores();
      unsubRewards();
      unsubTasks();
      unsubFulfill();
    };
  }, [getCollectionName]);

  const validTasks = useMemo(() => {
    return tasks.filter(t => chores.some(c => c.id === t.choreId) || t.status === 'completed' || !!t.choreTitle);
  }, [tasks, chores]);

  const visibleTasks = (kidId: string) => {
    const kidTasks = validTasks.filter(t => t.kidId === kidId);
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

    const requiredTasks = kidTasks.filter(t => !isBonusTask(t));
    const allRequiredCompleted = requiredTasks.length > 0 && requiredTasks.every(t => t.status === 'completed');
    
    if (allRequiredCompleted || requiredTasks.length === 0) {
      return kidTasks;
    }
    return requiredTasks;
  };

  useEffect(() => {
    if (location.state?.scrollTo === 'family-shop' && shopRef.current) {
      setTimeout(() => {
        shopRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.state]);

  const redeemFamilyReward = async (reward: Reward) => {
    if (kids.length === 0) return;
    const totalStars = kids.reduce((acc, k) => acc + (k.stars || 0), 0);
    
    if (totalStars < reward.cost) {
      alert(`Oops! You need ${reward.cost - totalStars} more stars to get the "${reward.title}" together! 🚀`);
      return;
    }

    setSelectedReward(reward);
  };

  const handleFinalPurchase = async () => {
    if (!selectedReward) return;
    const reward = selectedReward;

    try {
      const batch = writeBatch(db);
      const numKids = kids.length;
      const baseShare = Math.floor(reward.cost / numKids);
      const remainder = reward.cost % numKids;

      kids.forEach((kid, index) => {
        const share = baseShare + (index < remainder ? 1 : 0);
        const newStars = Math.max(0, (kid.stars || 0) - share);
        batch.update(doc(db, getCollectionName('kids'), kid.id), { stars: newStars });
        
        // Log transaction for each kid
        const transRef = doc(collection(db, getCollectionName('transactions')));
        batch.set(transRef, {
          kidId: kid.id,
          amount: -share,
          type: 'spend',
          description: `Family Reward: ${reward.title}`,
          timestamp: serverTimestamp()
        });
      });

      // Create Fulfillment record
      const fulfillRef = doc(collection(db, getCollectionName('fulfillments')));
      batch.set(fulfillRef, {
        kidId: 'family',
        rewardId: reward.id,
        rewardTitle: reward.title,
        rewardIcon: reward.icon,
        cost: reward.cost,
        type: 'family',
        status: 'pending',
        purchasedAt: new Date().toISOString()
      });

      await batch.commit();
      setSelectedReward(null);
      alert(`Hooray! The family request for "${reward.title}" is in! 🏰`);
    } catch (e) {
      console.error("Error redeeming family reward:", e);
      alert("Something went wrong. Please try again!");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)]">
      <HabitatBackground habitat="family" />
      
      <div className="relative z-10 space-y-10 animate-in fade-in duration-700 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/90 backdrop-blur-md rounded-[40px] p-8 shadow-md border-b-8 border-green-500 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Family Chore Board</h1>
            {mode === 'demo' && (
              <span className="text-[10px] bg-yellow-400 text-slate-900 px-3 py-1 rounded-full animate-pulse border-b-2 border-yellow-600 font-black">DEMO</span>
            )}
            {workspaceId && mode === 'live' && (
              <span className="text-[10px] bg-green-400 text-slate-900 px-3 py-1 rounded-full border-b-2 border-green-600 font-black uppercase tracking-widest">{familyName || `Family ${workspaceId}`}</span>
            )}
            {!workspaceId && mode === 'live' && (
              <span className="text-[10px] bg-blue-400 text-white px-3 py-1 rounded-full border-b-2 border-blue-600 font-black">MAIN CHART</span>
            )}
          </div>
          <p className="text-slate-500 font-bold">Today is {format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-6 py-3 rounded-2xl border-2 border-green-100 shadow-sm shrink-0">
           <Star className="w-6 h-6 text-green-500 fill-green-500" />
           <span className="text-2xl font-black text-slate-800">
             {kids.reduce((acc, k) => acc + (k.stars || 0), 0)} Total Stars
           </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {kids.map(kid => (
          <motion.div
            key={kid.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderBottomColor: kid.color }}
            className="flex flex-col bg-white rounded-[50px] overflow-hidden shadow-xl border-b-8 group"
          >
            <div 
              className="p-8 flex items-center justify-between cursor-pointer transition-colors"
              style={{ backgroundColor: `${kid.color}05` }}
              onClick={() => navigate(`/kids/${kid.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl bg-white w-20 h-20 flex items-center justify-center rounded-3xl shadow-inner group-hover:scale-110 transition-transform">
                  {kid.avatar}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{kid.name}</h2>
                  <div 
                    style={{ color: kid.color }}
                    className="flex items-center gap-1 font-black"
                  >
                    <Star className="w-4 h-4 fill-current" />
                    {kid.stars}
                  </div>
                </div>
              </div>
              <ChevronRight 
                style={{ color: kid.color }}
                className="w-8 h-8 opacity-40 transition-opacity" 
              />
            </div>

            <div className="px-8 pb-8 flex-1 space-y-3">
               <div 
                style={{ backgroundColor: `${kid.color}15` }}
                className="h-1 mb-4 rounded-full"
               ></div>
               {(() => {
                 const currentVisibleTasks = visibleTasks(kid.id);
                 return (
                   <>
                     {currentVisibleTasks.slice(0, 4).map(task => {
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
                         <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-transparent">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-xl shrink-0">{chore?.icon || '✨'}</span>
                              <span className={`text-sm font-bold truncate ${task.status === 'completed' ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                                {chore?.title}
                              </span>
                            </div>
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-slate-200 rounded-full"></div>
                            )}
                         </div>
                       );
                     })}
                     {currentVisibleTasks.length > 4 && (
                       <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">+ {currentVisibleTasks.length - 4} more</p>
                     )}
                     {currentVisibleTasks.length === 0 && (
                       <p className="text-center py-4 text-slate-300 font-bold italic">No tasks yet!</p>
                     )}
                   </>
                 );
               })()}
            </div>

            <button 
              onClick={() => navigate(`/kids/${kid.id}`)}
              style={{ backgroundColor: kid.color }}
              className="m-6 text-white font-black py-4 rounded-3xl shadow-lg hover:brightness-110 active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest text-sm"
            >
              Enter {kid.name}'s World
            </button>
          </motion.div>
        ))}

        {kids.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
             <div className="text-6xl opacity-20">🦁</div>
             <p className="text-slate-400 font-black uppercase tracking-widest">Go to Parent Mode to add your first kid!</p>
          </div>
        )}
      </div>

      <div 
        ref={shopRef}
        className="bg-emerald-950 rounded-[50px] p-10 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 text-emerald-800">
          <Gift className="w-40 h-40" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-500 p-3 rounded-2xl">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Family Shop</h2>
              <p className="text-emerald-400/60 font-bold uppercase tracking-widest text-xs">Redeem your hard-earned stars!</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {rewards.filter(r => (r.type || 'kid') === 'family').sort((a,b) => (a.cost || 0) - (b.cost || 0)).map(reward => {
              const numKids = kids.length || 1;
              const baseShare = Math.floor(reward.cost / numKids);
              const remainder = reward.cost % numKids;
              const canAfford = kids.length > 0 && kids.every((k, idx) => (k.stars || 0) >= (baseShare + (idx < remainder ? 1 : 0)));

              return (
                <div 
                  key={reward.id} 
                  className={`backdrop-blur-sm border-2 p-6 rounded-[32px] flex flex-col items-center text-center gap-3 group transition-all cursor-pointer ${
                    canAfford 
                      ? 'bg-white/5 border-white/10 hover:border-emerald-400' 
                      : 'bg-emerald-950/20 border-white/5 opacity-50 grayscale pointer-events-none'
                  }`}
                  onClick={() => canAfford && redeemFamilyReward(reward)}
                >
                  <div className={`text-5xl mb-2 transition-transform ${canAfford ? 'group-hover:scale-125' : ''}`}>{reward.icon}</div>
                  <h3 className={`font-black text-sm uppercase tracking-tight leading-tight ${canAfford ? 'text-white' : 'text-white/30'}`}>{reward.title}</h3>
                  <div className={`flex items-center gap-1 font-black text-xs ${canAfford ? 'text-emerald-400' : 'text-emerald-900'}`}>
                    <Star className={`w-3 h-3 ${canAfford ? 'fill-emerald-400' : 'fill-emerald-900'}`} />
                    {reward.cost}
                  </div>
                </div>
              );
            })}
            {rewards.filter(r => (r.type || 'kid') === 'family').length === 0 && (
               <div className="col-span-full py-10 text-center text-slate-500 font-bold italic">
                 No family rewards added yet. Ask a parent!
               </div>
            )}
          </div>

          {fulfillments.filter(f => f.status === 'pending').length > 0 && (
            <div className="mt-12 bg-emerald-900/20 p-8 rounded-[40px] border-4 border-dashed border-emerald-800/30">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-4 h-4 ml-2" />
                Purchased & Waiting
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fulfillments
                  .filter(f => f.status === 'pending')
                  .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
                  .map(f => (
                  <div key={f.id} className="bg-emerald-950/80 backdrop-blur-md p-5 rounded-3xl border-2 border-emerald-500/20 shadow-xl flex items-center gap-4">
                    <div className="text-3xl bg-emerald-500/20 w-14 h-14 flex items-center justify-center rounded-2xl">{f.rewardIcon}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-white text-base leading-tight">{f.rewardTitle}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Awaiting Parent
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fulfillments.filter(f => f.status === 'filled').length > 0 && (
            <div className="mt-12 bg-emerald-900/20 p-8 rounded-[40px] border border-emerald-400/20">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-emerald-600/60 text-center">
                Recently Enjoyed Rewards
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {fulfillments
                  .filter(f => f.status === 'filled')
                  .sort((a, b) => new Date(b.filledAt || '').getTime() - new Date(a.filledAt || '').getTime())
                  .slice(0, 5)
                  .map(f => (
                  <div key={f.id} className="bg-white/5 px-6 py-4 rounded-full border border-white/10 flex items-center gap-3">
                    <span className="text-2xl">{f.rewardIcon}</span>
                    <div className="text-left">
                      <p className="font-black text-emerald-200 text-xs leading-none">{f.rewardTitle}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                        {f.filledAt ? format(new Date(f.filledAt), 'MMM d') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {selectedReward && (
            <AgreementModal
              reward={selectedReward}
              kids={kids}
              onConfirm={handleFinalPurchase}
              onCancel={() => setSelectedReward(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
);
}
