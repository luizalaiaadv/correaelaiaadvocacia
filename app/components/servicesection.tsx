'use client';

import { motion } from 'motion/react';
import {
  Briefcase,
  FileText,
  AlertCircle,
  ShieldAlert,
  Clock,
  TrendingUp,
  Scale,
  UserPlus,
  Stethoscope,
} from 'lucide-react';
import { FadeIn } from './fade-in';

export const ServicesSection = () => {
  const services = [
    {
      title: 'Pejotização / Vínculo Empregatício',
      description:
        'Reconhecimento de vínculo para quem trabalha como PJ mas possui subordinação.',
      icon: UserPlus,
    },
    {
      title: 'Cálculo de Verbas Rescisórias',
      description:
        'Análise detalhada se todos os seus direitos foram pagos na demissão.',
      icon: FileText,
    },
    {
      title: 'Aviso Prévio / Demissão',
      description:
        'Orientação completa sobre demissões sem justa causa ou pedidos de demissão.',
      icon: Briefcase,
    },
    {
      title: 'Acúmulo e Desvio de Função',
      description:
        'Se você faz mais do que foi contratado, tem direito a compensação.',
      icon: TrendingUp,
    },
    {
      title: 'Rescisão Indireta / Indevida',
      description:
        'Quando a empresa descumpre o contrato, você pode pedir demissão com direitos.',
      icon: ShieldAlert,
    },
    {
      title: 'Assédio Moral e Sexual',
      description:
        'Defesa rigorosa contra abusos e situações constrangedoras no trabalho.',
      icon: AlertCircle,
    },
    {
      title: 'Horas Extras Não Pagas',
      description:
        'Recuperação de valores não pagos por trabalho além da jornada.',
      icon: Clock,
    },
    {
      title: 'FGTS e Verbas Rescisórias',
      description:
        'Regularização de depósitos e pagamentos obrigatórios em atraso.',
      icon: Scale,
    },
    {
      title: 'Acidente de Trabalho',
      description:
        'Indenizações e auxílio para doenças ocupacionais ou acidentes.',
      icon: Stethoscope,
    },
  ];

  return (
    <section id="servicos" className="py-20 bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
              Nosso Escritório Trabalhista
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h3 className="text-4xl md:text-5xl font-bold text-brand">
              COMO PODEMOS TE AJUDAR?
            </h3>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p className="text-brand/60">
              Especialistas prontos para defender seus direitos com excelência e
              dedicação.
            </p>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {services.map((service, index) => (
            <FadeIn key={index} delay={index * 0.05} className="group">
              <motion.div
                whileHover="hover"
                initial="initial"
                variants={{
                  initial: {
                    y: 0,
                    scale: 1,
                    boxShadow:
                      '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
                    borderColor: 'rgba(243, 244, 246, 1)',
                  },
                  hover: {
                    y: -12,
                    scale: 1.03,
                    boxShadow: '0 25px 50px -12px rgba(130, 70, 50, 0.2)',
                    borderColor: 'rgba(130, 70, 50, 0.3)',
                  },
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="block h-full p-8 bg-white border border-gray-100 rounded-2xl transition-colors hover:border-primary/20"
              >
                <motion.div
                  variants={{
                    initial: { scale: 1, rotate: 0 },
                    hover: { scale: 1.1, rotate: 5 },
                  }}
                  className="w-14 h-14 bg-accent/50 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300"
                >
                  <service.icon size={28} />
                </motion.div>
                <h4 className="text-xl font-bold text-brand mb-3 leading-tight">
                  {service.title}
                </h4>
                <p className="text-brand/60 text-sm leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
