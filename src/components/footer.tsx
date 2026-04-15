export const Footer = () => {
  return (
    <footer className="bg-brand text-white border-t border-white/10">
      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="/logofooter.png" alt="logo" width={96} height={48} />
            </div>
          </div>

          <div className="text-xs opacity-80 tracking-wider text-center md:text-right">
            © {new Date().getFullYear()} Correa & Laia Advocacia. Todos os
            direitos reservados.
            <br />
            Desenvolvido com excelência jurídica.
          </div>
        </div>
      </div>

      <div className="bg-[#fafafa] py-8 px-6 text-brand/80 text-[10px] md:text-xs leading-relaxed">
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
