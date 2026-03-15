'use client';

export function WrenchAnimation() {
  return (
    <div className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-6 flex flex-col items-center justify-center min-h-[220px] overflow-hidden">
      <div className="w-full max-w-[420px] px-2 sm:px-4">
        <div className="relative h-20 overflow-hidden">
          <div className="autocare-road-line absolute bottom-7 left-[-30%] h-px w-[160%] bg-repeat-x opacity-80" />
          <div className="autocare-road-glow absolute bottom-5 left-[-20%] h-5 w-[140%] opacity-70 blur-md" />
          <div className="autocare-road-dashes absolute bottom-[1.95rem] left-[-25%] h-[2px] w-[150%] opacity-45" />

          <div className="absolute inset-x-0 bottom-8 flex justify-center opacity-95">
            <div className="relative h-8 w-16 sm:h-9 sm:w-20">
              <div className="absolute bottom-2 left-1.5 h-4 w-12 rounded-[0.8rem] bg-redPrimary/95 sm:h-5 sm:w-16" />
              <div className="absolute bottom-[1.15rem] left-[0.9rem] h-[0.35rem] w-[0.5rem] rounded-r-full bg-redMuted/65 sm:left-[1.1rem] sm:w-[0.6rem]" />
              <div className="absolute bottom-[1.2rem] right-[0.65rem] h-[0.45rem] w-[0.7rem] rounded-l-full bg-whitePure/80 sm:right-[0.8rem] sm:w-[0.85rem]" />

              <div className="absolute bottom-5 left-[1.1rem] h-3 w-7 rounded-t-[0.95rem] rounded-b-sm bg-redPrimary/95 sm:left-[1.4rem] sm:h-4 sm:w-9" />
              <div className="absolute bottom-[1.45rem] left-[1.35rem] h-2 w-2.5 rounded-t-sm rounded-br-[2px] bg-whitePure/85 sm:left-[1.7rem] sm:h-2.5 sm:w-3" />
              <div className="absolute bottom-[1.45rem] left-[3.1rem] h-2 w-2 rounded-t-sm rounded-bl-[2px] bg-whitePure/72 sm:left-[4.25rem] sm:h-2.5 sm:w-2.5" />
              <div className="absolute bottom-[1.42rem] left-[2.85rem] h-2 w-px bg-redPrimary/45 sm:left-[3.95rem] sm:h-2.5" />

              <div className="absolute bottom-0.5 left-2.5 h-3.5 w-3.5 rounded-full border border-blackPrimary bg-black sm:left-3 sm:h-4 sm:w-4 autocare-wheel-spin" />
              <div className="absolute bottom-0.5 right-2.5 h-3.5 w-3.5 rounded-full border border-blackPrimary bg-black sm:right-3 sm:h-4 sm:w-4 autocare-wheel-spin" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-textSecondary/90">
        Keeping your vehicles in motion
      </p>
    </div>
  );
}
