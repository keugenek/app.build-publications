import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onContactClick: () => void;
}

export function HeroSection({ onContactClick }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          🔧 Professional Plumbing Services
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          24/7 Emergency Service • Licensed & Insured • Satisfaction Guaranteed
        </p>
        <p className="text-lg mb-10 max-w-2xl mx-auto">
          From emergency repairs to complete installations, we're your trusted local plumbing experts. 
          Fast, reliable service when you need it most.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onContactClick}
            size="lg" 
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
          >
            Get Free Quote 💰
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-white text-white hover:bg-white hover:text-blue-800 px-8 py-4 text-lg"
          >
            Call Now: (555) 123-PIPE 📞
          </Button>
        </div>
      </div>
    </section>
  );
}
