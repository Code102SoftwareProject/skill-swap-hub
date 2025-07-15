'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LikeDislikeButtonsProps {
  postId: string;
  initialLikes: number;
  initialDislikes: number;
  initialLikeStatus?: 'liked' | 'disliked' | null;
  onUpdate?: (likes: number, dislikes: number) => void;
}

const LikeDislikeButtons: React.FC<LikeDislikeButtonsProps> = ({
  postId,
  initialLikes,
  initialDislikes,
  initialLikeStatus = null,
  onUpdate,
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [likeStatus, setLikeStatus] = useState<'liked' | 'disliked' | null>(initialLikeStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingDislike, setAnimatingDislike] = useState(false);
  const router = useRouter();


  const currentUserId = 'current-user-id';

  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Start animation
    setAnimatingLike(true);
    setTimeout(() => setAnimatingLike(false), 300);

    try {
      let operation: string;
      
      if (likeStatus === 'liked') {
      
        operation = 'unlike';
      } else {
       
        operation = 'like';
        
        // If user has previously disliked, remove that dislike
        if (likeStatus === 'disliked') {

          setAnimatingDislike(true);
          setTimeout(() => setAnimatingDislike(false), 300);
        }
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      const data = await response.json();
      
      // Update local state
      setLikes(data.post.likes);
      setDislikes(data.post.dislikes);
      setLikeStatus(operation === 'like' ? 'liked' : null);
      
      // Notify parent if callback provided
      if (onUpdate) {
        onUpdate(data.post.likes, data.post.dislikes);
      }

      // Refresh the page data 
      router.refresh();
    } catch (error) {
      console.error('Error updating like status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDislike = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Start animation
    setAnimatingDislike(true);
    setTimeout(() => setAnimatingDislike(false), 300);

    try {
      let operation: string;
      
      if (likeStatus === 'disliked') {
        
        operation = 'undislike';
      } else {
      
        operation = 'dislike';
        
        // If user has previously liked, remove that like
        if (likeStatus === 'liked') {
        
          setAnimatingLike(true);
          setTimeout(() => setAnimatingLike(false), 300);
        }
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update dislike status');
      }

      const data = await response.json();
      
      // Update local state
      setLikes(data.post.likes);
      setDislikes(data.post.dislikes);
      setLikeStatus(operation === 'dislike' ? 'disliked' : null);
      
      // Notify parent if callback provided
      if (onUpdate) {
        onUpdate(data.post.likes, data.post.dislikes);
      }

      // Refresh the page data (optional)
      router.refresh();
    } catch (error) {
      console.error('Error updating dislike status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button 
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center space-x-1 transition-colors ${
          likeStatus === 'liked' 
            ? 'text-blue-600' 
            : 'text-gray-600 hover:text-blue-600'
        }`}
        aria-label={likeStatus === 'liked' ? "Unlike post" : "Like post"}
      >
        <div 
          className={`transform transition-transform duration-300 ${
            animatingLike ? 'scale-125' : 'scale-100'
          }`}
        >
          <ThumbsUp 
            className={`w-5 h-5 ${isLoading ? 'opacity-50' : ''} ${
              likeStatus === 'liked' ? 'fill-current' : ''
            }`} 
          />
        </div>
        <span className={`transition-all duration-300 ${
          animatingLike && likeStatus !== 'liked' ? 'text-blue-600 font-bold' : ''
        }`}>{likes}</span>
      </button>
      
      <button 
        onClick={handleDislike}
        disabled={isLoading}
        className={`flex items-center space-x-1 transition-colors ${
          likeStatus === 'disliked' 
            ? 'text-red-600' 
            : 'text-gray-600 hover:text-red-600'
        }`}
        aria-label={likeStatus === 'disliked' ? "Remove dislike" : "Dislike post"}
      >
        <div 
          className={`transform transition-transform duration-300 ${
            animatingDislike ? 'scale-125' : 'scale-100'
          }`}
        >
          <ThumbsDown 
            className={`w-5 h-5 ${isLoading ? 'opacity-50' : ''} ${
              likeStatus === 'disliked' ? 'fill-current' : ''
            }`} 
          />
        </div>
        <span className={`transition-all duration-300 ${
          animatingDislike && likeStatus !== 'disliked' ? 'text-red-600 font-bold' : ''
        }`}>{dislikes}</span>
      </button>
    </div>
  );
};

export default LikeDislikeButtons;