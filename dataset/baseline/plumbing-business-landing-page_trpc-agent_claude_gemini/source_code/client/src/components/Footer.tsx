import { Phone, Mail, MapPin, Clock, Shield, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">Professional Plumbing</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Your trusted local plumbing experts providing reliable, professional service 
              24/7. Licensed, insured, and committed to your satisfaction.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center text-blue-400">
                <Shield className="h-4 w-4 mr-2" />
                <span className="text-sm">Licensed</span>
              </div>
              <div className="flex items-center text-blue-400">
                <Award className="h-4 w-4 mr-2" />
                <span className="text-sm">Insured</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <button 
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Emergency Plumbing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Drain Cleaning
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Water Heater Repair
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Bathroom Plumbing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    const servicesSection = document.getElementById('services');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Pipe Installation
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-blue-400" />
                <a href="tel:+1-555-PLUMBER" className="hover:text-blue-400 transition-colors">
                  (555) PLUMBER
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-blue-400" />
                <a href="mailto:info@yourplumbing.com" className="hover:text-blue-400 transition-colors">
                  info@yourplumbing.com
                </a>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-3 text-blue-400" />
                <span>Greater Metropolitan Area</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-3 text-blue-400" />
                <span className="text-blue-400 font-semibold">24/7 Emergency</span>
              </div>
              <div className="text-sm">
                <p>Monday - Friday</p>
                <p className="text-blue-400">7:00 AM - 7:00 PM</p>
              </div>
              <div className="text-sm">
                <p>Saturday - Sunday</p>
                <p className="text-blue-400">8:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Professional Plumbing. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Service Areas</a>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-red-600 py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white text-sm font-medium">
            🚨 PLUMBING EMERGENCY? Don't wait - call now: 
            <a href="tel:+1-555-PLUMBER" className="ml-2 text-yellow-300 hover:text-yellow-200 font-bold">
              (555) PLUMBER
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
