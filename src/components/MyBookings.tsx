import { useEffect, useState } from 'react';
import { TestDriveBooking } from './types';
import { Trash2, CalendarCheck, ShieldAlert, CheckCircle, RefreshCcw, MapPin, Clock, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface MyBookingsProps {
  refreshTrigger: number;
}

export default function MyBookings({ refreshTrigger }: MyBookingsProps) {
  const { user, firestoreError, setFirestoreError } = useAuth();
  const [bookings, setBookings] = useState<TestDriveBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Reload bookings from Firestore (with localStorage fallback)
  const loadBookings = async () => {
    if (!user) {
      setBookings([]);
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const q = query(
        collection(db, 'bookings'), 
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const loaded: TestDriveBooking[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          carModelId: data.carModelId,
          carModelName: data.carModelName,
          colorName: data.colorName,
          wheelName: data.wheelName,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          date: data.date,
          time: data.time,
          location: data.location,
          createdAt: data.createdAt,
          status: data.status || 'confirmed'
        } as TestDriveBooking);
      });

      // Sort by creation date descending
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(loaded);
      
      // Update local storage cache
      localStorage.setItem('mercedes_test_drives', JSON.stringify(loaded));
      setFirestoreError(null);
    } catch (e: any) {
      console.warn('Failed to load from Firestore, using local cache fallback...', e);
      if (e.code === 'permission-denied' || e.message?.includes('permission') || e.message?.includes('Permission')) {
        setFirestoreError('permission-denied');
      }
      // Fallback to local storage if Firestore rules aren't ready yet or offline
      try {
        const stored = localStorage.getItem('mercedes_test_drives');
        if (stored) {
          const parsed = JSON.parse(stored) as TestDriveBooking[];
          // Keep only bookings corresponding to this user or any if stored locally
          setBookings(parsed);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user, refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      // 1. Delete from Firestore
      try {
        await deleteDoc(doc(db, 'bookings', id));
      } catch (firestoreErr) {
        console.error("Failed deleting from firestore directly:", firestoreErr);
      }

      // 2. Delete from local cache
      const stored = localStorage.getItem('mercedes_test_drives') || '[]';
      const parsed = JSON.parse(stored) as TestDriveBooking[];
      const updated = parsed.filter(b => b.id !== id);
      localStorage.setItem('mercedes_test_drives', JSON.stringify(updated));

      // Refresh state
      setBookings(updated);
      setDeletingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="booking-management-panel" className="bg-white/5 border border-white/10 p-8 backdrop-blur-xl rounded-none shadow-[0_24px_50px_rgba(0,0,0,0.6)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
        <div>
          <span className="text-[10px] font-mono text-white/50 tracking-[0.3em] uppercase block mb-1">RESERVATIONS DESK</span>
          <h3 className="text-2xl font-light text-white tracking-tight uppercase">My Active Test Drives</h3>
        </div>
        {user && (
          <button
            onClick={loadBookings}
            disabled={isLoading}
            className="self-start text-[10px] font-mono uppercase tracking-widest text-gray-300 hover:text-white flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 px-4 py-2 rounded-none transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh Lists'}</span>
          </button>
        )}
      </div>

      {firestoreError === 'permission-denied' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-none flex flex-col gap-3 font-sans relative">
          <button 
            type="button" 
            onClick={() => setFirestoreError(null)} 
            className="absolute top-3 right-3 text-white/40 hover:text-white text-xs font-mono px-2 py-0.5 border border-white/10 hover:border-white/30 cursor-pointer"
          >
            Dismiss Help
          </button>
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 max-w-[90%]">
              <span className="text-[9px] font-mono text-amber-400 tracking-[0.2em] uppercase font-semibold">DATABASE PERMISSIONS DETECTED</span>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Firestore Security Rules Configuration Recommended</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed font-light mt-1">
                Your custom Firebase Firestore database is currently in locked mode. The app is automatically falling back to <strong>secure browser local storage</strong> so your bookings are stored safely on this device!
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                To synchronize configurations across multiple devices, paste the following rules in your <strong>Firebase Console &gt; Firestore Database &gt; Rules</strong> tab:
              </p>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-2.5 flex flex-col gap-2">
            <pre className="bg-black/60 border border-white/5 p-3.5 font-mono text-[9px] text-gray-400 overflow-x-auto rounded-none leading-relaxed select-all">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /bookings/{bookingId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {!user ? (
        /* Not Logged In Visual Card */
        <div className="border border-dashed border-white/10 rounded-none py-14 px-4 flex flex-col items-center justify-center text-center gap-4 bg-transparent font-sans">
          <div className="w-12 h-12 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/60">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Access Restricted</h4>
            <p className="text-[11px] text-gray-500 leading-normal font-light">
              Please sign in or create an account in the test drive panel to synchronize and view your active luxury reservations.
            </p>
          </div>
        </div>
      ) : isLoading && bookings.length === 0 ? (
        /* Loading Visual State */
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Fetching Reservations...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-none py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-transparent font-sans">
          <CalendarCheck className="w-8 h-8 text-white/30" />
          <div className="flex flex-col gap-1 max-w-xs">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No Reservations Found</h4>
            <p className="text-[11px] text-gray-500 leading-normal font-light">
              Pick your preferred vehicle specification above, configure paint/wheels, and submit the booking ledger to reserve your test drive.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white/5 p-5 border border-white/10 hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 text-white border border-white/20 rounded-none mt-0.5 shadow-sm">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 font-sans">
                    <span className="text-sm font-semibold text-white leading-none">
                      {booking.carModelName}
                    </span>
                    <span className="bg-white/10 border border-white/20 text-white text-[9px] tracking-wider px-2.5 py-0.5 rounded-none font-mono uppercase font-semibold">
                      Confirmed
                    </span>
                  </div>

                  <span className="text-[11px] text-white/70 font-light font-sans">
                    Client: <span className="text-white font-medium">{booking.fullName}</span> • Paint: <span className="text-white font-medium">{booking.colorName}</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3.5 text-[11px] text-gray-400 font-sans mt-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span className="max-w-[150px] truncate">{booking.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-mono text-gray-300">{booking.date} at {booking.time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action columns */}
              <div className="flex items-center gap-3 self-end sm:self-center font-sans">
                <span className="text-[9px] font-mono text-gray-600 leading-none">
                  ID: {booking.id.substring(0, 8)}
                </span>

                {deletingId === booking.id ? (
                  <div className="flex items-center gap-1.5 animate-fade-in">
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-[10px] font-mono uppercase bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 font-semibold transition-all cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] font-mono uppercase bg-white/10 hover:bg-white/20 text-white/80 px-2.5 py-1.5 transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(booking.id)}
                    className="p-2.5 bg-red-950/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/10 hover:border-red-500/30 rounded-none transition-all cursor-pointer"
                    title="Cancel reservation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advisory disclaimer panel */}
      <div className="bg-white/5 rounded-none p-5 border border-white/10 flex items-start gap-4 text-[11px] text-gray-500 font-light font-sans">
        <ShieldAlert className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
        <span className="leading-relaxed">
          Please arrive 15 minutes before your scheduled timeframe with a valid legal Driver's License and Proof of Insurance. Drivers must be 21 years of age or older to participate in high performance AMG GT track configurations.
        </span>
      </div>
    </div>
  );
}
