"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, User, Quote } from "lucide-react";

interface SuccessStory {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    avatar?: string;
  } | null;
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
}

export default function SuccessStoriesCarousel() {
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch success stories
  useEffect(() => {
    const fetchSuccessStories = async () => {
      try {
        const response = await fetch("/api/success-stories?limit=6");
        const data = await response.json();

        if (data.success) {
          // Filter out stories with null userId to prevent errors
          const validStories = data.data.filter((story: SuccessStory) => story.userId !== null);
          setSuccessStories(validStories);
        }
      } catch (error) {
        console.error("Error fetching success stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessStories();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (successStories.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === successStories.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [successStories.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === successStories.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? successStories.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="py-16 bg-gradient-to-b from-[#006699] to-blue-800 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
          <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-24 right-64 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-80 right-16 text-cyan-300 opacity-20 text-lg">+</div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-300 mx-auto"></div>
            <p className="text-blue-100 mt-4">Loading success stories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (successStories.length === 0) {
    return null; // Don't render if no success stories
  }

  return (
    <section className="py-16 bg-gradient-to-b from-[#006699] to-blue-800 relative overflow-hidden">
      {/* Decorative background elements matching hero section */}
      <div className="absolute inset-0">
        <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
        <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-24 right-64 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-80 right-16 text-cyan-300 opacity-20 text-lg">+</div>
        
        {/* Flowing lines similar to hero */}
        <div className="absolute -right-20 top-1/2 w-96 h-96 bg-gradient-to-l from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -left-20 bottom-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-cyan-300 mr-2" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Success Stories
            </h2>
          </div>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Discover how our platform has helped users achieve their goals and build meaningful connections
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Carousel */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-blue-500/20">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {successStories.map((story, index) => (
                <div
                  key={story._id}
                  className="w-full flex-shrink-0 relative"
                >
                  {/* Background */}
                  <div className="relative h-96 md:h-80 bg-gradient-to-br from-blue-700 to-[#006699]">
                    {story.image && (
                      <img
                        src={story.image}
                        alt={story.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                      />
                    )}
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#006699]/80 to-transparent" />
                    
                    {/* Story Content */}
                    <div className="relative h-full flex items-center justify-center p-8">
                      <div className="text-center text-white max-w-3xl">
                        <Quote className="w-10 h-10 text-cyan-300 mx-auto mb-4" />
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                          {story.title}
                        </h3>
                        <p className="text-lg md:text-xl text-blue-100 mb-6 leading-relaxed">
                          {story.description}
                        </p>
                        
                        {/* User Info */}
                        <div className="flex items-center justify-center">

                          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-cyan-300/20">

                            {story.userId?.avatar ? (
                              <img
                                src={story.userId.avatar}
                                alt={`${story.userId.firstName} ${story.userId.lastName}`}
                                className="w-10 h-10 rounded-full mr-3 border-2 border-cyan-300/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-cyan-300/20 flex items-center justify-center mr-3 border-2 border-cyan-300/30">
                                <User className="w-5 h-5 text-cyan-300" />
                              </div>
                            )}
                            <div className="text-left">

                              <p className="font-semibold text-sm text-white">
                                {story.userId ? `${story.userId.firstName} ${story.userId.lastName}` : 'Anonymous User'}
                              </p>
                              <p className="text-xs text-blue-200">
                                {new Date(story.publishedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {successStories.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200 border border-cyan-300/20"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200 border border-cyan-300/20"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {successStories.length > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {successStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-cyan-300 w-8"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>


      </div>
    </section>
  );
}