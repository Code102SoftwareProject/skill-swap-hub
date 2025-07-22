'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Loader, MessageSquare, Send, ThumbsUp, ThumbsDown, Edit, X, AlertCircle, ImagePlus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext';
import WatchPostButton from './WatchPostButton';
import ReportPostButton from './ReportPostButton';
import Swal from 'sweetalert2';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface Author {
  _id: string;
  name: string;
  avatar?: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: Author;
  createdAt: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  replies: number;
  views?: number;
}

interface Reply {
  _id: string;
  postId: string;
  content: string;
  author: Author;
  createdAt: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

const PostDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const postId = params?.postid as string;
  const forumId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Edit mode state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editErrors, setEditErrors] = useState<{ title?: string; content?: string; image?: string }>({});
  
  // Reply edit state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [updatingReply, setUpdatingReply] = useState(false);
  
  // Refs
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const editReplyRef = useRef<HTMLTextAreaElement>(null);
  const editEditorRef = useRef<HTMLDivElement>(null);
  const editQuillRef = useRef<Quill | null>(null);
  const viewTrackedRef = useRef<boolean>(false);

  // Function to track post view
  const trackPostView = useCallback(async (postId: string, forumId: string, timeSpent: number = 0, isComplete: boolean = false) => {
    if (!user || !token) return;

    try {
      const response = await fetch('/api/user/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          forumId,
          interactionType: 'view',
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          timeSpent,
          isComplete
        })
      });

      if (response.ok) {
        console.log('Post view tracked successfully');
        
        // Only update view count optimistically for initial views (timeSpent === 0)
        if (timeSpent === 0) {
          setPost(prevPost => {
            if (prevPost && prevPost._id === postId) {
              return { ...prevPost, views: (prevPost.views || 0) + 1 };
            }
            return prevPost;
          });
        }
      } else {
        console.error('Failed to track post view');
      }
    } catch (error) {
      console.error('Error tracking post view:', error);
    }
  }, [user, token]);

  // Fetch post details
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) {
        setError('Post ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const postResponse = await fetch(`/api/posts/${postId}`);
        
        if (!postResponse.ok) {
          console.error('Post fetch failed with status:', postResponse.status);
          throw new Error(`Failed to fetch post details: ${postResponse.statusText}`);
        }
        
        const postData = await postResponse.json();
        console.log('Post data received:', postData);
        
        if (!postData || !postData.post) {
          throw new Error('Invalid post data received');
        }
        
        setPost(postData.post);
        // Initialize edit form values with current post data
        setEditTitle(postData.post.title);
        setEditContent(postData.post.content);
        if (postData.post.imageUrl) {
          setEditImagePreview(getImageUrl(postData.post.imageUrl));
        }
        
        // Track post view if user is logged in
        // Removed from here to prevent infinite loop
        
        // Fetch replies with better error handling
        try {
          const repliesResponse = await fetch(`/api/posts/${postId}/replies`);
          
          if (!repliesResponse.ok) {
            console.error('Replies fetch failed with status:', repliesResponse.status);
            throw new Error(`Failed to fetch replies: ${repliesResponse.statusText}`);
          }
          
          const repliesData = await repliesResponse.json();
          console.log('Replies data received:', repliesData);
          setReplies(repliesData.replies || []);
        } catch (replyErr) {
          console.error('Error fetching replies:', replyErr);
          setError('Unable to load replies. Please try again later.');
          setReplies([]);
        }
      } catch (err) {
        console.error('Error fetching post details:', err);
        setError('Unable to load post. Please try again later.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId]);

  // Track initial post view - separate useEffect to avoid infinite loop
  useEffect(() => {
    if (post && user && token && forumId && !loading && !viewTrackedRef.current) {
      // Only track the initial view once when the post is loaded
      viewTrackedRef.current = true;
      trackPostView(post._id, forumId);
    }
  }, [post, user, token, forumId, loading, trackPostView]);

  // Reset view tracking when post changes
  useEffect(() => {
    viewTrackedRef.current = false;
  }, [postId]);

  // Track time spent on post for analytics
  useEffect(() => {
    if (!post || !user || !token || !forumId) return;

    const startTime = Date.now();
    let timeSpent = 0;

    const updateTimeSpent = () => {
      timeSpent = Math.floor((Date.now() - startTime) / 1000);
    };

    const interval = setInterval(updateTimeSpent, 5000); // Update every 5 seconds

    const handleBeforeUnload = () => {
      updateTimeSpent();
      if (timeSpent > 10) { // Only track if user spent more than 10 seconds
        // Use fetch instead of sendBeacon for better compatibility
        fetch('/api/user/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            postId: post._id,
            forumId: forumId,
            interactionType: 'view',
            timeSpent,
            deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            isComplete: timeSpent > 30 // Consider complete if spent more than 30 seconds
          })
        }).catch(err => console.error('Error tracking time on unload:', err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateTimeSpent();
        if (timeSpent > 10) {
          // Call the API directly to avoid triggering useEffect loops
          fetch('/api/user/interactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              postId: post._id,
              forumId: forumId,
              interactionType: 'view',
              timeSpent,
              deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
              isComplete: timeSpent > 30
            })
          }).catch(err => console.error('Error tracking time spent:', err));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Final time tracking when component unmounts
      updateTimeSpent();
      if (timeSpent > 10) {
        // Use fetch directly to avoid state updates on unmount
        fetch('/api/user/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            postId: post._id,
            forumId: forumId,
            interactionType: 'view',
            timeSpent,
            deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            isComplete: timeSpent > 30
          })
        }).catch(err => console.error('Error tracking final time spent:', err));
      }
    };
  }, [post, user, token, forumId]); // Remove trackPostView from dependencies

  // Cleanup image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (editImagePreview && editImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [editImagePreview]);

  // Apply error styling to Quill editor and cleanup when modal closes
  useEffect(() => {
    if (editQuillRef.current && editEditorRef.current) {
      const toolbar = editEditorRef.current.previousElementSibling as HTMLElement;
      const container = editEditorRef.current.parentElement as HTMLElement;
      
      if (editErrors.content) {
        toolbar?.classList.add('ql-error');
        container?.classList.add('ql-error');
      } else {
        toolbar?.classList.remove('ql-error');
        container?.classList.remove('ql-error');
      }
    }

    // Cleanup when modal closes
    if (!showEditModal && editQuillRef.current) {
      editQuillRef.current = null;
    }
  }, [editErrors.content, showEditModal]);

  const validateEditForm = (): boolean => {
    const newErrors: { title?: string; content?: string; image?: string } = {};
    
    if (!editTitle.trim()) {
      newErrors.title = 'Title is required';
    } else if (editTitle.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    const textContent = editQuillRef.current?.getText().trim() || '';
    if (!textContent || textContent.length === 0) {
      newErrors.content = 'Content is required';
    } else if (textContent.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }
    
    if (editImage && editImage.size > 5 * 1024 * 1024) {
      newErrors.image = 'Image size must be less than 5MB';
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBackToForum = () => {
    router.push(`/forum/${forumId}`);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !user) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create an author object from the user in AuthContext
      const author = {
        _id: user._id, 
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar
      };
      
      const response = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent,
          author,
          forumId: forumId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit reply');
      }
      
      const data = await response.json();
      
      // Add new reply to the list
      setReplies((prevReplies) => [...prevReplies, data.reply]);
      
      // Update post reply count
      if (post) {
        setPost({
          ...post,
          replies: post.replies + 1
        });
      }
      
      // Clear reply input
      setReplyContent('');
    } catch (err) {
      console.error('Error submitting reply:', err);
      Swal.fire({
        icon: 'error',
        title: 'Reply Failed',
        text: 'Failed to submit your reply. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeletePost = async () => {
    if (!user || !token) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'You must be logged in to delete a post',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
  
    // Ask for confirmation before deleting
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Post',
      text: 'Are you sure you want to delete this post? This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Red color for delete
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });
  
    // If user confirmed deletion
    if (result.isConfirmed) {
      try {
        // Show loading state
        Swal.fire({
          title: 'Deleting...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
  
        const response = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user._id,
            forumId: forumId
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to delete post');
        }
  
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Post Deleted',
          text: 'Your post has been deleted successfully!',
          confirmButtonColor: '#3b82f6',
          timer: 2000
        });
  
        // Navigate back to forum page
        router.push(`/forum/${forumId}`);
      } catch (err) {
        console.error('Error deleting post:', err);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'Failed to delete the post. Please try again.',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };
  
  const handlePostLike = async (operation: 'like' | 'dislike' | 'unlike' | 'undislike') => {
    if (!user) {
      Swal.fire({
        icon: 'info',
        title: 'Sign In Required',
        text: 'Please sign in to like or dislike posts',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation,
          userId: user.email,
          forumId: forumId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      const data = await response.json();
      setPost(data.post);
    } catch (err) {
      console.error('Error updating post:', err);
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: 'Failed to update post. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleReplyLike = async (replyId: string, operation: 'like' | 'dislike' | 'unlike' | 'undislike') => {
    if (!user) {
      Swal.fire({
        icon: 'info',
        title: 'Sign In Required',
        text: 'Please sign in to like or dislike replies',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/posts/${postId}/replies/${replyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation,
          userId: user.email,
          forumId: forumId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reply');
      }
      
      const data = await response.json();
      
      // Update replies state
      setReplies(replies.map(reply => 
        reply._id === replyId ? data.reply : reply
      ));
    } catch (err) {
      console.error('Error updating reply:', err);
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: 'Failed to update reply. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Function to handle opening the edit modal
  const handleOpenEditModal = () => {
    setEditTitle(post?.title || '');
    setEditContent(post?.content || '');
    
    if (post?.imageUrl) {
      setEditImagePreview(getImageUrl(post.imageUrl));
    } else {
      setEditImagePreview(null);
    }
    
    setEditImage(null);
    setShowEditModal(true);
    setEditErrors({});

    // Initialize Quill editor after modal opens
    setTimeout(() => {
      if (editEditorRef.current && !editQuillRef.current) {
        editQuillRef.current = new Quill(editEditorRef.current, {
          theme: 'snow',
          placeholder: 'Write your post content here...',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'color': [] }, { 'background': [] }],
              ['link'],
              ['clean']
            ]
          }
        });

        // Set initial content if available
        if (post?.content) {
          editQuillRef.current.root.innerHTML = post.content;
        }

        // Listen for text changes to update content state
        editQuillRef.current.on('text-change', () => {
          if (editQuillRef.current) {
            const htmlContent = editQuillRef.current.root.innerHTML;
            const textContent = editQuillRef.current.getText().trim();
            setEditContent(textContent.length > 0 ? htmlContent : '');
          }
        });
      }
    }, 100);
  };

  // Function to handle image selection for edit
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only JPG, PNG, GIF, and WebP images are allowed.',
        confirmButtonColor: '#3b82f6'
      });
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
      return;
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size must be less than 5MB.',
        confirmButtonColor: '#3b82f6'
      });
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
      return;
    }
    
    // If validation passes, set the image and create preview
    setEditImage(file);
    
    // Create and set preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // If there's an existing preview that's a blob URL, revoke it
    if (editImagePreview && editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    
    setEditImagePreview(previewUrl);
    setEditErrors(prev => ({ ...prev, image: undefined }));
    
    Swal.fire({
      icon: 'success',
      title: 'Image Added',
      text: 'Image successfully selected',
      confirmButtonColor: '#3b82f6',
      timer: 1500
    });
  };

  // Function to handle removing the edit image
  const handleRemoveEditImage = () => {
    setEditImage(null);
    
    // If there's an existing preview that's a blob URL, revoke it
    if (editImagePreview && editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    
    setEditImagePreview(null);
    
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Function to handle post update submission
  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'You must be logged in to update a post',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    if (!validateEditForm()) {
      return;
    }
    
    try {
      setUpdating(true);
      
      // First, upload the image if a new one is selected
      let imageUrl = post?.imageUrl || null;
      
      if (editImage) {
        const imageFormData = new FormData();
        imageFormData.append('file', editImage);
        imageFormData.append('forumId', forumId);
        
        try {
          const uploadResponse = await fetch('/api/file/upload', {
            method: 'POST',
            body: imageFormData,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }
          
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url || uploadData.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue without updating the image if upload fails
          Swal.fire({
            icon: 'warning',
            title: 'Image Upload Failed',
            text: 'Continuing to update post without changing the image',
            confirmButtonColor: '#3b82f6',
            timer: 2000
          });
        }
      }
      
      // Only send removeImage flag if the image was explicitly removed (not just not changed)
      const removeImage = post?.imageUrl && editImagePreview === null;
      
      // Now update the post with JSON data
      const postData = {
        title: editTitle,
        content: editContent,
        imageUrl: removeImage ? null : imageUrl,
        removeImage: removeImage,
        userId: user._id
      };
      
      // Post update request with JSON data
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorData.details || 'Failed to update post';
        } catch (e) {
          // If not JSON, use the text
          errorMessage = errorText || 'Failed to update post';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Update post state with new data
      setPost(data.post);
      
      // Reset edit form state
      setEditImage(null);
      if (editImagePreview && editImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(editImagePreview);
      }
      setEditErrors({});
      
      // Clear Quill editor
      if (editQuillRef.current) {
        editQuillRef.current.setContents([]);
        editQuillRef.current = null;
      }
      
      // Show success notification
      Swal.fire({
        icon: 'success',
        title: 'Post Updated',
        text: 'Your post has been updated successfully!',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
      
      // Close the modal
      setShowEditModal(false);
      
    } catch (err) {
      console.error('Error updating post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      Swal.fire({
        icon: 'error',
        title: 'Failed to Update Post',
        text: errorMessage,
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close modal on Escape key
    if (e.key === 'Escape') {
      setShowEditModal(false);
      // Clean up Quill editor
      if (editQuillRef.current) {
        editQuillRef.current = null;
      }
    }
    
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      editFormRef.current?.requestSubmit();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '/user-avatar.png';
    
    if (imageUrl.startsWith('http')) {
      return `/api/file/retrieve?fileUrl=${encodeURIComponent(imageUrl)}`;
    } else {
      return `/api/file/retrieve?file=${encodeURIComponent(imageUrl)}`;
    }
  };
  
  // Check if current user is the post author
  const isPostOwner = post && user && (post.author._id === user._id); 
  console.log('Post owner ID:', post?.author._id);
  console.log('Current user:', user?._id);
  console.log('Is post owner:', isPostOwner);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="relative w-16 h-16">
          <div className="absolute w-16 h-16 rounded-full border-4 border-blue-100 opacity-30"></div>
          <div className="absolute w-16 h-16 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-blue-500">
            <Loader className="w-8 h-8 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10 px-4 bg-red-50 border border-red-100 rounded-lg shadow-sm max-w-4xl mx-auto"
      >
        <p className="text-red-600">{error || 'Post not found'}</p>
        <button 
          onClick={handleBackToForum}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          Back to Forum
        </button>
      </motion.div>
    );
  }

  const isPostLiked = user?.email && post.likedBy.includes(user.email);
  const isPostDisliked = user?.email && post.dislikedBy.includes(user.email);

  // Function to handle editing a reply
  const handleEditReply = (reply: Reply) => {
    setEditingReplyId(reply._id);
    setEditReplyContent(reply.content);
    
    // Focus on the edit textarea after a short delay to ensure it's rendered
    setTimeout(() => {
      if (editReplyRef.current) {
        editReplyRef.current.focus();
      }
    }, 100);
  };

  // Function to save edited reply
  const handleSaveReplyEdit = async () => {
    if (!editingReplyId || !editReplyContent.trim() || !user || !token) {
      return;
    }

    try {
      setUpdatingReply(true);
      
      const response = await fetch(`/api/posts/${postId}/replies/${editingReplyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editReplyContent,
          userId: user._id,
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reply');
      }
      
      const data = await response.json();
      
      // Update the reply in the list
      setReplies(replies.map(reply => 
        reply._id === editingReplyId ? data.reply : reply
      ));
      
      // Reset edit state
      setEditingReplyId(null);
      setEditReplyContent('');
      
      // Show success notification
      Swal.fire({
        icon: 'success',
        title: 'Reply Updated',
        text: 'Your reply has been updated successfully!',
        confirmButtonColor: '#3b82f6',
        timer: 1500
      });
    } catch (err) {
      console.error('Error updating reply:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update reply. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setUpdatingReply(false);
    }
  };

  // Function to cancel reply editing
  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditReplyContent('');
  };

  // Function to delete a reply
  const handleDeleteReply = async (replyId: string) => {
    if (!user || !token) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'You must be logged in to delete a reply',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
  
    // Ask for confirmation before deleting
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Reply',
      text: 'Are you sure you want to delete this reply? This action cannot be undone.',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });
  
    if (!result.isConfirmed) return;
  
    try {
      // Show loading state
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  
      const response = await fetch(`/api/posts/${postId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }
  
      // Remove the deleted reply from the list
      setReplies(replies.filter(reply => reply._id !== replyId));
      
      // Update post reply count
      if (post) {
        setPost({
          ...post,
          replies: post.replies - 1
        });
      }
  
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Reply Deleted',
        text: 'Your reply has been deleted successfully!',
        confirmButtonColor: '#3b82f6',
        timer: 1500
      });
    } catch (err) {
      console.error('Error deleting reply:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete the reply. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
        onClick={handleBackToForum}
        className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Forum</span>
      </motion.button>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-blue-100 rounded-xl overflow-hidden shadow-md bg-white mb-8"
      >
        {/* Post header */}
        <div className="bg-blue-50 p-6 border-b border-blue-100 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-blue-800">{post.title}</h1>
  
         {/* Edit and Delete buttons - only visible to post owner */}
         {isPostOwner && (
             <div className="flex space-x-2">
              <button 
               onClick={handleOpenEditModal}
                 className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
           >
                <Edit className="w-4 h-4" />
                 <span>Edit</span>
             </button>
      
             <button 
              onClick={handleDeletePost}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                 <span>Delete</span>
                 </button>
               </div>
             )}
            </div>
        
        {/* Post content */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm">
              <Image 
                src={post.author.avatar ? getImageUrl(post.author.avatar) : '/user-avatar.png'} 
                alt={post.author.name}
                fill
                className="object-cover"
              />
              
            </div>
            <div>
              <p className="font-medium text-blue-800">{post.author.name}</p>
              <p className="text-sm text-blue-500">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-line text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
          
          {/* Post image if available */}
          {post.imageUrl && (
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full h-96">
                <Image 
                  src={getImageUrl(post.imageUrl)} 
                  alt={`Image for ${post.title}`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    console.error('Failed to load post image:', post.imageUrl);
                    // Use setState to hide the image on error
                    if (post) {
                      setPost({
                        ...post,
                        imageUrl: undefined
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Post actions */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-blue-50">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handlePostLike(isPostLiked ? 'unlike' : 'like')}
                  className={`flex items-center space-x-1 ${isPostLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} transition-colors`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{post.likes}</span>
                </button>
                
                <button 
                  onClick={() => handlePostLike(isPostDisliked ? 'undislike' : 'dislike')}
                  className={`flex items-center space-x-1 ${isPostDisliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span>{post.dislikes}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-blue-600">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">{post.replies}</span>
                </div>
                
                {/* View count */}
                <div className="flex items-center space-x-1 text-gray-500">
                  <span className="text-sm">{post.views || 0} views</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Save Post Button */}
              <WatchPostButton postId={post._id} size="sm" />
              
              {/* Report Post Button */}
              <ReportPostButton postId={post._id} size="sm" />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Edit Modal Popup */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Edit Post</h2>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form ref={editFormRef} onSubmit={handleUpdatePost} className="space-y-4">
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        editErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter post title"
                    />
                    {editErrors.title && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {editErrors.title}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <div className={`${editErrors.content ? 'ql-error' : ''}`}>
                      <div 
                        ref={editEditorRef}
                        className="min-h-[150px] bg-white"
                        style={{ 
                          fontSize: '14px',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                      />
                    </div>
                    {editErrors.content && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {editErrors.content}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image (Optional)
                    </label>
                    
                    <div className="space-y-3">
                      {!editImagePreview ? (
                        <div className="flex items-center">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/jpeg, image/png, image/gif, image/webp"
                            id="edit-post-image"
                            onChange={handleEditImageChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="edit-post-image"
                            className="flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                          >
                            <ImagePlus className="w-5 h-5 text-blue-500 mr-2" />
                            <span className="text-gray-600">Select image</span>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                            <Image 
                              src={editImagePreview} 
                              alt="Post image preview" 
                              fill
                              className="object-contain" 
                            />
                            <button
                              type="button"
                              onClick={handleRemoveEditImage}
                              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                              aria-label="Remove image"
                            >
                              <X className="w-5 h-5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {editErrors.image && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {editErrors.image}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Replies section */}
      <div>
        <h2 className="text-xl font-semibold text-blue-800 mb-6">
          Replies ({post.replies})
        </h2>
        
        {/* Reply form */}
        {user ? (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmitReply}
            className="mb-8 border border-blue-100 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-start space-x-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0">
                <Image 
                  src={user.avatar ? getImageUrl(user.avatar) : '/user-avatar.png'} 
                  alt={`${user.firstName} ${user.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex-grow relative">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                  className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                />
                
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || submitting}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                      !replyContent.trim() || submitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Post Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        ) : (
          <div className="mb-8 p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-center">
            <p className="text-yellow-700">Please <span className="font-semibold">sign in</span> to join the conversation.</p>
          </div>
        )}
        
        {/* Replies list */}
        {replies.length > 0 ? (
          <div className="space-y-6">
            {replies.map((reply, index) => {
              const isReplyLiked = user?.email && reply.likedBy.includes(user.email);
              const isReplyDisliked = user?.email && reply.dislikedBy.includes(user.email);
              
              return (
                <motion.div
                  key={reply._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-blue-100 rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex items-start space-x-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0">
                      <Image 
                        src={reply.author.avatar ? getImageUrl(reply.author.avatar) : '/user-avatar.png'} 
                        alt={reply.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-800">{reply.author.name}</p>
                          <p className="text-xs text-blue-500">{formatDate(reply.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-gray-700 whitespace-pre-line">
                        {editingReplyId === reply._id ? (
                          <div className="space-y-2">
                            <textarea
                              ref={editReplyRef}
                              value={editReplyContent}
                              onChange={(e) => setEditReplyContent(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={handleCancelReplyEdit}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveReplyEdit}
                                disabled={updatingReply}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                {updatingReply ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4">
                        <button 
                          onClick={() => handleReplyLike(reply._id, isReplyLiked ? 'unlike' : 'like')}
                          className={`flex items-center space-x-1 ${isReplyLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'} transition-colors`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">{reply.likes}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleReplyLike(reply._id, isReplyDisliked ? 'undislike' : 'dislike')}
                          className={`flex items-center space-x-1 ${isReplyDisliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors`}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span className="text-sm">{reply.dislikes}</span>
                        </button>
                        
                        {user && user._id === reply.author._id && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEditReply(reply)}
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReply(reply._id)}
                              className="text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center border border-blue-100 rounded-lg bg-blue-50">
            <MessageSquare className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <p className="text-blue-600 font-medium">No replies yet. Be the first to join the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;