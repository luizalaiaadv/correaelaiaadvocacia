'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { FadeIn } from './fade-in';

export const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Quais documentos preciso para uma consulta trabalhista?',
      answer:
        'Geralmente solicitamos a Carteira de Trabalho (física ou digital), Termo de Rescisão (se houver), contracheques dos últimos meses e extrato do FGTS.',
    },
    {
      question: 'Quanto tempo demora um processo trabalhista?',
      answer:
        'O tempo varia conforme a complexidade do caso e a comarca. Em média, processos podem levar de 6 meses a 2 anos, mas muitos casos são resolvidos via acordo em menos tempo.',
    },
    {
      question: 'Preciso pagar algo para iniciar o processo?',
      answer:
        'Trabalhamos com o modelo de honorários ad exitum na maioria dos casos, ou seja, você só paga uma porcentagem ao final do processo, quando receber seus direitos.',
    },
    {
      question: 'Fui demitido e não recebi nada, o que fazer?',
      answer:
        'Isso é uma irregularidade grave. Você deve procurar um advogado imediatamente para ingressar com uma ação de cobrança de verbas rescisórias e multas previstas em lei.',
    },
    {
      question: 'Posso processar a empresa ainda trabalhando nela?',
      answer:
        'Sim, é possível. No entanto, analisamos cada caso estrategicamente para evitar retaliações ou situações insustentáveis no ambiente de trabalho.',
    },
    {
      question: 'O que é rescisão indireta?',
      answer:
        'É a "justa causa" aplicada pelo empregado ao empregador quando este descumpre obrigações contratuais graves, permitindo que o trabalhador saia com todos os seus direitos.',
    },
    {
      question: 'Como funciona o cálculo das horas extras?',
      answer:
        'As horas extras devem ser pagas com um adicional de no mínimo 50% sobre o valor da hora normal. Se realizadas em domingos ou feriados, o adicional costuma ser de 100%.',
    },
    {
      question: 'O que caracteriza o assédio moral no trabalho?',
      answer:
        'Caracteriza-se pela exposição do trabalhador a situações humilhantes e constrangedoras, repetitivas e prolongadas, durante a jornada de trabalho e no exercício de suas funções.',
    },
    {
      question: 'Tenho direito a indenização por acidente de trabalho?',
      answer:
        'Sim, caso fique comprovada a culpa ou negligência da empresa, o trabalhador tem direito a indenizações por danos morais, estéticos e materiais (como despesas médicas e pensão).',
    },
  ];

  return (
    <section id="faq" className="py-20 bg-[#fdfcfb]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Dúvidas</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand mt-4">
              PERGUNTAS FREQUENTES
            </h3>
          </FadeIn>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <FadeIn key={index} delay={index * 0.05}>
              <div className="border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-xl/20">
                <button
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-brand">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-primary transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6 pt-0 text-brand/70 text-sm leading-relaxed border-t border-gray-50">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
