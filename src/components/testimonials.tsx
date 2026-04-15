import { Star, Quote, ExternalLinkIcon } from 'lucide-react';
import { FadeIn } from './fade-in';

export const Testimonials = () => {
  const testimonials = [
    {
      name: 'Pamela Santos',
      text: 'Excelente profissionais, atenciosas e cuidadosas. Cuidaram do meu processo do início ao fim. Me senti super amparada e segura.',
      image:
        'https://lh3.googleusercontent.com/a-/ALV-UjXxrqKaCwp3XyGhBAuEcTE5xRCcxvz_DiKiVJ6Y7G7ZOpYv9Wg=w90-h90-p-rp-mo-br100',
      href: 'https://maps.app.goo.gl/CRmpXt1i6ZV4hAAi6',
      arialabel: 'Depoimento sobre Correa & Laia Advocacia',
    },
    {
      name: 'Iza Cristina',
      text: 'Excelentes profissionais, atendimento ágil... Ajudaram demais a empresa onde trabalho, super indico! 👏',
      image:
        'https://lh3.googleusercontent.com/a-/ALV-UjUhYW7FXT1aZwA_NDJofJZSOWmpPx8KlJq65V5RdTrvX5J_jscSzQ=w45-h45-p-rp-mo-ba4-br100',
      href: 'https://maps.app.goo.gl/5atFxn1uGigSDeQ69',
      arialabel: 'Depoimento sobre Correa & Laia Advocacia',
    },
    {
      name: 'Thauana Santos',
      text: 'Super atenciosa, educada, dá retorno rápido e me explicou tudo que precisava, bem simples e prático.',
      image:
        'https://lh3.googleusercontent.com/a-/ALV-UjVL5kvM6Fc2HF72IWtTreLEDzTDOdRAHg9EdI0xGZB0wkpRAICM=w45-h45-p-rp-mo-br100',
      href: 'https://maps.app.goo.gl/E7hsxSKS8iGrmgfB8',
      arialabel: 'Depoimento sobre Correa & Laia Advocacia',
    },
  ];

  return (
    <section id="depoimentos" className="py-20 bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
              Feedbacks
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand mt-4">
              O QUE DIZEM NOSSOS CLIENTES
            </h3>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-10 md:gap-12">
          {testimonials.map((item, index) => (
            <FadeIn
              key={index}
              delay={index * 0.1}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative group hover:shadow-xl transition-shadow"
            >
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                <Quote size={20} />
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-brand/70 italic leading-relaxed mb-8">
                "{item.text}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-bold text-brand">{item.name}</div>
                  <div className="text-xs text-primary font-semibold uppercase tracking-wider">
                    Cliente Satisfeito
                  </div>
                  <div className="mt-2">
                    <a
                      aria-label={item.arialabel}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon
                        size={16}
                        className="inline-block text-primary mt-1"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
