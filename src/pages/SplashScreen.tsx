import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-1000">
        {/* Logo */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
            <img src="/images/logosecretos.png" alt="Secretos de Belleza" className="w-24 h-24 object-contain" />
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Secretos de Belleza
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Tu belleza, nuestra pasión
          </p>
        </div>

        {/* Progress */}
        <div className="w-80 space-y-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Preparando tu experiencia de belleza...
          </p>
        </div>
      </div>
    </div>
  );
}