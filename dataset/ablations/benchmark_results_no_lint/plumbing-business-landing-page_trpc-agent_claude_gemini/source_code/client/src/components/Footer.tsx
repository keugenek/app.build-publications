export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">🔧 Pro Plumbing Services</h3>
            <p className="text-gray-300 mb-4">
              Your trusted local plumbing experts serving the metro area with professional, 
              reliable service for over 15 years.
            </p>
            <div className="flex space-x-4">
              <span className="text-2xl cursor-pointer hover:text-blue-400">📘</span>
              <span className="text-2xl cursor-pointer hover:text-blue-400">📷</span>
              <span className="text-2xl cursor-pointer hover:text-yellow-400">⭐</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Emergency Repairs</li>
              <li>• Drain Cleaning</li>
              <li>• Water Heater Service</li>
              <li>• Pipe Installation</li>
              <li>• Bathroom Plumbing</li>
              <li>• Preventive Maintenance</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Get In Touch</h4>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-center">
                <span className="mr-2">📞</span>
                (555) 123-PIPE
              </p>
              <p className="flex items-center">
                <span className="mr-2">📧</span>
                info@proplumbing.com
              </p>
              <p className="flex items-center">
                <span className="mr-2">📍</span>
                Greater Metro Area
              </p>
              <p className="text-orange-400 font-semibold">
                🚨 24/7 Emergency Service Available
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Pro Plumbing Services. All rights reserved.</p>
          <p className="mt-2">Licensed • Insured • Bonded</p>
        </div>
      </div>
    </footer>
  );
}
