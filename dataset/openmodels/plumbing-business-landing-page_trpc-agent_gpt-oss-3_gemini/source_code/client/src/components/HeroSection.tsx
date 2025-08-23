import { Button } from '@/components/ui/button';


export function HeroSection() {
  return (
    <section className="bg-blue-600 text-white py-20 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Reliable Plumbing Services
        </h1>
        <p className="text-lg md:text-xl mb-8">
          Fast, professional, and affordable plumbing solutions for homes and businesses.
        </p>
        <Button asChild variant="secondary">
          <a href="#contact" className="inline-block">
            Get a Free Quote
          </a>
        </Button>
      </div>
    </section>
  );
}
