import { FC, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  image: string;
  rating: number;
}

const SuccessStories: FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Emma T.',
      role: 'Small Business Owner',
      content: 'I met Raj through SkillSwap, and we traded skills—he built my website, and I helped with his social media. My customer engagement increased, and he gained new clients. A true win-win!',
      image: '/api/placeholder/80/80',
      rating: 5
    },
    {
      id: 2,
      name: 'Emma T.',
      role: 'Small Business Owner',
      content: 'I met Raj through SkillSwap, and we traded skills—he built my website, and I helped with his social media. My customer engagement increased, and he gained new clients. A true win-win!',
      image: '/api/placeholder/80/80',
      rating: 5
    },
    {
      id: 3,
      name: 'Michael R.',
      role: 'Graphic Designer',
      content: 'SkillSwap connected me with a marketing specialist. I designed her logo, and she helped me with SEO. My portfolio gets way more traffic now!',
      image: '/api/placeholder/80/80',
      rating: 4
    },
    {
      id: 4,
      name: 'Sarah L.',
      role: 'Web Developer',
      content: 'Through SkillSwap, I found someone to help me with accounting while I built their e-commerce site. Saved us both thousands in professional fees!',
      image: '/api/placeholder/80/80',
      rating: 5
    }
  ];

  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState<number | null>(null);

  // Check if scrolling is possible in either direction
  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
      
      // Update active index based on scroll position
      const itemWidth = scrollWidth / testimonials.length;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (canScrollRight && !isHovered) {
        scroll('right');
      } else if (!canScrollLeft && !isHovered) {
        // Reset to beginning when reaching the end
        if (sliderRef.current) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setTimeout(checkScroll, 500);
        }
      }
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(timer);
  }, [canScrollRight, canScrollLeft, isHovered]);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 400; // adjust as needed
      const newPosition = direction === 'left'
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount;
        
      sliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });

      // Update button states after scrolling
      setTimeout(checkScroll, 500);
    }
  };

  // Generate random floating bubbles in the background
  const renderBubbles = () => {
    const bubbles = [];
    for (let i = 0; i < 12; i++) {
      const size = Math.floor(Math.random() * 30) + 10;
      const left = Math.floor(Math.random() * 100);
      const animationDuration = Math.floor(Math.random() * 15) + 10;
      const animationDelay = Math.floor(Math.random() * 10);
      
      bubbles.push(
        <div 
          key={i}
          className="absolute rounded-full bg-blue-200 opacity-20"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            bottom: '-20px',
            animation: `float ${animationDuration}s infinite ease-in-out ${animationDelay}s`
          }}
        />
      );
    }
    return bubbles;
  };

  return (
    <div className="bg-gradient-to-b text-black from-blue-50 to-blue-100 py-16 px-4 relative overflow-hidden">
      {/* Animated background bubbles */}
      {renderBubbles()}
      
      <div className="container mx-auto relative z-10">
        {/* Animated heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 relative animate-fade-in">
          <span className="relative inline-block">
            Our Success Stories
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-blue-600 transform scale-x-0 animate-expand"></span>
          </span>
        </h2>
        
        <div className="relative">
          {/* Left scroll button */}
          <button 
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white shadow-lg rounded-full p-2 z-10 hover:bg-blue-100 transition-all duration-300 transform hover:scale-110 ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : 'opacity-100 animate-pulse-slow'}`}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} className="text-blue-600" />
          </button>
          
          {/* Testimonials slider */}
          <div 
            ref={sliderRef}
            className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar"
            onScroll={checkScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id}
                className={`flex-shrink-0 rounded-lg p-6 w-full md:w-2/3 lg:w-1/2 transform transition-all duration-500 ${
                  activeIndex === index ? 'scale-100' : 'scale-95'
                }`}
                style={{ 
                  minWidth: '300px', 
                  maxWidth: '600px',
                  background: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)',
                  boxShadow: '0 10px 25px -5px rgba(3, 105, 161, 0.3)'
                }}
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white transform transition-transform duration-500 hover:scale-110">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Animated pulse ring around avatar */}
                    <div className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-white"></div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <h3 className="text-xl font-bold text-white">{testimonial.name} <span className="font-normal">({testimonial.role})</span></h3>
                      <div className="ml-auto flex text-yellow-300">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={16} fill="currentColor" className="animate-twinkle" style={{ animationDelay: `${i * 0.2}s` }}/>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-white relative overflow-hidden">
                      <p className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>{testimonial.content}</p>
                      
                      {/* Animated quotation marks */}
                      <span className="absolute -top-2 -left-1 text-4xl opacity-20 font-serif">"</span>
                      <span className="absolute -bottom-8 -right-1 text-4xl opacity-20 font-serif">"</span>
                    </div>
                    
                    {/* Skills badge */}
                    <div className="mt-4 inline-block bg-blue-900 bg-opacity-50 px-3 py-1 rounded-full text-sm text-white animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                      #SkillSwap Success
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Right scroll button */}
          <button 
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white shadow-lg rounded-full p-2 z-10 hover:bg-blue-100 transition-all duration-300 transform hover:scale-110 ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : 'opacity-100 animate-pulse-slow'}`}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} className="text-blue-600" />
          </button>
          
          {/* Pagination dots */}
          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeIndex === index ? 'bg-blue-600 w-6' : 'bg-blue-300'
                }`}
                onClick={() => {
                  if (sliderRef.current) {
                    const itemWidth = sliderRef.current.scrollWidth / testimonials.length;
                    sliderRef.current.scrollTo({
                      left: itemWidth * index,
                      behavior: 'smooth'
                    });
                    setTimeout(checkScroll, 500);
                  }
                }}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* CSS for animations and scrollbar hiding */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-100px);
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        
        @keyframes expand {
          to {
            transform: scaleX(1);
          }
        }
        
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out forwards;
        }
        
        .animate-expand {
          animation: expand 1s ease-out forwards 0.5s;
        }
      `}</style>
    </div>
  );
};

export default SuccessStories;