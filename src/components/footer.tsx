export const Footer = () => {
  return (
    <footer className="bg-brand text-white border-t border-white/10">
      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                <path d="M50 10C27.9 10 10 27.9 10 50s17.9 40 40 40 40-17.9 40-40S72.1 10 50 10zm0 75c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35z" />
                <text
                  x="50"
                  y="58"
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="bold"
                  className="font-display"
                >
                  CL
                </text>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-sm tracking-widest">
                CORREA & LAIA
              </span>
              <span className="text-[8px] tracking-[0.3em] uppercase opacity-60">
                ADVOCACIA
              </span>
            </div>
          </div>

          <div className="text-xs opacity-60 tracking-wider text-center md:text-right">
            © {new Date().getFullYear()} Correa & Laia Advocacia. Todos os
            direitos reservados.
            <br />
            Desenvolvido com excelência jurídica.
          </div>
        </div>
      </div>

      <div className="bg-[#fafafa] py-8 px-6 text-brand/60 text-[10px] md:text-xs leading-relaxed">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p>
            Este site não faz parte do Google nem do Facebook ou do Facebook
            Inc. Além disso, não oferecemos nenhum tipo de serviço oficial do
            governo, NÃO praticamos fraude, não somos uma empresa que vende
            criptoativos ou qualquer outro serviço.
          </p>
          <p className="font-semibold">
            Essa empresa trabalha exclusivamente com serviços jurídicos.
          </p>
        </div>
      </div>
    </footer>
  );
};
