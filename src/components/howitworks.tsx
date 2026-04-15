import { MessageSquare, Calendar, Scale, CheckCircle } from 'lucide-react';
import { FadeIn } from './fade-in';

export const HowItWorks = () => {
  const steps = [
    {
      title: 'Entre em Contato',
      description:
        'Fale conosco através do WhatsApp ou telefone e conte brevemente o seu caso.',
      icon: MessageSquare,
    },
    {
      title: 'Agende o Atendimento',
      description:
        'Marcamos uma reunião presencial ou online para analisar todos os detalhes e documentos.',
      icon: Calendar,
    },
    {
      title: 'Análise Estratégica',
      description:
        'Nossa equipe estuda as melhores vias jurídicas para garantir seus direitos.',
      icon: Scale,
    },
    {
      title: 'Início da Solução',
      description:
        'Protocolamos a ação e acompanhamos cada etapa até a resolução final.',
      icon: CheckCircle,
    },
  ];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
              Processo
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand mt-4">
              COMO FUNCIONA O ATENDIMENTO?
            </h3>
          </FadeIn>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent hidden lg:block -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
            {steps.map((step, index) => (
              <FadeIn
                key={index}
                delay={index * 0.1}
                className="text-center space-y-6"
              >
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-white border-4 border-accent rounded-full flex items-center justify-center text-primary shadow-lg mx-auto">
                    <step.icon size={32} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-brand">{step.title}</h4>
                  <p className="text-brand/60 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
