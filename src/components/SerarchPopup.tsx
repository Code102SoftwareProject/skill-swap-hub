'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, MessageSquare, Loader2, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/navigation'; // Changed to next/navigation for App Router

interface SearchResult {
  id: string;
  title: string;
  description: string;
  posts: number;
  replies: number;
  lastActive: string;
  image: string;
  score: number;
 // slug: string;
}

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearch) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setResults(data.forums);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch]);

  const renderHighlightedText = (text: string) => {
    return {
      __html: DOMPurify.sanitize(text)
    };
  };

  const handleClose = () => {
    setSearchTerm('');
    setResults([]);
    onClose();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    handleClose();
   
    router.push(`/forum`);
    //router.push(`/forum/${result.slug}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-lg w-full max-w-3xl mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 relative">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
                aria-label="Close popup"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="relative mb-6 mt-8">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search threads.."
                  className="w-full px-4 py-2 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 p-1 rounded-full transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center py-8"
                >
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </motion.div>
              )}

              <motion.div layout className="space-y-4">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#3B82B3] rounded-lg p-4 text-white flex items-start gap-4 hover:bg-[#2C6A94] transition-colors duration-200 cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={result.image}
                        alt={result.title}
                        width={80}
                        height={80}
                        className="object-cover transform hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-lg mb-2"
                        dangerouslySetInnerHTML={renderHighlightedText(result.title)}
                      />
                      <p 
                        className="text-sm text-gray-100 mb-4"
                        dangerouslySetInnerHTML={renderHighlightedText(result.description)}
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{result.posts}</span>
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center gap-1"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{result.replies}</span>
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center gap-1"
                          >
                            <TrendingUp className="w-4 h-4" />
                            <span>{Math.round(result.score * 100)}%</span>
                          </motion.div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{result.lastActive}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {!isLoading && searchTerm && results.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500"
                >
                  No results found for "{searchTerm}"
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchPopup;