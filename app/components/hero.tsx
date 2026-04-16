import Image from 'next/image';
import { FadeIn } from './fade-in';

export const Hero = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/download.webp"
          alt="Construção Civil"
          fill
          priority
          quality={85}
          className="object-cover object-center"
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/90 to-transparent md:to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full z-10">
        <div className="max-w-2xl space-y-8">
          <FadeIn delay={0.2}>
            <h1 className="text-3xl md:text-5xl font-normal text-brand leading-[1.2] uppercase tracking-tight">
              ADVOCACIA TRABALHISTA <br />
              EM <span className="font-bold text-primary">BELO HORIZONTE</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="text-sm md:text-base text-brand/80 max-w-lg leading-relaxed font-medium">
              Somos um escritório de advocacia trabalhista em Belo Horizonte
              especializado em defender os direitos de trabalhadores em MG.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
