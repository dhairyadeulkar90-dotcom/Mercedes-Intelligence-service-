import { CarModel, CarColor } from './types';
import { Gauge, Zap, Hammer, ShieldCheck, Flame } from 'lucide-react';

interface CarSpecsProps {
  selectedCar: CarModel;
  selectedColor: CarColor;
}

export default function CarSpecs({ selectedCar, selectedColor }: CarSpecsProps) {
  // Convert spec data to highly legible premium gauge meters
  const specsList = [
    {
      label: 'Acceleration (0-100 km/h)',
      value: selectedCar.specs.acceleration,
      icon: Flame,
      color: 'text-white/80 bg-white/10',
      desc: 'Rapid launches powered by high output mechanical dynamics.'
    },
    {
      label: 'Maximum Top Speed',
      value: selectedCar.specs.topSpeed,
      icon: Gauge,
      color: 'text-white/80 bg-white/10',
      desc: 'Electronic limiter settings designed for extreme track velocity.'
    },
    {
      label: 'Total Peak Power',
      value: selectedCar.specs.power,
      icon: Zap,
      color: 'text-white/80 bg-white/10',
      desc: 'Sustained horsepower delivering incredible throttle response.'
    },
  ];

  return (
    <div id="vehicle-specifications-panel" className="bg-white/5 border border-white/10 p-8 backdrop-blur-xl rounded-none shadow-[0_24px_50px_rgba(0,0,0,0.6)] flex flex-col gap-6">
      {/* Title block */}
      <div>
        <span className="text-[10px] font-mono text-white/50 tracking-[0.3em] uppercase block mb-1">INSTRUMENTATION</span>
        <h3 className="text-2xl font-light text-white tracking-tight uppercase">Specifications & Highlights</h3>
      </div>

      {/* Grid of Specifications cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {specsList.map((spec, i) => {
          const Icon = spec.icon;
          return (
            <div key={i} className="bg-white/5 rounded-none p-5 border border-white/10 flex flex-col gap-2 transition-all hover:bg-white/10 hover:border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">{spec.label}</span>
                <div className={`p-1.5 rounded-none ${spec.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-3xl font-light font-sans text-white tracking-tight leading-none">
                  {spec.value}
                </span>
                <span className="text-[9px] text-gray-500 font-mono tracking-wider mt-1">
                  {selectedCar.type === 'electric' && spec.label.includes('Power') ? 'EQ SYNCHRONOUS' : 'AMG HANDCRAFTED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <hr className="border-white/10 my-1" />

      {/* Powertrain and secondary Specs Info details list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/50 block mb-2 uppercase">POWERPLANT MECHANICS</span>
          <div className="bg-white/5 rounded-none p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-light">Powertrain Frame</span>
              <span className="font-mono text-white font-medium">{selectedCar.specs.engine}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
              <span className="text-gray-400 font-light">Range / Peak Torque</span>
              <span className="font-mono text-white font-medium">{selectedCar.specs.rangeOrTorque}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
              <span className="text-gray-400 font-light">Color Configuration</span>
              <span className="font-sans text-white font-medium">{selectedColor.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5">
              <span className="text-gray-400 font-light">Color Surcharge</span>
              <span className="font-mono text-white font-semibold">{selectedColor.price}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-white/50 block mb-2 uppercase">TECHNOLOGY & PERFORMANCE ADVANTAGES</span>
          <ul className="flex flex-col gap-2.5">
            {selectedCar.highlights.map((hlt, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400 font-light">
                <div className="mt-0.5 p-0.5 bg-white/10 text-white border border-white/15 rounded-none">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="leading-normal">{hlt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
