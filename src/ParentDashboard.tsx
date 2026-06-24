import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp, where, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Kid, Chore, Reward, TaskInstance, Frequency, CategoryOrder, Fulfillment } from '../types';
import { useWorkspace } from './WorkspaceContext';
import { ANIMAL_AVATARS, COLORS, CHORE_ICONS, SUGGESTED_ICONS, REWARD_ICONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Star, Gift, LayoutDashboard, PlusCircle, UserPlus, Info, ShieldCheck, Sparkles, Pencil, GripVertical, Check, X, CheckCircle, ArrowLeft, ArrowRight, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function ParentDashboard() {
  const { mode, workspaceId, familyName, setWorkspace, getCollectionName } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'kids' | 'chores' | 'rewards' | 'history'>('kids');
  const [kids, setKids] = useState<Kid[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [passcode, setPasscode] = useState('');
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [correctPasscode, setCorrectPasscode] = useState('1234');
  const [loginView, setLoginView] = useState<'main' | 'existing' | 'create'>('main');
  const [error, setError] = useState('');

  useEffect(() => {
    // Always use the "main" config for auth passcode (default account)
    const unsubAuth = onSnapshot(doc(db, 'config', 'auth'), (docSnap) => {
      if (docSnap.exists()) {
        setCorrectPasscode(docSnap.data().passcode);
      }
    });

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

    const unsubFulfill = onSnapshot(collection(db, getCollectionName('fulfillments')), (snapshot) => {
      setFulfillments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fulfillment)));
    });

    return () => {
      unsubAuth();
      unsubKids();
      unsubChores();
      unsubRewards();
      unsubFulfill();
    };
  }, [getCollectionName]);

  const handlePasscodeChange = async (val: string) => {
    setPasscode(val);
    setError('');
    if (val.length === 4) {
      if (val === '1234') {
        setWorkspace('demo', null, 'Demo');
        setIsUnlocked(true);
      } else if (val === correctPasscode) {
        setWorkspace('live', null, 'Main'); // Default workspace
        setIsUnlocked(true);
      } else {
        // Check if it's a dynamic workspace
        try {
          const workspaceSnap = await getDoc(doc(db, `ws_${val}_config`, 'auth'));
          if (workspaceSnap.exists()) {
            const data = workspaceSnap.data();
            setWorkspace('live', val, data.familyName || `Family ${val}`);
            setIsUnlocked(true);
          } else {
            setError('Invalid passcode. Try "1234" for demo.');
          }
        } catch (e) {
          setError('Error checking passcode.');
        }
      }
    }
  };

  const handleCreateNew = async () => {
    if (passcode.length !== 4) return;
    if (!familyNameInput.trim()) {
      setError('Please enter a Family Name.');
      return;
    }
    if (passcode === '1234' || passcode === correctPasscode) {
      setError('This passcode is already taken.');
      return;
    }
    
    try {
      const existingSnap = await getDoc(doc(db, `ws_${passcode}_config`, 'auth'));
      if (existingSnap.exists()) {
        setError('This passcode is already taken.');
        return;
      }

      await setDoc(doc(db, `ws_${passcode}_config`, 'auth'), { 
        passcode: passcode, 
        familyName: familyNameInput.trim(),
        createdAt: new Date().toISOString(),
        isNew: true 
      });
      
      setWorkspace('live', passcode, familyNameInput.trim());
      setIsUnlocked(true);
    } catch (e) {
      setError('Could not create account.');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[50px] shadow-2xl border-b-8 border-slate-100 max-w-sm w-full text-center space-y-8"
        >
           <div className="bg-slate-900 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl">
              <ShieldCheck className="w-10 h-10" />
           </div>
           
           <AnimatePresence mode="wait">
             {loginView === 'main' && (
               <motion.div
                 key="main"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="space-y-6"
               >
                 <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Access Hub</h2>
                 <div className="flex flex-col gap-3">
                   <button 
                    onClick={() => { setWorkspace('demo'); setIsUnlocked(true); }}
                    className="w-full py-4 bg-yellow-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all border-b-4 border-yellow-600"
                   >
                     <Sparkles className="w-4 h-4" />
                     Load Demo Mode
                   </button>
                   <button 
                    onClick={() => setLoginView('existing')}
                    className="w-full py-4 bg-slate-100 text-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all border-b-4 border-slate-200"
                   >
                     Existing Family Account
                   </button>
                   <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">or</p>
                   <button 
                    onClick={() => setLoginView('create')}
                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-600 transition-all border-b-4 border-green-700"
                   >
                     Create New Family Chart
                   </button>
                 </div>
               </motion.div>
             )}

             {(loginView === 'existing' || loginView === 'create') && (
               <motion.div
                 key="login"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                 <div>
                   <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                     {loginView === 'create' ? 'Create Your Account' : 'Enter Passcode'}
                   </h2>
                   <p className="text-slate-400 text-[10px] font-bold uppercase mt-2">
                     {loginView === 'create' ? 'Pick a name and 4-digit code' : 'Enter your 4-digit parent code'}
                   </p>
                 </div>

                 {loginView === 'create' && (
                   <div className="space-y-4">
                     <div className="text-left px-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Family Name</label>
                       <input 
                         type="text"
                         value={familyNameInput}
                         onChange={(e) => setFamilyNameInput(e.target.value)}
                         placeholder="e.g., The Robinsons"
                         className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-green-400 outline-none font-bold text-slate-800 placeholder:text-slate-300"
                        />
                     </div>
                     <div className="text-left px-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">4-Digit Passcode</label>
                     </div>
                   </div>
                 )}
                 
                 <div className="relative group mx-auto max-w-[280px]">
                   <div className="flex justify-between gap-3">
                     {[0, 1, 2, 3].map((i) => (
                       <motion.div
                         key={i}
                         animate={{
                           scale: passcode.length === i ? 1.05 : 1,
                           borderColor: passcode.length === i ? '#64748b' : '#f1f5f9'
                         }}
                         className={`w-14 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-black transition-all ${
                           passcode.length > i 
                             ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                             : 'bg-slate-50 text-slate-200'
                         }`}
                       >
                         {passcode.length > i ? '●' : ''}
                       </motion.div>
                     ))}
                   </div>
                   
                   <input 
                     type="text"
                     inputMode="numeric"
                     pattern="[0-9]*"
                     maxLength={4}
                     value={passcode}
                     onChange={(e) => {
                       const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                       if (loginView === 'existing') handlePasscodeChange(val);
                       else {
                         setPasscode(val);
                       }
                     }}
                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full caret-transparent"
                     autoFocus
                   />
                 </div>

                 {loginView === 'create' && (
                   <button 
                    onClick={handleCreateNew}
                    disabled={passcode.length !== 4 || !familyNameInput.trim()}
                    className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-600 transition-all border-b-4 border-green-700 disabled:opacity-50"
                   >
                     Create Account
                   </button>
                 )}

                 {error && (
                   <motion.p 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="text-red-500 text-[10px] font-black uppercase"
                   >
                     {error}
                   </motion.p>
                 )}

                 <button 
                   onClick={() => { setLoginView('main'); setPasscode(''); setError(''); }}
                   className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mx-auto font-black text-[10px] uppercase tracking-widest"
                 >
                   <ArrowLeft className="w-3 h-3" />
                   Back to menu
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase flex items-center flex-wrap gap-4">
            Parent Hub
            {mode === 'demo' && (
              <span className="text-[10px] bg-yellow-400 text-slate-900 px-3 py-1 rounded-full animate-pulse border-b-2 border-yellow-600">DEMO MODE</span>
            )}
            {workspaceId && mode === 'live' && (
              <span className="text-[10px] bg-green-400 text-slate-900 px-3 py-1 rounded-full border-b-2 border-green-600 uppercase tracking-widest">{familyName || `Family ${workspaceId}`}</span>
            )}
            {!workspaceId && mode === 'live' && (
              <span className="text-[10px] bg-blue-400 text-white px-3 py-1 rounded-full border-b-2 border-blue-600">MAIN CHART</span>
            )}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-300 font-medium whitespace-nowrap">
              {mode === 'demo' 
                ? "Playing with samples" 
                : "Manage your little champs"}
            </p>
            <button 
              onClick={() => { setIsUnlocked(false); setLoginView('main'); setPasscode(''); setWorkspace('live', null); }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-lg flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Switch Account
            </button>
          </div>
        </div>
        
        <nav className="flex bg-white rounded-3xl p-2 shadow-sm border-b-4 border-slate-100 overflow-x-auto no-scrollbar">
          {[
            { id: 'kids', icon: UserPlus, label: 'Kids' },
            { id: 'chores', icon: LayoutDashboard, label: 'Chores' },
            { id: 'rewards', icon: Gift, label: 'Rewards' },
            { id: 'history', icon: ShieldCheck, label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'kids' | 'chores' | 'rewards' | 'history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-md transform -translate-y-0.5' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'kids' && <KidsList kids={kids} setKids={setKids} />}
          {activeTab === 'chores' && <ChoresList chores={chores} kids={kids} />}
          {activeTab === 'rewards' && <RewardsList rewards={rewards} kids={kids} fulfillments={fulfillments} />}
          {activeTab === 'history' && <HistoryTracker kids={kids} chores={chores} fulfillments={fulfillments} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HistoryTracker({ kids, chores, fulfillments }: { kids: Kid[], chores: Chore[], fulfillments: Fulfillment[] }) {
  const { getCollectionName, workspaceId } = useWorkspace();
  const [historyTasks, setHistoryTasks] = useState<TaskInstance[]>([]);
  const [newPasscode, setNewPasscode] = useState('');
  const [currentPasscode, setCurrentPasscode] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, getCollectionName('tasks')), where('dueDate', '==', today)),
      (snapshot) => {
        setHistoryTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaskInstance)));
      }
    );

    const unsubAuth = onSnapshot(doc(db, getCollectionName('config'), 'auth'), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentPasscode(docSnap.data().passcode);
      } else {
        setCurrentPasscode(workspaceId || '1234');
      }
    });

    return () => {
      unsub();
      unsubAuth();
    };
  }, [getCollectionName, today, workspaceId]);

  const updatePasscode = async () => {
    if (newPasscode.length !== 4 || !/^\d+$/.test(newPasscode)) {
      alert('Passcode must be 4 digits!');
      return;
    }
    if (newPasscode === '1234') {
      alert('1234 is reserved for demo mode. Please pick a different passcode.');
      return;
    }
    try {
      await setDoc(doc(db, getCollectionName('config'), 'auth'), { passcode: newPasscode });
      alert('Passcode updated successfully!');
      setNewPasscode('');
    } catch (e) {
      console.error(e);
      alert('Failed to update passcode.');
    }
  };

  const undoTask = async (task: TaskInstance) => {
    if (!confirm('Revert this task? Stars will be removed from the kid.')) return;
    try {
      const batch = writeBatch(db);
      const kid = kids.find(k => k.id === task.kidId);
      if (!kid) return;

      batch.update(doc(db, getCollectionName('tasks'), task.id), {
        status: 'pending',
        completedAt: null
      });
      batch.update(doc(db, getCollectionName('kids'), task.kidId), {
        stars: (kid.stars || 0) - task.pointsValue
      });
      
      const transRef = doc(collection(db, getCollectionName('transactions')));
      batch.set(transRef, {
        kidId: task.kidId,
        amount: -task.pointsValue,
        type: 'penalty',
        description: `Reverted: ${chores.find(c => c.id === task.choreId)?.title || 'Chore'}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[40px] p-8 shadow-md border-b-8 border-slate-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-slate-900 p-3 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Security Settings</h2>
        </div>
        
        <div className="max-w-md space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200">
            <label className="text-xs font-black uppercase tracking-widest text-slate-600 block mb-4">Change Parent Passcode</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="0 0 0 0"
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 focus:border-slate-800 outline-none font-black text-xl tracking-widest text-slate-900 placeholder:text-slate-300"
                />
              </div>
              <button
                onClick={updatePasscode}
                disabled={newPasscode.length !== 4}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-all shadow-lg active:translate-y-1"
              >
                Update
              </button>
            </div>
            <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
              Current passcode: <span className="text-slate-900 bg-yellow-100 px-2 py-0.5 rounded-md font-black">{currentPasscode}</span>. Be careful! Don't lock yourself out.
            </p>
          </div>
        </div>
      </div>

      {fulfillments.filter(f => f.status === 'filled').length > 0 && (
        <div className="bg-white rounded-[40px] p-8 shadow-md border-b-8 border-slate-200">
          <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-slate-900">Spent Rewards</h2>
          <div className="space-y-4">
            {fulfillments
              .filter(f => f.status === 'filled')
              .sort((a, b) => new Date(b.filledAt || '').getTime() - new Date(a.filledAt || '').getTime())
              .slice(0, 10)
              .map(f => {
                const kid = kids.find(k => k.id === f.kidId);
                return (
                  <div key={f.id} className="flex items-center justify-between p-4 bg-green-50 rounded-3xl border-2 border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm">{f.rewardIcon}</div>
                      <div>
                        <p className="font-black text-slate-800">
                          {f.kidId === 'family' ? 'Family' : kid?.name} enjoyed <span className="text-green-600">{f.rewardTitle}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          Redeemed {f.filledAt ? format(new Date(f.filledAt), 'MMM d, hh:mm a') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 font-black text-xs bg-white px-3 py-1 rounded-full shadow-sm">
                      <Star className="w-3 h-3 fill-green-400" />
                      {f.cost}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] p-8 shadow-md border-b-8 border-slate-200">
        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight text-slate-900">Today's Activity</h2>
        <div className="space-y-4">
          {historyTasks.filter(t => t.status === 'completed').map(task => {
            const kid = kids.find(k => k.id === task.kidId);
            const chore = chores.find(c => c.id === task.choreId);
            return (
              <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border-2 border-transparent">
                <div className="flex items-center gap-4">
                  <span className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm">{kid?.avatar}</span>
                  <div>
                    <p className="font-black text-slate-800">{kid?.name} completed <span className="text-indigo-600">{chore?.title}</span></p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{task.completedAt ? format(new Date(task.completedAt), 'hh:mm a') : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => undoTask(task)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-black hover:bg-red-200 transition-colors uppercase"
                >
                  Undo
                </button>
              </div>
            );
          })}
          {historyTasks.filter(t => t.status === 'completed').length === 0 && (
            <div className="text-center py-12 text-slate-500">
               <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
               <p className="font-bold">No activity yet today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KidsList({ kids, setKids }: { kids: Kid[], setKids: React.Dispatch<React.SetStateAction<Kid[]>> }) {
  const { getCollectionName } = useWorkspace();
  const [showModal, setShowModal] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(ANIMAL_AVATARS[0]);
  const [stars, setStars] = useState<number | string>(0);
  const [color, setColor] = useState(COLORS[0]);
  const [isNonReader, setIsNonReader] = useState(false);
  const [stickerValue, setStickerValue] = useState(5);

  const openAdd = () => {
    setEditingKid(null);
    setName('');
    setAvatar(ANIMAL_AVATARS[0]);
    setStars('');
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setIsNonReader(false);
    setStickerValue(5);
    setShowModal(true);
  };

  const openEdit = (kid: Kid) => {
    setEditingKid(kid);
    setName(kid.name);
    setAvatar(kid.avatar);
    setStars(kid.stars || 0);
    setColor(kid.color || COLORS[0]);
    setIsNonReader(!!kid.isNonReader);
    setStickerValue(kid.stickerValue || 5);
    setShowModal(true);
  };

  const adjustStars = async (kid: Kid, amount: number) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, getCollectionName('kids'), kid.id), {
        stars: (kid.stars || 0) + amount
      });
      const transRef = doc(collection(db, getCollectionName('transactions')));
      batch.set(transRef, {
        kidId: kid.id,
        amount: amount,
        type: amount > 0 ? 'bonus' : 'penalty',
        description: 'Manual adjustment by parent',
        timestamp: serverTimestamp()
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const saveKid = async () => {
    if (!name.trim()) return;
    const finalStars = stars === '' ? (editingKid?.stars || 0) : Number(stars);
    try {
      if (editingKid) {
        const batch = writeBatch(db);
        batch.update(doc(db, getCollectionName('kids'), editingKid.id), {
          name,
          avatar,
          color,
          stars: finalStars,
          isNonReader,
          stickerValue: Number(stickerValue),
        });
        
        // If stars were changed manually in the modal, we might want a transaction, 
        // but for simplicity here we just update the total.
        await batch.commit();
      } else {
        const maxOrder = kids.reduce((max, k) => Math.max(max, k.order || 0), -1);
        await addDoc(collection(db, getCollectionName('kids')), {
          name,
          avatar,
          stars: finalStars,
          color,
          isNonReader,
          stickerValue: Number(stickerValue),
          order: maxOrder + 1,
          createdAt: new Date().toISOString()
        });
      }
      setShowModal(false);
    } catch (e) {
      console.error('Error saving kid:', e);
      const errMessage = e instanceof Error ? e.message : String(e);
      if (errMessage.includes('permission-denied')) {
        alert('Firestore Permission Denied. Please check security rules.');
      }
    }
  };

  const addDemoData = async () => {
    try {
      const batch = writeBatch(db);
      
      const sampleKids = [
        { name: 'Oliver', avatar: '🐉', stars: 125, color: COLORS[0] },
        { name: 'Luna', avatar: '🦄', stars: 85, color: COLORS[1] },
        { name: 'Felix', avatar: '🐱', stars: 40, color: COLORS[2] }
      ];

      for (let i = 0; i < sampleKids.length; i++) {
        const kid = sampleKids[i];
        const kidRef = doc(collection(db, getCollectionName('kids')));
        batch.set(kidRef, { ...kid, createdAt: new Date().toISOString() });
        
        const choreRef = doc(collection(db, getCollectionName('chores')));
        batch.set(choreRef, {
          title: `Daily Reading for ${kid.name}`,
          points: 10,
          frequency: 'daily',
          assignedTo: [kidRef.id],
          active: true,
          order: 0,
          category: 'School',
          createdAt: new Date().toISOString()
        });
      }

      const kitchenRef = doc(collection(db, getCollectionName('chores')));
      batch.set(kitchenRef, {
        title: 'Clear Kitchen Table',
        points: 5,
        frequency: 'daily',
        assignedTo: [],
        active: true,
        order: 1,
        category: 'Housework',
        createdAt: new Date().toISOString()
      });

      const rewards = [
        { title: 'Ice Cream Party', cost: 50, icon: '🍦', active: true, type: 'family', order: 0 },
        { title: 'Movie Night', cost: 100, icon: '🎬', active: true, type: 'family', order: 1 },
        { title: 'New Small Toy', cost: 200, icon: '🧸', active: true, type: 'kid', allowedKids: [], order: 0 }
      ];

      for (let i = 0; i < rewards.length; i++) {
        batch.set(doc(collection(db, getCollectionName('rewards'))), { ...rewards[i], order: i });
      }

      batch.set(doc(db, getCollectionName('config'), 'categories'), { categories: ['School', 'Housework'] });

      await batch.commit();
      alert('Demo data added successfully!');
    } catch (e) {
      console.error('Error adding demo data:', e);
      alert('Failed to add demo data. Check console.');
    }
  };

  const deleteKid = async (id: string) => {
    try {
      await deleteDoc(doc(db, getCollectionName('kids'), id));
    } catch (e) {
      console.error(e);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reorderedKids = Array.from(kids);
    const [removed] = reorderedKids.splice(source.index, 1);
    reorderedKids.splice(destination.index, 0, removed);

    // Update state locally first for immediate feedback
    setKids(reorderedKids);

    // Update in Firestore
    const batch = writeBatch(db);
    reorderedKids.forEach((kid, index) => {
      batch.update(doc(db, getCollectionName('kids'), kid.id), { order: index });
    });

    try {
      await batch.commit();
    } catch (e) {
      console.error("Failed to update kids order:", e);
    }
  };

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="kids-list" direction="horizontal">
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <button
                onClick={openAdd}
                className="flex flex-col items-center justify-center gap-4 h-64 border-4 border-dashed border-slate-200 rounded-[40px] text-slate-600 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 transition-all group"
              >
                <div className="p-4 bg-slate-50 rounded-3xl group-hover:bg-yellow-100 transition-colors">
                  <UserPlus className="w-12 h-12" />
                </div>
                <span className="text-xl font-black uppercase tracking-tight">Add New Kid</span>
              </button>

              {kids.length === 0 && (
                <button
                  onClick={addDemoData}
                  className="flex flex-col items-center justify-center gap-4 h-64 border-4 border-dashed border-blue-200 rounded-[40px] text-blue-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="p-4 bg-blue-50 rounded-3xl group-hover:bg-blue-100 transition-colors">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <span className="text-xl font-black uppercase tracking-tight">Load Demo Data</span>
                </button>
              )}

              {kids.map((kid, index) => (
                // @ts-expect-error - dnd key prop mismatch
                <Draggable key={kid.id} draggableId={kid.id} index={index}>
                  {(provided, snapshot) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      layout
                      style={{ 
                        borderBottomColor: kid.color,
                        ...provided.draggableProps.style 
                      }}
                      className={`bg-white rounded-[40px] p-8 shadow-md border-b-8 relative group ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-yellow-400/50 scale-105 z-50' : ''}`}
                    >
                      <div {...provided.dragHandleProps} className="absolute top-6 left-6 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl p-6 bg-slate-50 rounded-[2rem] group-hover:scale-110 transition-transform shadow-inner">
                          {kid.avatar}
                        </div>
                        <div className="text-center">
                          <h3 className="text-2xl font-black text-slate-800">{kid.name}</h3>
                          <div className="mt-2 flex items-center justify-center gap-4">
                            <div 
                              style={{ backgroundColor: `${kid.color}15`, color: kid.color, borderColor: `${kid.color}30` }}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-full font-black border"
                            >
                              <Star className="w-4 h-4 fill-current" />
                              {kid.stars}
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => adjustStars(kid, 5)}
                                className="w-10 h-10 rounded-2xl bg-green-500 text-white text-xs font-black hover:bg-green-600 shadow-[0_3px_0_rgb(21,128,61)] active:translate-y-0.5 active:shadow-none transition-all"
                              >
                                +5
                              </button>
                              <button 
                                onClick={() => adjustStars(kid, -5)}
                                className="w-10 h-10 rounded-2xl bg-red-500 text-white text-xs font-black hover:bg-red-600 shadow-[0_3px_0_rgb(185,28,28)] active:translate-y-0.5 active:shadow-none transition-all"
                              >
                                -5
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-6 right-6 flex gap-2 transition-opacity">
                        <button onClick={() => openEdit(kid)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-full">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteKid(kid.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-full">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl relative max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-8 pb-4 text-center">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                  {editingKid ? 'Edit Kid Profile' : 'New Kid Profile'}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto px-10 pb-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Kid's Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name..."
                      className="w-full px-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all outline-none text-xl font-bold text-slate-900"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Star Balance</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stars}
                        onChange={(e) => setStars(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-6 py-5 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all outline-none text-xl font-bold pl-12 text-slate-900"
                      />
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block text-center">Choose an Animal Avatar</label>
                  <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-inner max-h-48 overflow-y-auto no-scrollbar">
                    {ANIMAL_AVATARS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setAvatar(av)}
                        className={`text-4xl p-2 rounded-2xl transition-all ${avatar === av ? 'bg-white scale-125 shadow-md border-2' : 'hover:scale-110 grayscale-[0.5] hover:grayscale-0 opacity-60 hover:opacity-100'}`}
                        style={avatar === av ? { borderColor: color } : {}}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block text-center">Profile Theme Color</label>
                   <div className="flex flex-wrap justify-center gap-3 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-inner">
                     {COLORS.map((c) => (
                       <button
                         key={c}
                         onClick={() => setColor(c)}
                         className={`w-12 h-12 rounded-2xl transition-all relative ${color === c ? 'scale-125 shadow-lg border-4 border-white' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                         style={{ backgroundColor: c }}
                       >
                         {color === c && (
                           <div className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 border-2 border-white shadow-sm">
                             <Check className="w-3 h-3" />
                           </div>
                         )}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Non-Reader Mode (Under 5)</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Kids under 5 use "stickers" instead of points</p>
                    </div>
                    <button
                      onClick={() => setIsNonReader(!isNonReader)}
                      className={`w-16 h-8 rounded-full p-1 transition-colors ${isNonReader ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isNonReader ? 'translate-x-8' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {isNonReader && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t-2 border-slate-200 mt-4 pt-6 space-y-4"
                    >
                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Value Per Sticker</label>
                        <select
                          value={stickerValue}
                          onChange={(e) => setStickerValue(Number(e.target.value))}
                          className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 focus:border-green-400 outline-none font-bold text-slate-800"
                        >
                          <option value={1}>1 Point per Sticker</option>
                          <option value={2}>2 Points per Sticker</option>
                          <option value={5}>5 Points per Sticker (Recommended)</option>
                          <option value={10}>10 Points per Sticker</option>
                        </select>
                      </div>
                      <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">✨</div>
                        <p className="text-xs font-bold text-green-700">
                          Chores assigned to {name || 'this kid'} must have values that are multiples of {stickerValue}.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-5 rounded-3xl text-slate-600 font-black uppercase tracking-widest text-sm hover:text-slate-800 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={saveKid}
                  style={{ backgroundColor: color, borderColor: color }}
                  className="flex-[2] px-8 py-5 rounded-3xl text-white font-black shadow-lg hover:brightness-110 transition-all border-b-4 active:translate-y-1 active:border-b-0 uppercase tracking-widest text-sm"
                >
                  {editingKid ? 'Save Changes' : 'Save & Add Kid'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChoresList({ chores, kids }: { chores: Chore[], kids: Kid[] }) {
  const { getCollectionName } = useWorkspace();
  const [showModal, setShowModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number | string>(5);
  const [icon, setIcon] = useState(CHORE_ICONS[0]);
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekdays');
  const [assignedKids, setAssignedKids] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [isBonus, setIsBonus] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, getCollectionName('config'), 'categories'), (docSnap) => {
      if (docSnap.exists()) {
        setCategoryOrder((docSnap.data() as CategoryOrder).categories);
      }
    });
    return unsub;
  }, [getCollectionName]);

  const openAdd = () => {
    setEditingChore(null);
    setTitle('');
    setPoints(5);
    setIcon(CHORE_ICONS[0]);
    setCategory('');
    setFrequency('weekdays');
    setAssignedKids([]);
    setSelectedDays([]);
    setIsBonus(false);
    setShowModal(true);
  };

  const openEdit = (chore: Chore) => {
    setEditingChore(chore);
    setTitle(chore.title);
    setPoints(chore.points);
    setIcon(chore.icon || CHORE_ICONS[0]);
    setCategory(chore.category || '');
    setFrequency(chore.frequency);
    setAssignedKids(chore.assignedTo || []);
    setSelectedDays(chore.days || []);
    setIsBonus(chore.isBonus || false);
    setShowModal(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    const words = newTitle.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (SUGGESTED_ICONS[word]) {
        setIcon(SUGGESTED_ICONS[word]);
        break;
      }
    }
  };

  const saveChore = async () => {
    if (!title.trim() || assignedKids.length === 0) return;

    // Validation for Non-Readers
    const finalPoints = points === '' ? (editingChore?.points || 0) : Number(points);
    const nonReaderKids = kids.filter(k => assignedKids.includes(k.id) && k.isNonReader);
    for (const kid of nonReaderKids) {
      const sv = kid.stickerValue || 5;
      if (finalPoints % sv !== 0) {
        alert(`${kid.name} is a Non-Reader. Their chores must be a multiple of ${sv} points (1 sticker = ${sv} points). Please adjust the star value.`);
        return;
      }
    }

    try {
      const finalDays = frequency === 'weekdays' ? [1, 2, 3, 4, 5] : selectedDays;
      const choreData = {
        title,
        points: finalPoints,
        icon,
        category: category.trim(),
        frequency,
        days: finalDays,
        assignedTo: assignedKids,
        isBonus,
        active: true,
      };

      if (editingChore) {
        await writeBatch(db).update(doc(db, getCollectionName('chores'), editingChore.id), choreData).commit();
      } else {
        // Calculate order for new chore in its category
        const choresInCategory = chores.filter(c => (c.category || '') === category.trim());
        const maxOrder = choresInCategory.reduce((max, c) => Math.max(max, c.order || 0), -1);
        
        await addDoc(collection(db, getCollectionName('chores')), {
          ...choreData,
          order: maxOrder + 1,
          createdAt: new Date().toISOString()
        });

        // Ensure category is in categoryOrder
        const catTrimmed = category.trim();
        if (catTrimmed && !categoryOrder.includes(catTrimmed)) {
          const newCatOrder = [...categoryOrder, catTrimmed];
          await setDoc(doc(db, getCollectionName('config'), 'categories'), { categories: newCatOrder });
        }
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const batch = writeBatch(db);

    if (type === 'category') {
      const newOrder = Array.from(allCategories);
      const [removed] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, removed);
      batch.set(doc(db, getCollectionName('config'), 'categories'), { categories: newOrder });
    } else {
      const sourceCategory = source.droppableId;
      const destCategory = destination.droppableId;
      
      const choresInSource = categorizedChores[sourceCategory] || [];
      const choresInDest = categorizedChores[destCategory] || [];

      if (sourceCategory === destCategory) {
        const reordered = Array.from(choresInSource);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        
        reordered.forEach((c, idx) => {
          batch.update(doc(db, getCollectionName('chores'), c.id), { order: idx });
        });
      } else {
        // Moving between categories
        const sourceList = Array.from(choresInSource);
        const destList = Array.from(choresInDest);
        const [moved] = sourceList.splice(source.index, 1);
        
        // Update items in source
        sourceList.forEach((c, idx) => {
          batch.update(doc(db, getCollectionName('chores'), c.id), { order: idx });
        });

        // Update moved item and items in destination
        batch.update(doc(db, getCollectionName('chores'), moved.id), { 
          category: destCategory === 'uncategorized' ? '' : destCategory,
          order: destination.index 
        });
        
        destList.splice(destination.index, 0, moved);
        destList.forEach((c, idx) => {
          if (c.id !== moved.id) {
            batch.update(doc(db, getCollectionName('chores'), c.id), { order: idx >= destination.index ? idx + 1 : idx });
          }
        });
      }
    }

    try {
      await batch.commit();
    } catch (e) {
      console.error("Reorder failed:", e);
    }
  };

  // Group and sort chores
  const uniqueCategories = Array.from(new Set(chores.map(c => c.category || '').filter(Boolean)));
  const allCategories = Array.from(new Set([...categoryOrder.filter(cat => uniqueCategories.includes(cat) || chores.some(c => c.category === cat)), ...uniqueCategories]));
  if (!allCategories.includes('')) allCategories.push(''); // Add uncategorized if not present

  const categorizedChores: Record<string, Chore[]> = {};
  allCategories.forEach(cat => {
    categorizedChores[cat || 'uncategorized'] = chores
      .filter(c => (c.category || '') === cat)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return (
    <div className="space-y-6">
      {/* Daily Potential Points Summary */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[40px] p-8 shadow-xl text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Daily Star Potential</h3>
            <p className="text-indigo-100 text-sm font-medium">Standard daily load (Daily + Weekday chores, excludes bonuses)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kids.map(kid => {
            const kidChores = chores.filter(c => 
              c.active && 
              c.assignedTo.includes(kid.id) && 
              !c.isBonus && 
              (c.category || '').toLowerCase() !== 'bonus chores'
            );
            
            const standardDailyPoints = kidChores
              .filter(c => c.frequency === 'daily' || c.frequency === 'weekdays')
              .reduce((sum, c) => sum + (Number(c.points) || 0), 0);

            return (
              <div key={kid.id} className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/10 hover:bg-white/20 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                    {kid.avatar}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black truncate uppercase tracking-tighter text-sm">{kid.name}</p>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-none">Standard Daily</p>
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black tracking-tighter leading-none">{standardDailyPoints}</span>
                  <span className="text-sm font-black text-indigo-200 uppercase mb-1">Stars/Day</span>
                </div>
              </div>
            );
          })}
          {kids.length === 0 && (
            <div className="col-span-full py-8 text-center text-indigo-200 font-bold italic">
              Add some kids to see the point breakdown!
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-6 rounded-[40px] shadow-md border-b-8 border-slate-100">
        <div className="flex gap-4">
          <div className="bg-blue-100 p-3 rounded-2xl border-2 border-blue-200">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-black text-slate-900 uppercase tracking-tight">Chore Management</p>
            <p className="text-sm text-slate-600 font-bold">Assign chores to your critters. Drag to reorder.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black flex items-center gap-2 hover:bg-yellow-50 transition-all shadow-lg active:translate-y-1"
        >
          <Plus className="w-5 h-5 text-yellow-500" />
          Create Chore
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories" type="category">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
              {allCategories.map((cat, index) => {
                const catId = cat || 'uncategorized';
                const items = categorizedChores[catId] || [];
                if (items.length === 0 && cat !== '') return null; // Don't show empty categories except maybe uncategorized if it has items

                return (
                  // @ts-expect-error - dnd key prop mismatch
                  <Draggable key={catId} draggableId={catId} index={index}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps}
                        className="bg-slate-50/50 p-6 rounded-[40px] border-2 border-dashed border-slate-200"
                      >
                        <div className="flex items-center gap-3 mb-4 group">
                          <div {...provided.dragHandleProps} className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                            {cat ? cat : 'Uncategorized'}
                          </h3>
                        </div>

                        <Droppable droppableId={catId} type="chore">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                              {items.map((chore, idx) => (
                                // @ts-expect-error - dnd key prop mismatch
                                <Draggable key={chore.id} draggableId={chore.id} index={idx}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="bg-white rounded-[32px] p-5 shadow-sm border-2 border-slate-100 flex items-center gap-4 group hover:border-blue-200 transition-all"
                                    >
                                      <div {...provided.dragHandleProps} className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                                        <GripVertical className="w-4 h-4" />
                                      </div>

                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                                        chore.frequency === 'daily' || chore.frequency === 'weekdays' ? 'bg-blue-50 text-blue-600' :
                                        chore.frequency === 'weekly' ? 'bg-purple-50 text-purple-600' :
                                        'bg-orange-50 text-orange-600'
                                      }`}>
                                        {chore.icon || '🚀'}
                                      </div>
                                      
                                      <div className="flex-1">
                                        <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{chore.title}</h3>
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1 text-orange-500 font-black text-xs">
                                            <Star className="w-3 h-3 fill-orange-400" />
                                            {chore.points} Stars
                                          </div>
                                          <span className="text-slate-200 text-xs">•</span>
                                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                            {chore.frequency === 'weekly' && chore.days && chore.days.length > 0
                                              ? `Weekly on ${chore.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`
                                              : chore.frequency === 'weekdays' 
                                                ? 'Weekdays (M-F)'
                                                : chore.frequency}
                                          </p>
                                          {chore.isBonus && (
                                            <>
                                              <span className="text-slate-200 text-xs">•</span>
                                              <p className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">Bonus</p>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex -space-x-2">
                                        {chore.assignedTo.map(kidId => {
                                          const kid = kids.find(k => k.id === kidId);
                                          return kid ? (
                                            <div key={kidId} className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm z-10" title={kid.name}>
                                              {kid.avatar}
                                            </div>
                                          ) : null;
                                        })}
                                      </div>

                                      <div className="flex items-center gap-1 transition-opacity">
                                        <button onClick={() => openEdit(chore)} className="p-2 text-slate-600 hover:bg-slate-50 hover:text-blue-500 rounded-xl">
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteDoc(doc(db, getCollectionName('chores'), chore.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {items.length === 0 && (
                                <div className="text-center py-8 text-slate-300 font-bold text-sm italic">
                                  Drag chores here
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-10 pb-20 space-y-6">
                <h2 className="text-3xl font-black mb-8 text-center text-slate-900 tracking-tight">
                  {editingChore ? 'Edit Chore' : 'New Chore'}
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Chore Description</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g., Make the bed"
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all outline-none text-lg font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Category (Optional)</label>
                      <input
                        type="text"
                        list="category-suggestions"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Housework"
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all outline-none text-lg font-bold text-slate-900"
                      />
                      <datalist id="category-suggestions">
                        {Array.from(new Set(chores.map(c => c.category || '').filter(Boolean))).map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Chore Icon</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-inner max-h-40 overflow-y-auto">
                      {CHORE_ICONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setIcon(emoji)}
                          className={`text-2xl p-2 rounded-xl transition-all ${icon === emoji ? 'bg-white scale-125 shadow-md border-2 border-orange-200' : 'hover:scale-110 grayscale-[0.5] hover:grayscale-0 opacity-60 hover:opacity-100'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Stars Earned</label>
                      <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all outline-none text-lg font-bold text-slate-900"
                      />
                      {kids.filter(k => assignedKids.includes(k.id) && k.isNonReader).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {kids.filter(k => assignedKids.includes(k.id) && k.isNonReader).map(k => {
                            const sv = k.stickerValue || 5;
                            const stickers = Math.floor(Number(points) / sv);
                            const isInvalid = Number(points) % sv !== 0;
                            return (
                              <div key={k.id} className={`text-[10px] font-black uppercase tracking-tight py-1 px-3 rounded-lg border-2 ${isInvalid ? 'bg-red-50 border-red-100 text-red-500' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                {k.name}: {stickers} Stickers {isInvalid && <span className="ml-1 text-red-400">(Needs multiple of {sv})</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as Frequency)}
                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white transition-all outline-none text-lg font-bold appearance-none text-slate-900"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays (M-F)</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="by-deadline">By Deadline</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-100">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isBonus}
                          onChange={(e) => setIsBonus(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-checked:bg-purple-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                      </div>
                      <div>
                        <span className="text-base font-black text-slate-800 uppercase tracking-tight block">Bonus Chore</span>
                        <span className="text-xs font-bold text-slate-400">Hides this chore until all other chores for the day are finished</span>
                      </div>
                    </label>
                  </div>

                  {frequency === 'weekly' && (
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">On which days?</label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                          <button
                            key={day}
                            onClick={() => {
                              setSelectedDays(prev => 
                                prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                              );
                            }}
                            className={`flex-1 min-w-[60px] py-3 rounded-xl font-bold transition-all ${
                              selectedDays.includes(i) 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Assign To</label>
                    <div className="flex flex-wrap gap-3">
                      {kids.map(kid => (
                        <button
                          key={kid.id}
                          onClick={() => {
                            setAssignedKids(prev => 
                              prev.includes(kid.id) ? prev.filter(id => id !== kid.id) : [...prev, kid.id]
                            )
                          }}
                          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all ${
                            assignedKids.includes(kid.id) 
                              ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100' 
                              : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl">{kid.avatar}</span>
                          <span className="font-bold">{kid.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-10 pt-4 border-t border-slate-100 bg-white rounded-b-[2.5rem] shrink-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-colors border-2 border-transparent text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChore}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-900 text-white font-black shadow-lg shadow-slate-100 hover:bg-black transition-all border-b-4 border-slate-700 active:translate-y-1 active:border-b-0 text-lg"
                >
                  {editingChore ? 'Save Changes' : 'Create Chore'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RewardsList({ rewards, kids, fulfillments }: { rewards: Reward[], kids: Kid[], fulfillments: Fulfillment[] }) {
  const { getCollectionName } = useWorkspace();
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState<number | string>(50);
  const [icon, setIcon] = useState('🎁');
  const [type, setType] = useState<'kid' | 'family'>('kid');
  const [allowedKids, setAllowedKids] = useState<string[]>([]);
  const [rewardTab, setRewardTab] = useState<'kid' | 'family'>('kid');

  const openAdd = () => {
    setEditingReward(null);
    setTitle('');
    setCost(50);
    setIcon('🎁');
    setType('kid');
    setAllowedKids([]);
    setShowModal(true);
  };

  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setCost(reward.cost);
    setIcon(reward.icon);
    setType(reward.type || 'kid');
    setAllowedKids(reward.allowedKids || []);
    setShowModal(true);
  };

  const saveReward = async () => {
    if (!title.trim()) return;
    const finalCost = cost === '' ? (editingReward?.cost || 0) : Number(cost);
    try {
      const rewardData = {
        title,
        cost: finalCost,
        icon,
        type,
        allowedKids: type === 'kid' ? allowedKids : [],
        active: true,
      };

      if (editingReward) {
        await writeBatch(db).update(doc(db, getCollectionName('rewards'), editingReward.id), rewardData).commit();
      } else {
        const rewardsOfType = rewards.filter(r => (r.type || 'kid') === type);
        const maxOrder = rewardsOfType.reduce((max, r) => Math.max(max, r.order || 0), -1);
        
        await addDoc(collection(db, getCollectionName('rewards')), {
          ...rewardData,
          order: maxOrder + 1
        });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRewards = rewards
    .filter(r => (r.type || 'kid') === rewardTab)
    .sort((a, b) => (a.cost || 0) - (b.cost || 0));

  const fulfillReward = async (id: string) => {
    try {
      await writeBatch(db).update(doc(db, getCollectionName('fulfillments'), id), {
        status: 'filled',
        filledAt: new Date().toISOString()
      }).commit();
    } catch (e) {
      console.error(e);
    }
  };

  const pendingFulfillments = fulfillments.filter(f => f.status === 'pending');

  return (
    <div className="space-y-6">
      {pendingFulfillments.length > 0 && (
        <div className="bg-indigo-900 rounded-[40px] p-8 shadow-xl border-b-8 border-indigo-950 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-indigo-500 p-3 rounded-2xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Reward Requests</h2>
              <p className="text-indigo-300 text-sm font-bold">Kids have purchased these rewards! Time to celebrate! 🎉</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFulfillments.map(f => {
              const kid = kids.find(k => k.id === f.kidId);
              return (
                <div key={f.id} className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-white/20 w-12 h-12 flex items-center justify-center rounded-2xl">{f.rewardIcon}</div>
                      <div>
                        <h4 className="font-black text-white">{f.rewardTitle}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                          {f.kidId === 'family' ? 'Family Reward' : `For ${kid?.name || 'Critter'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="text-[10px] font-bold text-indigo-200">
                      Bought {format(new Date(f.purchasedAt), 'MMM d, h:mm a')}
                    </div>
                    <button
                      onClick={() => fulfillReward(f.id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                      Mark as Spent/Given
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-4 rounded-[32px] shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setRewardTab('kid')}
            className={`px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${rewardTab === 'kid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Kid Rewards
          </button>
          <button 
            onClick={() => setRewardTab('family')}
            className={`px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${rewardTab === 'family' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Family Rewards
          </button>
        </div>
        <button
          onClick={openAdd}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add Reward
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRewards.map((reward) => (
          <div key={reward.id} className="bg-white rounded-[40px] p-8 shadow-md border-b-8 border-blue-200 relative group flex flex-col items-center gap-4">
            <div className="text-6xl p-6 bg-blue-50 rounded-[2rem] transition-transform group-hover:scale-110 shadow-inner">
              {reward.icon}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-800">{reward.title}</h3>
              <div className="mt-2 flex items-center justify-center gap-2 px-6 py-2 bg-blue-50 rounded-full text-blue-600 font-black border border-blue-100">
                <Star className="w-5 h-5 fill-blue-400 text-blue-400" />
                {reward.cost} Stars
              </div>
              
              {reward.type === 'kid' && (
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                  {(!reward.allowedKids || reward.allowedKids.length === 0) ? (
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Available to all</span>
                  ) : (
                    (reward.allowedKids || []).map(kidId => {
                      const kid = kids.find(k => k.id === kidId);
                      return kid ? (
                        <span key={kidId} className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-lg text-sm" title={kid.name}>{kid.avatar}</span>
                      ) : null;
                    })
                  )}
                </div>
              )}
            </div>
            <div className="absolute top-6 right-6 flex gap-1 transition-opacity">
               <button onClick={() => openEdit(reward)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-full">
                <Pencil className="w-5 h-5" />
              </button>
              <button onClick={() => deleteDoc(doc(db, getCollectionName('rewards'), reward.id))} className="p-2 text-red-400 hover:bg-red-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {filteredRewards.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
             <Gift className="w-12 h-12 text-slate-100" />
             <p className="text-slate-500 font-black uppercase tracking-widest">No {rewardTab} rewards yet</p>
          </div>
        )}
      </div>

      {fulfillments.filter(f => f.status === 'filled').length > 0 && (
        <div className="bg-white rounded-[40px] p-8 shadow-md border-b-8 border-slate-200 mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-green-100 p-3 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Fulfilled Rewards History</h2>
              <p className="text-slate-500 text-sm font-bold">A record of all the fun and rewards given to the kids!</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {fulfillments
              .filter(f => f.status === 'filled')
              .sort((a, b) => new Date(b.filledAt || '').getTime() - new Date(a.filledAt || '').getTime())
              .map(f => {
                const kid = kids.find(k => k.id === f.kidId);
                return (
                  <div key={f.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-green-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm">{f.rewardIcon}</div>
                      <div>
                        <p className="font-black text-slate-800">
                          {f.kidId === 'family' ? 'Family' : kid?.name} enjoyed <span className="text-green-600">{f.rewardTitle}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          Redeemed on {f.filledAt ? format(new Date(f.filledAt), 'MMMM d, yyyy') : 'Unknown Date'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600 font-black text-xs bg-white px-3 py-1 rounded-full shadow-sm border border-green-50">
                        <Star className="w-3 h-3 fill-green-400" />
                        {f.cost}
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative"
            >
              <h2 className="text-3xl font-black mb-8 text-center text-slate-900 uppercase tracking-tight">
                {editingReward ? 'Edit Reward' : 'New Reward'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Reward Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Pizza Party"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-400 focus:bg-white transition-all outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Reward Icon</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-inner max-h-40 overflow-y-auto">
                    {REWARD_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setIcon(emoji)}
                        className={`text-2xl p-2 rounded-xl transition-all ${icon === emoji ? 'bg-white scale-125 shadow-md border-2 border-blue-200' : 'hover:scale-110 grayscale-[0.5] hover:grayscale-0 opacity-60 hover:opacity-100'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Star Cost</label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-400 focus:bg-white transition-all outline-none font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Reward Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                       <button 
                        onClick={() => setType('kid')}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'kid' ? 'bg-white shadow-sm text-slate-900 border-2 border-slate-100' : 'text-slate-600'}`}
                       >Individual</button>
                       <button 
                        onClick={() => setType('family')}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${type === 'family' ? 'bg-white shadow-sm text-slate-900 border-2 border-slate-100' : 'text-slate-600'}`}
                       >Family</button>
                    </div>
                  </div>
                </div>

                {type === 'kid' && (
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 ml-4 mb-2 block">Available To:</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                      {kids.map(kid => (
                        <button
                          key={kid.id}
                          onClick={() => {
                            setAllowedKids(prev => 
                              prev.includes(kid.id) ? prev.filter(id => id !== kid.id) : [...prev, kid.id]
                            )
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                            allowedKids.includes(kid.id)
                              ? 'bg-white border-blue-400 shadow-sm text-slate-900'
                              : 'bg-slate-100/50 border-transparent text-slate-600'
                          }`}
                        >
                          <span className={allowedKids.includes(kid.id) ? '' : 'grayscale opacity-70'}>{kid.avatar}</span>
                          <span className="text-xs font-black uppercase">{kid.name}</span>
                          {allowedKids.includes(kid.id) ? <Check className="w-3 h-3 text-blue-500" /> : <X className="w-3 h-3 text-slate-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-600 font-black uppercase text-xs tracking-widest">Cancel</button>
                  <button onClick={saveReward} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-100">Save Reward</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
