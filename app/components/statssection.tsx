import { FadeIn } from './fade-in';

export const StatsSection = () => {
  const stats = [
    { label: 'Anos de Atuação', value: '+13' },
    { label: 'Clientes Ativos', value: '+300' },
    { label: 'Ações Protocoladas', value: '+700' },
    { label: 'Avaliações no Google', value: '5.0' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
          {stats.map((stat, index) => (
            <FadeIn key={index} delay={index * 0.1} className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary font-display">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-brand/60 uppercase tracking-widest">
                {stat.label}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
