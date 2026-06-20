import React, { useState } from 'react';
import { CAR_MODELS, SHOWROOM_LOCATIONS, TestDriveBooking, CarModel, CarColor, WheelOption } from './types';
import { Calendar, Clock, MapPin, User, Mail, Phone, ClipboardCheck, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  selectedCar: CarModel;
  selectedColor: CarColor;
  selectedWheel: WheelOption;
  onBookingComplete: () => void;
}

export default function BookingForm({ selectedCar, selectedColor, selectedWheel, onBookingComplete }: BookingFormProps) {
  // Booking Form State variables
  const [activeCarId, setActiveCarId] = useState(selectedCar.id);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(SHOWROOM_LOCATIONS[0].id);
  
  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<TestDriveBooking | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep test drive car model selection in sync with showroom active choice
  React.useEffect(() => {
    setActiveCarId(selectedCar.id);
  }, [selectedCar.id]);

  const currentModel = CAR_MODELS.find(c => c.id === activeCarId) || selectedCar;
  const hasChangedCar = currentModel.id !== selectedCar.id;

  // Auto-fill test drive coordinates
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Form inputs validations
    if (!fullName.trim()) {
      setErrorMsg('Please state your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please state a valid contact email address.');
      return;
    }
    if (!phone.trim() || phone.length < 8) {
      setErrorMsg('Please state a valid direct contact telephone number.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Please select a preferred calendar date for your drive.');
      return;
    }
    if (!selectedTime) {
      setErrorMsg('Please select a preferred concierge time slot.');
      return;
    }

    setIsSubmitting(true);

    // Simulate high-end digital concierge scheduling submission
    setTimeout(() => {
      const selectedLocObject = SHOWROOM_LOCATIONS.find(loc => loc.id === selectedLocation);
      
      const newBooking: TestDriveBooking = {
        id: 'bk_' + Math.random().toString(36).substr(2, 9),
        carModelId: currentModel.id,
        carModelName: currentModel.name,
        colorName: hasChangedCar ? currentModel.colors[0].name : selectedColor.name,
        wheelName: hasChangedCar ? currentModel.wheels[0].name : selectedWheel.name,
        fullName: fullName,
        email: email,
        phone: phone,
        date: selectedDate,
        time: selectedTime,
        location: selectedLocObject ? `${selectedLocObject.name} (${selectedLocObject.city})` : 'Showroom',
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      };

      // Retrieve existing list, append new schedule, save to localStorage
      try {
        const existingString = localStorage.getItem('mercedes_test_drives') || '[]';
        const existingList = JSON.parse(existingString) as TestDriveBooking[];
        existingList.unshift(newBooking);
        localStorage.setItem('mercedes_test_drives', JSON.stringify(existingList));
        
        // Show success visual state
        setSuccessBooking(newBooking);
        setIsSubmitting(false);

        // Reset variables
        setFullName('');
        setEmail('');
        setPhone('');
        setSelectedDate('');
        setSelectedTime('');

        // Notify parent callback
        if (onBookingComplete) {
          onBookingComplete();
        }
      } catch (err) {
        setErrorMsg('Persistence failure. Please verify browser storage access permissions.');
        setIsSubmitting(false);
      }
    }, 1500);
  };

  // Preset slots
  const timeSlots = [
    '09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM', '06:00 PM'
  ];

  // Get tomorrow's date formatted as YYYY-MM-DD for min date attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split('T')[0];

  return (
    <div id="test-drive-booking-engine" className="bg-white/5 border border-white/10 p-8 backdrop-blur-xl rounded-none shadow-[0_24px_50px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col gap-5">
      {/* Absolute high-tech glowing background flare */}
      <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-white/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Booking complete success splash panel */}
      {successBooking ? (
        <div id="booking-success-screen" className="flex flex-col items-center justify-center text-center py-6 gap-6 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 text-white border border-white/20 rounded-full flex items-center justify-center shadow-lg">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          
          <div className="flex flex-col gap-1.5 max-w-sm">
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/60 font-semibold uppercase">CONCIERGE CONFIRMED</span>
            <h4 className="text-xl font-sans font-light text-white tracking-tight">Test Drive Reserved</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Your customized vehicle configuration has been transmitted to our VIP showroom specialists. A Mercedes-Benz private agent will connect with you shortly.
            </p>
          </div>

          <div className="w-full bg-white/5 border border-white/10 p-5 rounded-none flex flex-col gap-2.5 text-left text-xs text-gray-300 font-light">
            <div className="flex justify-between">
              <span className="text-gray-500">Scheduled Asset:</span>
              <span className="text-white font-medium">{successBooking.carModelName}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-gray-500">Paint Finish:</span>
              <span className="text-white">{successBooking.colorName}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-gray-500">Location:</span>
              <span className="text-white text-right max-w-[180px] truncate">{successBooking.location}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-gray-500">Date & Slot:</span>
              <span className="text-white font-mono font-medium">{successBooking.date} • {successBooking.time}</span>
            </div>
          </div>

          <button
            onClick={() => setSuccessBooking(null)}
            className="w-full bg-white text-black py-4 rounded-none font-bold text-[11px] tracking-[0.2em] uppercase hover:bg-neutral-200 transition-all cursor-pointer"
          >
            Create Another Reservation
          </button>
        </div>
      ) : (
        /* Original Booking Interaction Form */
        <form onSubmit={handleBookingSubmit} className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/60 tracking-[0.3em] uppercase font-semibold">BOOK TEST DRIVE</span>
              <Sparkles className="w-3.5 h-3.5 text-white/50" />
            </div>
            <h3 className="text-2xl font-light text-white tracking-tight mt-1 uppercase">Reserve Your Drive</h3>
          </div>

          {/* Vehicle Model Selection Dropdown */}
          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Select Model to Drive</label>
            <div className="relative">
              <select
                value={activeCarId}
                onChange={(e) => setActiveCarId(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 focus:border-white/30 rounded-none py-3 px-4 text-xs text-white outline-none appearance-none transition-all cursor-pointer"
              >
                {CAR_MODELS.map((model) => (
                  <option key={model.id} value={model.id} className="bg-zinc-950 text-white text-xs">
                    {model.name} — {model.price}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center px-1 text-gray-500">
                <svg className="fill-current h-4 w-4 text-white/60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Current selected configuration banner */}
          <div className="bg-white/5 border border-white/10 rounded-none p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-gray-500 font-mono tracking-wider">SELECTED VEHICLE CONFIG</span>
              <span className="text-white font-medium">{currentModel.name}</span>
              <span className="text-[11px] text-white/50">{currentModel.id === selectedCar.id ? selectedColor.name : currentModel.colors[0].name} paint</span>
            </div>
            <div className="h-9 w-[1px] bg-white/10" />
            <div className="text-right">
              <span className="text-[9px] text-gray-500 font-mono block tracking-wider">BASE PRICE</span>
              <span className="text-white font-semibold font-mono">{currentModel.price}</span>
            </div>
          </div>

          {/* Error visual box */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-none p-3 flex items-start gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form inputs */}
          <div className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-none py-3 pl-10 pr-4 text-xs font-sans text-white placeholder-gray-600 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Email and Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Email Address</label>
                <div className="relative font-sans">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    placeholder="e.g. johndoe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-none py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Phone Number</label>
                <div className="relative font-sans">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-none py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Showroom Location</label>
              <div className="relative font-sans">
                <MapPin className="absolute left-3.5 top-1/3 -translate-y-1/3 w-4 h-4 text-gray-500" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 focus:border-white/30 rounded-none py-3 pl-10 pr-4 text-xs text-white outline-none appearance-none transition-all cursor-pointer"
                >
                  {SHOWROOM_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-zinc-950 text-white text-xs">
                      {loc.name} — {loc.city}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center px-1 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Preferred Date</label>
              <div className="relative font-sans">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  min={minDateString}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-none py-3 pl-10 pr-4 text-xs text-white outline-none transition-all cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
            </div>

            {/* Time slot pills selecting */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-400">Concierge Slots Availability</label>
              <div className="flex flex-wrap gap-1.5">
                {timeSlots.map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => setSelectedTime(ts)}
                    className={`px-3 py-1.5 text-xs rounded-none transition-all border ${
                      selectedTime === ts
                        ? 'bg-white text-black border-white font-semibold shadow-inner'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{ts}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-white text-black py-4 rounded-none font-bold text-[11px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 hover:bg-neutral-200 cursor-pointer disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Securing Slot Transmission...</span>
              </>
            ) : (
              <>
                <span>Book Test Drive</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
