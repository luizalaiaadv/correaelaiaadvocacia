import { MapPin, Clock } from 'lucide-react';
import { FadeIn } from './fade-in';

export const ContactBar = () => {
  return (
    <div className="bg-brand text-white py-4 px-6 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <FadeIn delay={0.1} y={0} className="flex items-center gap-3">
          <MapPin size={18} className="text-primary" />
          <span className="text-sm font-medium">
            Rua dos Timbiras, 1940 - Lourdes, Belo Horizonte - MG
          </span>
        </FadeIn>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          <FadeIn delay={0.3} y={0} className="flex items-center gap-3">
            <Clock size={18} className="text-primary" />
            <span className="text-sm font-medium">Seg - Sex: 09:00 - 18:00</span>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};
