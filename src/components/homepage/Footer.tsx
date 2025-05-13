import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer: FC = () => {
  return (
    <footer className="bg-[#006699] text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start">
          {/* Left side - Logo */}
          <div className="mb-8 md:mb-0">
            <div className="w-40 h-40 relative">
                <Image
                    src="/logo.png"
                    alt="Skill-Swap Logo"
                    layout="fill"
                    objectFit="contain"
                    className="rounded-full"
                />
            </div>
          </div>

          {/* Center - Learn More */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-semibold mb-4">Learn More</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:underline">About</Link></li>
              <li><Link href="/press-release" className="hover:underline">Press Release</Link></li>
              <li><Link href="/environment" className="hover:underline">Environment</Link></li>
              <li><Link href="/jobs" className="hover:underline">Jobs</Link></li>
              <li><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/contact-us" className="hover:underline">Contact Us</Link></li>
            </ul>
          </div>

          {/* Center - Skills */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-semibold mb-4">Skills</h3>
            <ul className="space-y-2">
              <li><Link href="/skills/lift" className="hover:underline">Lift Skills</Link></li>
              <li><Link href="/skills/wood" className="hover:underline">Wood</Link></li>
              <li><Link href="/skills/web-design" className="hover:underline">Web Design</Link></li>
            </ul>
          </div>

          {/* Right - Contact Info */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>Hotline: <a href="tel:123-456-7890" className="hover:underline">123-456-7890</a></li>
              <li>HQOffice: <a href="tel:123-456-7890" className="hover:underline">123-456-7890</a></li>
            </ul>
          </div>

          {/* Far Right - Social Icons */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Social</h3>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="hover:text-blue-300">
                <Facebook size={24} />
              </Link>
              <Link href="#" aria-label="Instagram" className="hover:text-blue-300">
                <Instagram size={24} />
              </Link>
              <Link href="#" aria-label="Twitter" className="hover:text-blue-300">
                <Twitter size={24} />
              </Link>
              <Link href="#" aria-label="YouTube" className="hover:text-blue-300">
                <Youtube size={24} />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-blue-500 text-center">
          <p>© 2025 Skill-Swap | All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;