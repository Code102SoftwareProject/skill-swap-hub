'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, MessageSquare, Loader2, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/navigation';
import { IForum } from '@/lib/models/Forum';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<IForum[]>([]);
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
        console.log('Fetching results for:', debouncedSearch);
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Search request failed');
        }
        
        const data = await response.json();
        console.log('Search response data:', data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setResults(data.forums);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchResults();
  }, [debouncedSearch]);

  const renderHighlightedText = (text: string) => {
    if (!text) return { __html: '' };
    return {
      __html: DOMPurify.sanitize(text)
    };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const handleViewAllForums = () => {
    handleClose();
    router.push('/forum');
  };

  const handleResultClick = (result: IForum) => {
    handleClose();
    router.push(`/forum/${result._id}`);
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
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl text-black font-semibold">Search Forums</h2>
                  <button
                    onClick={handleViewAllForums}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                  >
                    View All Forums
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleClose}
                  className="hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
                  aria-label="Close popup"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="relative mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search forums..."
                  className="w-full px-4 py-3 text-black pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                {results.map((result) => (
                  <motion.div
                    key={result._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-sky-800 border-2 border-sky-900 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={result.image}
                          alt={result.title}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <h3 
                          className="text-lg font-semibold text-white line-clamp-1"
                          dangerouslySetInnerHTML={renderHighlightedText(result.title)}
                        />
                        <p 
                          className="text-sm text-gray-400 line-clamp-2"
                          dangerouslySetInnerHTML={renderHighlightedText(result.description)}
                        />
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>{result.posts}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{result.replies}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(new Date(result.lastActive))}</span>
                            </div>
                          </div>
                          {result.score && (
                            <div className="text-sm font-medium text-blue-600">
                              Match: {Math.round(result.score * 100)}%
                            </div>
                          )}
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