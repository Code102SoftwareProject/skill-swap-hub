import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Users, BookOpen, Shield, HelpCircle } from 'lucide-react';

const Footer: FC = () => {
  return (
    <footer className="bg-[#006699] text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="w-32 h-32 relative mb-4">
              <Image
                src="/logo.png"
                alt="SkillSwap Hub Logo"
                layout="fill"
                objectFit="contain"
                className="rounded-full"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3">SkillSwap Hub</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Connect, learn, and grow with our peer-to-peer skill exchange platform. Share your expertise and discover new skills from our global community.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-cyan-300" />
              Platform
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/how-it-works" className="text-blue-100 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/find-skills" className="text-blue-100 hover:text-white transition-colors">Find Skills</Link></li>
              <li><Link href="/teach-skills" className="text-blue-100 hover:text-white transition-colors">Teach Skills</Link></li>
              <li><Link href="/success-stories" className="text-blue-100 hover:text-white transition-colors">Success Stories</Link></li>
              <li><Link href="/community" className="text-blue-100 hover:text-white transition-colors">Community</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-cyan-300" />
              Support
            </h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/help" className="text-blue-100 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="text-blue-100 hover:text-white transition-colors">Safety Guidelines</Link></li>
              <li><Link href="/contact" className="text-blue-100 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/feedback" className="text-blue-100 hover:text-white transition-colors">Feedback</Link></li>
              <li><Link href="/report" className="text-blue-100 hover:text-white transition-colors">Report Issue</Link></li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-cyan-300" />
              Legal
            </h3>
            <ul className="space-y-3 text-sm mb-6">
              <li><Link href="/privacy" className="text-blue-100 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-blue-100 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/about" className="text-blue-100 hover:text-white transition-colors">About Us</Link></li>
            </ul>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-blue-100">
                <Mail className="w-4 h-4 mr-2 text-cyan-300" />
                <a href="mailto:support@skillswaphub.com" className="hover:text-white transition-colors">
                  support@skillswaphub.com
                </a>
              </div>
              <div className="flex items-center text-blue-100">
                <MapPin className="w-4 h-4 mr-2 text-cyan-300" />
                <span>Global Community Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-6 border-t border-blue-500">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-100 text-sm">
              © 2025 SkillSwap Hub. All rights reserved.
            </p>
            <div className="flex items-center mt-4 md:mt-0 space-x-6">
              <div className="flex items-center text-cyan-300 text-sm">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>Learn • Teach • Grow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;