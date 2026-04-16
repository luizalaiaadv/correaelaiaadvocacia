import { FadeIn } from './fade-in';

export const PricingSection = () => {
  return (
    <section className="py-20 bg-primary text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            VAMOS AGENDAR SEU ATENDIMENTO?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-12 leading-relaxed">
            Estamos aqui para simplificar sua jornada e encontrar a melhor
            solução para o seu caso. Nossa equipe oferece atendimento humanizado
            e eficiente, sempre respeitando sua individualidade.
          </p>
          <div className="space-y-6">
            <p className="text-sm opacity-70 italic">
              Primeira consulta para análise de viabilidade gratuita.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
