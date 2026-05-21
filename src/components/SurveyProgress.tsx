import { Check } from 'lucide-react';

interface SurveyProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export default function SurveyProgress({ currentStep, totalSteps, stepTitles }: SurveyProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6 px-4">
      {/* Progress Line and Nodes */}
      <div className="relative flex items-center justify-between">
        {/* Progress tracks background line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-150 -z-10" />
        
        {/* Progress colored filler line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 -z-10"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 text-white" /> : stepNumber}
              </div>
              <span 
                className={`hidden md:block text-[11px] font-semibold mt-1.5 transition-colors duration-350 ${
                  isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {stepTitles[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
