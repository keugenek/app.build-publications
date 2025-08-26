import './App.css';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import { ContactForm } from '@/components/ContactForm';

function App() {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <header className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">ProPlumb Solutions</h1>
          <p className="text-xl md:text-2xl mb-6">Professional plumbing services you can trust.</p>
          <a href="#contact" className="inline-block bg-white text-primary font-semibold px-6 py-3 rounded-md shadow-md hover:bg-gray-100 transition">
            Get a Free Quote
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Services />
        <Testimonials />
        <ContactForm />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-200 py-4 text-center">
        <p>© {new Date().getFullYear()} ProPlumb Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
