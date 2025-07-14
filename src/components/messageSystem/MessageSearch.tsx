"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { IMessage } from "@/types/chat";

interface SearchResult {
  message: IMessage;
  messageIndex: number;
  matchType: 'content' | 'file' | 'date';
  highlightedContent?: string;
}

interface MessageSearchProps {
  messages: IMessage[];
  userId: string;
  participantNames: Record<string, string>;
  onSearchResult: (result: SearchResult | null) => void;
  onScrollToMessage: (messageId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function MessageSearch({
  messages,
  userId,
  participantNames,
  onSearchResult,
  onScrollToMessage,
  isVisible,
  onClose
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'all' | 'content' | 'files' | 'date'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Combined effects for focus and outside clicks
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible]);

  // Main search logic
  useEffect(() => {
    if (!searchQuery.trim() && !selectedDate) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      onSearchResult(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    messages.forEach((message, index) => {
      const messageContent = message.content.toLowerCase();
      const messageDate = message.sentAt ? new Date(message.sentAt) : null;

      // Content search (exclude file messages)
      if ((searchType === 'all' || searchType === 'content') && 
          !message.content.startsWith("File:") && 
          query && messageContent.includes(query)) {
        results.push({
          message,
          messageIndex: index,
          matchType: 'content',
          highlightedContent: highlightText(message.content, searchQuery)
        });
      }

      // File search - only search filename
      if ((searchType === 'all' || searchType === 'files') && 
          message.content.startsWith("File:") && query) {
        const fileName = extractFileName(message.content);
        if (fileName && fileName.toLowerCase().includes(query)) {
          results.push({
            message,
            messageIndex: index,
            matchType: 'file',
            highlightedContent: highlightText(`File: ${fileName}`, searchQuery)
          });
        }
      }

      // Date search
      if ((searchType === 'all' || searchType === 'date') && messageDate) {
        let dateMatches = false;
        
        if (selectedDate) {
          dateMatches = messageDate.toDateString() === new Date(selectedDate).toDateString();
        }
        
        if (query && !dateMatches) {
          const dateStr = messageDate.toLocaleDateString().toLowerCase();
          const timeStr = messageDate.toLocaleTimeString().toLowerCase();
          dateMatches = dateStr.includes(query) || timeStr.includes(query);
        }
        
        if (dateMatches) {
          results.push({
            message,
            messageIndex: index,
            matchType: 'date',
            highlightedContent: `Date: ${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString()}`
          });
        }
      }
    });

    setSearchResults(results);
    setCurrentResultIndex(0);
    onSearchResult(results.length > 0 ? results[0] : null);
  }, [messages, searchQuery, searchType, selectedDate, onSearchResult]);

  // Helper functions
  const highlightText = (text: string, query: string): string => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-black">$1</mark>');
  };

  const extractFileName = (fileMessage: string): string => {
    if (!fileMessage.startsWith("File:")) return '';
    const content = fileMessage.substring(5);
    // Handle: "File:filename:https://url" or "File: filename https://url"
    const urlIndex = content.search(/:https?:\/\/|\s+https?:\/\//);
    return urlIndex !== -1 ? content.substring(0, urlIndex).trim() : content.trim();
  };

  const getSenderName = (senderId: string): string => 
    senderId === userId ? "You" : (participantNames[senderId] || "Unknown");

  const getSearchTypeIcon = (type: string) => {
    const icons = { content: Search, files: FileText, date: Calendar };
    const Icon = icons[type as keyof typeof icons] || Search;
    return <Icon className="w-4 h-4" />;
  };

  // Event handlers
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const clearDateSelection = () => setSelectedDate("");

  const navigateResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    const newIndex = direction === 'next' 
      ? (currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0)
      : (currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1);
    setCurrentResultIndex(newIndex);
    onSearchResult(searchResults[newIndex]);
  };

  const handleResultClick = (result: SearchResult, index: number) => {
    setCurrentResultIndex(index);
    onSearchResult(result);
    if (result.message._id) onScrollToMessage(result.message._id);
  };

  const searchTypeOptions = [
    { value: 'all', label: 'All Messages', icon: Search },
    { value: 'content', label: 'Text Content', icon: Search },
    { value: 'files', label: 'Files', icon: FileText },
    { value: 'date', label: 'Date/Time', icon: Calendar }
  ];

  if (!isVisible) return null;

  return (
    <div className="bg-white border-b border-gray-200 p-3 md:p-4">
      {/* Search Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2">
          {/* Search Type Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {getSearchTypeIcon(searchType)}
              <span className="hidden md:inline">
                {searchTypeOptions.find(opt => opt.value === searchType)?.label}
              </span>
              {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                {searchTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSearchType(option.value as any);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      searchType === option.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${searchType === 'all' ? 'messages' : searchType === 'files' ? 'file names' : searchType}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) {
                    navigateResults('prev');
                  } else {
                    navigateResults('next');
                  }
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
          </div>

          {/* Date Picker Button (only show for date search) */}
          {(searchType === 'date' || searchType === 'all') && (
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  selectedDate ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Select date"
              >
                <Calendar className="w-4 h-4" />
                {selectedDate ? (
                  <span className="hidden sm:inline">
                    {new Date(selectedDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="hidden sm:inline">Date</span>
                )}
              </button>
              
              {selectedDate && (
                <button
                  onClick={clearDateSelection}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  title="Clear date"
                >
                  ×
                </button>
              )}

              {showDatePicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Select Date</div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <div className="mt-2 flex gap-2">
                    {[
                      { label: 'Today', date: new Date().toISOString().split('T')[0] },
                      { label: 'Yesterday', date: (() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        return yesterday.toISOString().split('T')[0];
                      })() }
                    ].map(({ label, date }) => (
                      <button
                        key={label}
                        onClick={() => handleDateSelect(date)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation and Close */}
        <div className="flex items-center gap-2">
          {searchResults.length > 0 && (
            <>
              <div className="text-sm text-gray-600 font-medium">
                {currentResultIndex + 1} of {searchResults.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => navigateResults('prev')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Previous result (Shift+Enter)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateResults('next')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Next result (Enter)"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Close search (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Results Summary */}
      {(searchQuery || selectedDate) && (
        <div className="text-sm text-gray-600">
          {searchResults.length === 0 ? (
            <span>No messages found</span>
          ) : (
            <span>
              Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''} 
              {searchType !== 'all' && ` in ${searchType}`}
              {selectedDate && ` on ${new Date(selectedDate).toLocaleDateString()}`}
            </span>
          )}
        </div>
      )}

      {/* Quick Results Preview (for mobile) */}
      {searchResults.length > 0 && searchResults.length <= 5 && (
        <div className="mt-3 space-y-2 md:hidden">
          {searchResults.map((result, index) => (
            <button
              key={`${result.message._id}-${index}`}
              onClick={() => handleResultClick(result, index)}
              className={`w-full text-left p-2 rounded-lg border transition-colors ${
                index === currentResultIndex 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {getSearchTypeIcon(result.matchType)}
                <span className="text-xs font-medium text-gray-600">
                  {getSenderName(result.message.senderId)}
                </span>
                {result.message.sentAt && (
                  <span className="text-xs text-gray-500">
                    {new Date(result.message.sentAt).toLocaleDateString()}
                  </span>
                )}
                {result.matchType === 'file' && (
                  <span className="text-xs bg-green-100 text-green-700 px-1 rounded">File</span>
                )}
              </div>
              <div 
                className="text-sm text-gray-800 truncate"
                dangerouslySetInnerHTML={{ 
                  __html: result.matchType === 'file' 
                    ? highlightText(extractFileName(result.message.content) || 'Unknown File', searchQuery)
                    : (result.highlightedContent || result.message.content)
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
