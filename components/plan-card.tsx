import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plan } from '@/lib/db';

interface PlanCardProps {
  plan: Plan;
}

const colorClasses = [
  'bg-mint border-primary',
  'bg-yellow border-secondary',
  'bg-purple border-accent',
  'bg-cyan border-primary',
];

export function PlanCard({ plan }: PlanCardProps) {
  const colorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];

  return (
    <Card className={`group ${colorClass} border-4 border-foreground/10 shadow-2xl hover-lift card-tilt card-stack transition-all duration-300 overflow-hidden relative touch-ripple`}>
      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      {/* Decorative Corner Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-bl-full"></div>

      {/* Floating Sparkle */}
      <div className="absolute top-2 right-2 text-2xl animate-bounce-subtle pointer-events-none">✨</div>

      <CardHeader className="pb-4 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <Badge className="bg-foreground text-white font-black uppercase text-xs px-4 py-2 rounded-full shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 pulse-glow">
            {plan.region_code}
          </Badge>
          <div className="text-right">
            <div className="text-4xl md:text-5xl font-black text-foreground">
              ${plan.retail_price}
            </div>
            <div className="text-xs font-black uppercase text-muted-foreground">
              {plan.currency}
            </div>
          </div>
        </div>
        <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight tracking-tight">{plan.name}</h3>
      </CardHeader>

      <CardContent className="pb-6 relative z-10">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border-2 border-foreground/5">
            <span className="font-black uppercase text-xs tracking-wider">Data:</span>
            <span className="font-black text-2xl">{plan.data_gb} GB</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border-2 border-foreground/5">
            <span className="font-black uppercase text-xs tracking-wider">Valid for:</span>
            <span className="font-black text-2xl">{plan.validity_days} days</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-10">
        <Link href={`/plans/${plan.region_code.toLowerCase()}/${plan.id}`} className="w-full block">
          <Button className="w-full btn-lumbus bg-foreground text-white hover:bg-foreground/90 font-black text-base md:text-lg py-6 md:py-7 shadow-xl group/btn relative overflow-hidden touch-ripple elastic-bounce">
            <span className="relative z-10 flex items-center justify-center gap-2">
              BUY NOW
              <span className="opacity-0 group-hover/btn:opacity-100 transform translate-x-0 group-hover/btn:translate-x-2 transition-all duration-300 text-xl">→</span>
            </span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
