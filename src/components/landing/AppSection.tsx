import { CheckCircle } from "lucide-react";

const features = [
  "Ver sua escala (louvor, kids, mídia…)",
  "Acompanhar eventos da igreja",
  "Ler o devocional do dia",
  "Acessar a Bíblia",
  "Receber avisos importantes",
  "Atualizar seus dados pessoais",
];

export default function AppSection() {
  return (
    <section className="py-20 md:py-28 bg-[#0F1C4D]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 bg-[#2563EB]/10 rounded-3xl rotate-2 scale-105" />
              <div className="relative bg-[#0A0F2C] rounded-3xl p-6 shadow-2xl border border-[#2563EB]/15">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-[#0A0F2C] font-bold text-lg">
                    ⛪
                  </div>
                  <div>
                    <p className="font-bold text-white">Igreja Vida Nova</p>
                    <p className="text-sm text-[#9CA3AF]">App personalizado</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["📅 Escalas", "📖 Bíblia", "🙏 Oração", "📢 Avisos", "👥 Células", "🎓 Cursos"].map((item) => (
                    <div key={item} className="bg-[#0F1C4D] rounded-xl p-3 text-center border border-[#1E3A8A]/20">
                      <p className="text-xs font-medium text-white/80">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-[#FACC15]/10 rounded-xl p-3 border border-[#FACC15]/20">
                  <p className="text-xs font-bold text-[#FACC15]">⏰ Próxima escala</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Louvor · Domingo 19h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="text-[#FACC15] font-bold text-sm tracking-widest uppercase mb-4">
              EXPERIÊNCIA DO MEMBRO
            </p>

            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 text-white">
              Membros abrem o app e{" "}
              <span className="text-[#FACC15]">encontram tudo</span>
            </h2>

            <p className="text-base md:text-lg text-[#9CA3AF] mb-8">
              Tudo na palma da mão, com a cara da sua igreja.
            </p>

            <div className="space-y-4">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#FACC15] flex-shrink-0" />
                  <span className="text-sm md:text-base font-medium text-white/90">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
