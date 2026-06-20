import { useEffect, useState } from 'react';
import { TestDriveBooking } from './types';
import { Trash2, CalendarCheck, ShieldAlert, CheckCircle, RefreshCcw, MapPin, Clock } from 'lucide-react';

interface MyBookingsProps {
  refreshTrigger: number;
}

export default function MyBookings({ refreshTrigger }: MyBookingsProps) {
  const [bookings, setBookings] = useState<TestDriveBooking[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reload bookings from local persistence
  const loadBookings = () => {
    try {
      const stored = localStorage.getItem('mercedes_test_drives');
      if (stored) {
        setBookings(JSON.parse(stored));
      } else {
        setBookings([]);
      }
    } catch (e) {
      console.error('Failed to parse local stored bookings.', e);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  const handleDelete = (id: string) => {
    try {
      const stored = localStorage.getItem('mercedes_test_drives') || '[]';
      const parsed = JSON.parse(stored) as TestDriveBooking[];
      const updated = parsed.filter(b => b.id !== id);
      localStorage.setItem('mercedes_test_drives', JSON.stringify(updated));
      loadBookings();
      setDeletingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="booking-management-panel" className="bg-white/5 border border-white/10 p-8 backdrop-blur-xl rounded-none shadow-[0_24px_50px_rgba(0,0,0,0.6)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-white/50 tracking-[0.3em] uppercase block mb-1">RESERVATIONS DESK</span>
          <h3 className="text-2xl font-light text-white tracking-tight uppercase">My Active Test Drives</h3>
        </div>
        <button
          onClick={loadBookings}
          className="self-start text-[10px] font-mono uppercase tracking-widest text-gray-300 hover:text-white flex items-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 px-4 py-2 rounded-none transition-all cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Refresh Lists</span>
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-none py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-transparent">
          <CalendarCheck className="w-8 h-8 text-white/30" />
          <div className="flex flex-col gap-1 max-w-xs">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No Reservations</h4>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold font-sans text-white leading-none">
                      {booking.carModelName}
                    </span>
                    <span className="bg-white/10 border border-white/20 text-white text-[9px] tracking-wider px-2.5 py-0.5 rounded-none font-mono uppercase font-semibold">
                      Confirmed
                    </span>
                  </div>

                  <span className="text-[11px] text-white/70 font-light">
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
              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-[9px] font-mono text-gray-600 leading-none">
                  ID: {booking.id}
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
      <div className="bg-white/5 rounded-none p-5 border border-white/10 flex items-start gap-4 text-[11px] text-gray-500 font-light">
        <ShieldAlert className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
        <span className="leading-relaxed">
          Please arrive 15 minutes before your scheduled timeframe with a valid legal Driver's License and Proof of Insurance. Drivers must be 21 years of age or older to participate in high performance AMG GT track configurations.
        </span>
      </div>
    </div>
  );
}
