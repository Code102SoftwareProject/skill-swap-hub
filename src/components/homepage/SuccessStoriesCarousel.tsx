"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, User, Quote } from "lucide-react";

interface SuccessStory {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
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
          setSuccessStories(data.data);
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
      <div className="py-16 bg-gradient-to-r from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading success stories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (successStories.length === 0) {
    return null; // Don't render if no success stories
  }

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-yellow-500 mr-2" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Success Stories
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Discover how our platform has helped users achieve their goals and build meaningful connections
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Carousel */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {successStories.map((story, index) => (
                <div
                  key={story._id}
                  className="w-full flex-shrink-0 relative"
                >
                  {/* Background Image */}
                  <div className="relative h-96 md:h-80 bg-gradient-to-br from-blue-600 to-purple-700">
                    {story.image && (
                      <img
                        src={story.image}
                        alt={story.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    )}
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Story Content */}
                    <div className="relative h-full flex items-center justify-center p-8">
                      <div className="text-center text-white max-w-3xl">
                        <Quote className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                          {story.title}
                        </h3>
                        <p className="text-lg md:text-xl text-gray-200 mb-6 leading-relaxed">
                          {story.description}
                        </p>
                        
                        {/* User Info */}
                        <div className="flex items-center justify-center">
                          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            {story.userId.avatar ? (
                              <img
                                src={story.userId.avatar}
                                alt={`${story.userId.firstName} ${story.userId.lastName}`}
                                className="w-10 h-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            <div className="text-left">
                              <p className="font-semibold text-sm">
                                {story.userId.firstName} {story.userId.lastName}
                              </p>
                              <p className="text-xs text-gray-300">
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-200"
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
                      ? "bg-blue-600 w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Small Cards Preview */}
        {successStories.length > 3 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.slice(0, 3).map((story, index) => (
              <div
                key={story._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => goToSlide(index)}
              >
                <div className="flex items-center mb-3">
                  {story.userId.avatar ? (
                    <img
                      src={story.userId.avatar}
                      alt={`${story.userId.firstName} ${story.userId.lastName}`}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {story.userId.firstName} {story.userId.lastName}
                    </p>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  {story.title}
                </h4>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {story.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
