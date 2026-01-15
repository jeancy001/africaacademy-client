// Footer.tsx
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const FooterPage = () => {
  return (
    <footer className="bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600 text-white py-12 px-6 sm:px-12 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold">Okapi Junior Academia</h2>
          <p className="text-gray-200 text-sm sm:text-base">
            Empowering young minds with quality education and fun learning experiences.
          </p>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="hover:text-gray-300 transition-colors duration-200">
              <FaFacebookF />
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors duration-200">
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors duration-200">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors duration-200">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-gray-200 text-sm sm:text-base">
            <li>
              <a href="#" className="hover:text-white transition-colors duration-200">Home</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors duration-200">About Us</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors duration-200">Courses</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors duration-200">Admissions</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors duration-200">Contact</a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
          <p className="text-gray-200 text-sm sm:text-base">📍 123 Learning St, Nairobi,Kenya</p>
          <p className="text-gray-200 text-sm sm:text-base">📞 +243 00000000000</p>
          <p className="text-gray-200 text-sm sm:text-base">✉️ info@okapijunior.com</p>
        </div>

        {/* Newsletter */}
        <div className="w-full">
          <h3 className="text-xl font-semibold mb-4">Subscribe</h3>
          <p className="text-gray-200 mb-4 text-sm sm:text-base">
            Get the latest news and updates about our courses.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 flex-1 rounded-md sm:rounded-l-lg sm:rounded-r-none text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base w-full"
            />
            <button
              type="submit"
              className="bg-indigo-500 text-white font-semibold px-6 py-2 rounded-md sm:rounded-r-lg sm:rounded-l-none hover:bg-indigo-600 transition duration-300 ease-in-out shadow-md hover:shadow-lg flex items-center justify-center text-sm sm:text-base w-full sm:w-auto"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="mt-12 border-t border-gray-400 pt-6 text-center text-gray-300 text-xs sm:text-sm">
        &copy; {new Date().getFullYear()} Okapi Junior Academia. All rights reserved.
      </div>
    </footer>
  );
};

export default FooterPage;
