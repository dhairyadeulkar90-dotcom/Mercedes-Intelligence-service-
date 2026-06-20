import React, { useState, useRef } from 'react';
import { CAR_MODELS, CarModel, CarColor, WheelOption } from './components/types';
import ThreeCarViewer from './components/ThreeCarViewer';
import CarSpecs from './components/CarSpecs';
import AiConcierge from './components/AiConcierge';
import BookingForm from './components/BookingForm';
import MyBookings from './components/MyBookings';
import { ShieldCheck, Eye, EyeOff, KeyRound, Sparkles, Sliders, Play, RotateCw } from 'lucide-react';

export default function App() {
  // Config states
  const [selectedCar, setSelectedCar] = useState<CarModel>(CAR_MODELS[0]);
  const [selectedColor, setSelectedColor] = useState<CarColor>(CAR_MODELS[0].colors[0]);
  const [selectedWheel, setSelectedWheel] = useState<WheelOption>(CAR_MODELS[0].wheels[0]);

  // ThreeJS customization states
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [underglowOn, setUnderglowOn] = useState(true);
  const [underglowColor, setUnderglowColor] = useState('#00ffcc'); // default neon cyan/green
  const [doorsOpen, setDoorsOpen] = useState(false);

  // Video playback sequencing state
  const [videoFinished, setVideoFinished] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  // Custom click tracking for triple click
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleHeroClick = (e: React.MouseEvent<HTMLElement>) => {
    // Check standard click count
    const isTripleDetail = e.detail === 3;

    // Increment custom fast-click keeper
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    const resetCount = () => {
      clickCountRef.current = 0;
    };

    if (isTripleDetail || clickCountRef.current >= 3) {
      resetCount();
      if (heroVideoRef.current) {
        heroVideoRef.current.currentTime = 0;
        heroVideoRef.current.play().catch(err => {
          console.log("Playback interrupted: ", err);
        });
      }
      return;
    }

    // Set fallback timeout to reset count if they click too slowly
    clickTimerRef.current = setTimeout(resetCount, 650);

    // Single click: skip intro and show information immediately
    setVideoFinished(true);
  };

  // Re-fetch trigger for MyBookings listings
  const [bookingsTrigger, setBookingsTrigger] = useState(0);

  const handleCarChange = (car: CarModel) => {
    setSelectedCar(car);
    setSelectedColor(car.colors[0]);
    setSelectedWheel(car.wheels[0]);
    // Reset door states on models swap to prevent clip states
    setDoorsOpen(false);
  };

  const handleBookingComplete = () => {
    setBookingsTrigger(prev => prev + 1);
  };

  // Slow, magical anchor custom scrolling effect
  React.useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        // Visual offsets to leave comfort room below the fixed navigation bar
        const headerOffset = 100;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        const startPosition = window.scrollY;
        const distance = offsetPosition - startPosition;
        // 2200ms of grand, cinematic, slow and magical decelerating scroll
        const duration = 2200; 
        let startTime: number | null = null;

        // Quintic Ease-In-Out for that ultimate premium, weightless deceleration feel
        const easeInOutQuint = (t: number) => {
          return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
        };

        const animateScroll = (currentTime: number) => {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          
          window.scrollTo(0, startPosition + distance * easeInOutQuint(progress));

          if (timeElapsed < duration) {
            requestAnimationFrame(animateScroll);
          } else {
            // Apply the custom visual highlight glow class 
            targetElement.classList.add('magical-highlight-glow');
            setTimeout(() => {
              targetElement.classList.remove('magical-highlight-glow');
            }, 1800);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    };

    window.addEventListener('click', handleAnchorClick);
    return () => {
      window.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  // Predefined gorgeous underglow neon colors
  const underglowColors = [
    { name: 'Mercedes EQ Blue', hex: '#00dfff' },
    { name: 'AMG Green Hell', hex: '#21da13' },
    { name: 'Concept Amber', hex: '#ff9900' },
    { name: 'F1 Electric Pink', hex: '#ff007f' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col antialiased selection:bg-white selection:text-black">
      {/* 1. Header Navigation Bar */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-sans font-light tracking-[0.3em] text-sm leading-none text-white">MERCEDES-BENZ</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[10px] tracking-[0.2em] text-white/50 font-semibold">
            <a href="#3d-configurator" className="hover:text-white hover:opacity-100 transition-all uppercase">Models</a>
            <a href="#vehicle-specifications-panel" className="hover:text-white hover:opacity-100 transition-all uppercase">Specifications</a>
            <a href="#test-drive-booking-engine" className="hover:text-white hover:opacity-100 transition-all uppercase">Book Drive</a>
            <a href="#booking-management-panel" className="hover:text-white hover:opacity-100 transition-all uppercase">Inventory</a>
          </div>


        </div>
      </header>

      {/* 2. Hero Section with requested Video Background */}
      <section 
        className="relative w-full h-[75vh] min-h-[550px] overflow-hidden flex items-center bg-black cursor-pointer group"
        onClick={handleHeroClick}
      >
        {/* Background Video Component */}
        <div className="absolute inset-0 z-0">
          <video
            ref={heroVideoRef}
            autoPlay
            muted
            playsInline
            onEnded={() => setVideoFinished(true)}
            className="w-full h-full object-cover select-none pointer-events-none opacity-80"
            referrerPolicy="no-referrer"
          >
            <source 
              src="https://res.cloudinary.com/dh3xdbqod/video/upload/v1781945478/gemini_generated_video_63d12e42_zogqwh.mp4" 
              type="video/mp4" 
            />
            Your browser does not support HTML5 video loops.
          </video>
          {/* Black Vignette Overlays for Cinema Contrast & Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>



        {/* Hero Content Overlay (Left-aligned & with popping transition) */}
        <div className={`relative z-10 max-w-7xl mx-auto px-8 md:px-16 w-full text-left flex flex-col items-start gap-6 transition-all duration-1000 transform ${
          videoFinished ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-none border border-white/10 text-[9px] font-mono tracking-[0.25em] text-white/70 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>EXCELLENCE IN DESIGN & EMOTION</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-white max-w-3xl leading-[1.1] uppercase">
            Define the Speed of luxury
          </h1>
          
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl leading-relaxed font-light italic">
            Enter the state-of-the-art Mercedes-Benz Interactive Experience. Explore hand-sculpted aerodynamic 3D builds, custom paint finishes, high-fidelity sound, and secure test paths at our global studio showrooms.
          </p>

          <div className="flex flex-wrap items-center justify-start gap-4 mt-2">
            <a
              href="#3d-configurator"
              className="bg-white hover:bg-neutral-200 text-black px-8 py-3.5 rounded-none font-bold text-[10px] tracking-[0.2em] uppercase transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Build & Customize</span>
              <Sliders className="w-4 h-4 text-black" />
            </a>
            <a
              href="#test-drive-booking-engine"
              className="bg-transparent hover:bg-white/10 text-white border border-white/20 hover:border-white/40 backdrop-blur-md px-8 py-3.5 rounded-none text-[10px] tracking-[0.2em] uppercase font-bold transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Request VIP Drive</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Body Structure */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-14 w-full">
        {/* 3D stage and selector details layout twin column */}
        <div id="3d-configurator" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
          
          {/* Left Column - WebGL Stage and mechanics toggles */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Live WebGL Stage */}
            <ThreeCarViewer
              selectedCar={selectedCar}
              selectedColor={selectedColor}
              selectedWheel={selectedWheel}
              headlightsOn={headlightsOn}
              underglowOn={underglowOn}
              underglowColor={underglowColor}
              doorsOpen={doorsOpen}
            />

            {/* AMG GT Track Video Option */}
            {selectedCar.id === 'amg_gt' && (
              <div 
                id="amg-gt-video-experience"
                className="bg-neutral-950 border border-white/10 p-6 flex flex-col gap-4 shadow-2xl transition-all duration-500 hover:border-white/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-light text-white uppercase tracking-tight">AMG GT Track Video Experience</h3>
                  </div>
                </div>

                <div className="relative w-full aspect-video bg-black overflow-hidden border border-white/5">
                  <video
                    src="https://res.cloudinary.com/dh3xdbqod/video/upload/v1781946756/gemini_generated_video_ee8e61f1_oniwqk.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-[11px] text-gray-400 font-light leading-relaxed flex flex-col gap-1">
                  <p>
                    Experience active aerodynamics and extreme lateral acceleration captured on the track.
                  </p>
                  <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">
                    Format: Ultra-Wide Cinematic Spec • Location: Affalterbach Proving Ground
                  </p>
                </div>
              </div>
            )}

            {/* EQS Luxury Video Option */}
            {selectedCar.id === 'eqs' && (
              <div 
                id="eqs-video-experience"
                className="bg-neutral-950 border border-white/10 p-6 flex flex-col gap-4 shadow-2xl transition-all duration-500 hover:border-white/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-light text-white uppercase tracking-tight">EQS Digital Luxury Walkthrough</h3>
                  </div>
                </div>

                <div className="relative w-full aspect-video bg-black overflow-hidden border border-white/5">
                  <video
                    src="https://res.cloudinary.com/dh3xdbqod/video/upload/v1781948253/Customized_alter_different_anima__202606201505_g7xaql.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-[11px] text-gray-400 font-light leading-relaxed flex flex-col gap-1">
                  <p>
                    Journey through customized aero designs, silent luxury aesthetics, and state-of-the-art electric animation elements.
                  </p>
                  <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">
                    Format: Ultra-Wide Avant-Garde Spec • Location: Mercedes-EQ Digital Studio
                  </p>
                </div>
              </div>
            )}

            {/* G-Class Video Option */}
            {selectedCar.id === 'g_wagon' && (
              <div 
                id="g-wagon-video-experience"
                className="bg-neutral-950 border border-white/10 p-6 flex flex-col gap-4 shadow-2xl transition-all duration-500 hover:border-white/20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-light text-white uppercase tracking-tight">G-Class AMG G 63 Off-Road Experience</h3>
                  </div>
                </div>

                <div className="relative w-full aspect-video bg-black overflow-hidden border border-white/5">
                  <video
                    src="https://res.cloudinary.com/dh3xdbqod/video/upload/v1781949506/Generated_Video_June_20_2026_-_3_26PM_mkujvf.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-[11px] text-gray-400 font-light leading-relaxed flex flex-col gap-1">
                  <p>
                    Experience the ultimate off-road beast crossing extreme terrains, showcasing rugged durability paired with sheer AMG power.
                  </p>
                  <p className="text-[9px] text-white/40 font-mono uppercase tracking-wider mt-1">
                    Format: Ultra-Wide Terrain Spec • Location: AMG G-Class Off-Road Arena
                  </p>
                </div>
              </div>
            )}


          </div>

          {/* Right Column - Selection Controls details and Specifications */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Model Select Header Box */}
            <div className="bg-white/5 border border-white/10 rounded-none p-6 shadow-2xl backdrop-blur-md flex flex-col gap-6">
              
              {/* Models swap tab links */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-mono tracking-[0.2em] text-white/50 uppercase">MODEL SPECIFICATION</span>
                <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-none border border-white/10 font-sans">
                  {CAR_MODELS.map((car) => (
                    <button
                      key={car.id}
                      id={`car-model-tab-${car.id}`}
                      onClick={() => handleCarChange(car)}
                      className={`py-2 text-[10px] sm:text-xs font-semibold rounded-none tracking-widest transition-all uppercase cursor-pointer ${
                        selectedCar.id === car.id
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {car.id === 'amg_gt' ? 'AMG GT' : car.id === 'eqs' ? 'EQS' : 'G-Class'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & price statement */}
              <div>
                <h3 className="text-2xl font-light tracking-tight text-white uppercase">{selectedCar.name}</h3>
                <p className="text-xs text-gray-400 font-sans mt-2.5 leading-relaxed italic">
                  "{selectedCar.tagline}"
                </p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-[9px] text-gray-500 uppercase font-mono tracking-wider">Base MSRP</span>
                  <span className="text-2xl font-mono font-medium text-white tracking-tight">{selectedCar.price}</span>
                </div>
              </div>



              <hr className="border-white/10" />

              {/* Wheel specs selector */}
              <div className="flex flex-col gap-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono tracking-[0.2em] text-white/50 uppercase">AMG Alloy Wheels</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff99]">Included</span>
                </div>

                <div className="flex flex-col gap-2">
                  {selectedCar.wheels.map((wheel) => (
                    <label
                      key={wheel.id}
                      id={`car-wheel-pick-${wheel.id}`}
                      onClick={() => setSelectedWheel(wheel)}
                      className={`flex items-start justify-between gap-3 p-3.5 rounded-none border transition-all cursor-pointer ${
                        selectedWheel.id === wheel.id
                          ? 'bg-white/10 border-white text-white shadow-inner'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="wheel-select"
                          checked={selectedWheel.id === wheel.id}
                          onChange={() => {}}
                          className="accent-white mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5 ml-1">
                          <span className="text-xs font-medium leading-tight">{wheel.name}</span>
                          <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-wider">{wheel.style} • {wheel.size}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Complete dynamic Specifications specifications compare board */}
        <CarSpecs
          selectedCar={selectedCar}
          selectedColor={selectedColor}
        />

        {/* 4.5 Intelligent Mercedes-Benz Atelier Concierge Chatbot */}
        <AiConcierge
          selectedCar={selectedCar}
          selectedColor={selectedColor}
          selectedWheel={selectedWheel}
        />

        {/* 5. Scheduling test drive engine and dynamic scheduling ledger reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
          
          {/* Reservation schedules list pane */}
          <div className="lg:col-span-4 lg:order-2">
            <BookingForm
              selectedCar={selectedCar}
              selectedColor={selectedColor}
              selectedWheel={selectedWheel}
              onBookingComplete={handleBookingComplete}
            />
          </div>

          {/* Curated list tracking from localStorage */}
          <div className="lg:col-span-8 lg:order-1">
            <MyBookings
              refreshTrigger={bookingsTrigger}
            />
          </div>

        </div>

      </main>

      {/* 6. High-Tech luxury Footer copyright statements */}
      <footer className="mt-auto border-t border-white/10 bg-black py-10 text-center px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] tracking-[0.2em] font-mono text-white/30 uppercase">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} MERCEDES-BENZ AG. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>VIP EXPERIENCE STUDIOS</span>
            <span>PRIVACY DISCLOSURE</span>
            <span>SHOWROOM LOGISTICS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
