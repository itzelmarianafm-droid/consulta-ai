export default function InsightCard() {
  return (
    <article className="bg-ink text-paper rounded-lg px-6 py-5 relative overflow-hidden shadow-md">
      <div className="absolute -top-12 -right-12 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,var(--accent)_0%,transparent_65%)] opacity-45 pointer-events-none" />

      <div className="text-[10px] tracking-[0.18em] uppercase text-paper/55 mb-3.5 relative z-10">
        Insight de la semana
      </div>

      <p className="font-serif italic text-[19px] leading-[1.45] font-light relative z-10 mb-5 pl-2">
        <span className="absolute -top-8 -left-2.5 text-[64px] text-accent opacity-55 font-normal not-italic">&ldquo;</span>
        El cuello de botella esta semana fue el paso del precalificado al pago — 47 personas vieron el link y no lo abrieron. Activé un seguimiento con video testimonial 24h después.
      </p>

      <div className="flex gap-7 border-t border-paper/[0.12] pt-4 relative z-10 flex-wrap">
        <div>
          <div className="text-[10px] tracking-[0.16em] uppercase text-paper/55">Recuperados</div>
          <div className="font-serif text-2xl font-normal mt-1">19<span className="text-xs opacity-55 font-sans"> de 47</span></div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.16em] uppercase text-paper/55">Ingreso recuperado</div>
          <div className="font-serif text-2xl font-normal mt-1">$76,300</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.16em] uppercase text-paper/55">Confianza IA</div>
          <div className="font-serif text-2xl font-normal mt-1">94<span className="text-xs opacity-55 font-sans">%</span></div>
        </div>
      </div>
    </article>
  );
}
