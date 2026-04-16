import { CheckCircle2, Users, Award, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { FadeIn } from './fade-in';

export const Differentials = () => {
  const items = [
    {
      title: 'Atendimento Humanizado',
      description:
        'Entendemos que cada caso é único e envolve vidas e famílias.',
      icon: Users,
    },
    {
      title: 'Transparência Total',
      description: 'Você acompanha cada passo do seu processo com clareza.',
      icon: ShieldCheck,
    },
    {
      title: 'Especialistas Focados',
      description:
        'Foco exclusivo em Direito do Trabalho para melhores resultados.',
      icon: Award,
    },
    {
      title: 'Agilidade Digital',
      description:
        'Processos e comunicações rápidas via WhatsApp e meios digitais.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
              Diferenciais
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand mt-4">
              POR QUE ESCOLHER O NOSSO ESCRITÓRIO?
            </h3>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-10 md:gap-12">
            {items.map((item, index) => (
              <FadeIn key={index} delay={index * 0.1} className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <item.icon size={24} />
                </div>
                <h4 className="text-lg font-bold text-brand">{item.title}</h4>
                <p className="text-brand/60 text-sm leading-relaxed">
                  {item.description}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>

        <FadeIn delay={0.4} className="relative">
          <div className="relative rounded-3xl overflow-hidden aspect-square lg:aspect-auto lg:h-112.5 max-w-md mx-auto lg:ml-auto">
            <Image
              src="/img3.webp"
              alt="Diferenciais Correa & Laia"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
          </div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent rounded-full -z-10" />
        </FadeIn>
      </div>
    </section>
  );
};
