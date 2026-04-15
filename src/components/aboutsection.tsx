import { FadeIn } from './fade-in';

export const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 bg-[#fdfcfb]">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <FadeIn className="order-2 lg:order-1">
          <div className="relative max-w-md mx-auto lg:mx-0">
            <div className="rounded-3xl overflow-hidden shadow-2xl aspect-4/5">
              <img
                src="/luizas.webp"
                alt="Correa & Laia Advocacia"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={600}
                height={750}
              />
            </div>
            <div className="absolute -bottom-24 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-60 hidden sm:block">
              <p className="text-xs italic text-brand/70 leading-relaxed">
                "Nossa missão é transformar o Direito do Trabalho em uma
                ferramenta de justiça real para o trabalhador brasileiro."
              </p>
              <div className="mt-3 font-bold text-primary text-sm">
                — Correa & Laia Advocacia
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="space-y-8 order-1 lg:order-2">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">
              Sobre as Especialistas
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand mt-4">
              Correa & Laia Advocacia
            </h3>
            <p className="text-primary font-semibold mt-2">OAB/MG 212.802</p>
          </FadeIn>

          <FadeIn
            delay={0.2}
            className="space-y-6 text-brand/70 leading-relaxed"
          >
            <p>
              Dra. Luiza Laia é graduada em Direito pela Pontificia Universidade
              Católica de Minas Gerais – PUC Minas – em 2020 e Pós Graduada em
              Direito Processual Trabalhista pela ESA/OAB. Possui grande
              experiência na área do direito trabalhista e privado através de
              uma advocacia artesanal, visando uma justiça efetiva e rápida.
            </p>
            <p>
              Dra. Luiza Corrêa é graduada em Direito pela Universidade Salgado
              de Oliveira – em 2013 e Pós-Graduanda em Holding e Proteção
              Patrimônio – Família e Empresa. Possui experiência em Direito
              Cívil na área de Contratos e Sucessões.
            </p>
            <p>
              Juntas, construímos um escritório pautado pela excelência, ética e
              respeito, pronto para oferecer soluções jurídicas que fazem a
              diferença.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
