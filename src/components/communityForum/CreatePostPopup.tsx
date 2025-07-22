'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useAuth } from '@/lib/context/AuthContext';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface CreatePostPopupProps {
  forumId: string;
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostPopup: React.FC<CreatePostPopupProps> = ({ 
  forumId, 
  isOpen, 
  onClose, 
  onPostCreated 
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string; image?: string }>({});
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize Quill editor when modal opens
  useEffect(() => {
    if (isOpen && editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
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

      // Listen for text changes to update content state
      quillRef.current.on('text-change', () => {
        if (quillRef.current) {
          const htmlContent = quillRef.current.root.innerHTML;
          const textContent = quillRef.current.getText().trim();
          setContent(textContent.length > 0 ? htmlContent : '');
        }
      });
    }

    // Focus the title input when the modal opens
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }

    // Clean up Quill editor when modal closes
    if (!isOpen && quillRef.current) {
      quillRef.current = null;
      setContent('');
    }

    // Clean up any pending requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen]);

  // Apply error styling to Quill editor
  useEffect(() => {
    if (quillRef.current && editorRef.current) {
      const toolbar = editorRef.current.previousElementSibling as HTMLElement;
      const container = editorRef.current.parentElement as HTMLElement;
      
      if (errors.content) {
        toolbar?.classList.add('ql-error');
        container?.classList.add('ql-error');
      } else {
        toolbar?.classList.remove('ql-error');
        container?.classList.remove('ql-error');
      }
    }
  }, [errors.content]);

  // Clean up image preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; content?: string; image?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    const textContent = quillRef.current?.getText().trim() || '';
    if (!textContent || textContent.length === 0) {
      newErrors.content = 'Content is required';
    } else if (textContent.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }
    
    if (image && image.size > 5 * 1024 * 1024) {
      newErrors.image = 'Image size must be less than 5MB';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent form submission
    
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // If validation passes, set the image and create preview
    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setErrors(prev => ({ ...prev, image: undefined }));
    
    Swal.fire({
      icon: 'success',
      title: 'Image Added',
      text: 'Image successfully selected',
      confirmButtonColor: '#3b82f6',
      timer: 1500
    });
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Prevent event bubbling
    
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `forum-${forumId}`);
      
      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
        signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.url || data.imageUrl;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Image upload aborted');
        return null;
      }
      
      console.error('Image upload error:', error);
      Swal.fire({
        icon: 'warning',
        title: 'Image Upload Failed',
        text: 'Continuing to create post without image',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
      return null;
    }
  };

  const createPost = async (imageUrl: string | null): Promise<boolean> => {
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      const currentUser = {
        _id: user ? user._id : 'temp-user-id',
        name: user ? user.firstName + " " + user.lastName : 'Current User',
        avatar: user ? user.avatar : '/default-avatar.png',
      };
      
      const postData = {
        title,
        content,
        imageUrl,
        author: currentUser
      };
      
      const response = await fetch(`/api/forums/${forumId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(postData),
        signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorData.details || 'Failed to create post';
        } catch (e) {
          errorMessage = errorText || 'Failed to create post';
        }
        
        throw new Error(errorMessage);
      }
      
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Post creation aborted');
        return false;
      }
      
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      Swal.fire({
        icon: 'error',
        title: 'Failed to Create Post',
        text: errorMessage,
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First upload image if exists
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // Then create post with image URL
      const success = await createPost(imageUrl);
      
      if (success) {
        // Reset form
        setTitle('');
        setContent('');
        if (quillRef.current) {
          quillRef.current.setContents([]);
        }
        setImage(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        setErrors({});
        
        // Show success notification
        Swal.fire({
          icon: 'success',
          title: 'Post Created',
          text: 'Your post has been published successfully!',
          confirmButtonColor: '#3b82f6',
          timer: 2000
        });
        
        // Notify parent component
        onPostCreated();
        
        // Close the popup
        onClose();
      }
    } catch (error) {
      console.error('Error in post creation process:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      formRef.current?.requestSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
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
                <h2 className="text-xl font-semibold text-gray-800">Create New Post</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-2 text-black border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter post title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <div className={`${errors.content ? 'ql-error' : ''}`}>
                    <div 
                      ref={editorRef}
                      className="min-h-[150px] bg-white"
                      style={{ 
                        fontSize: '14px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    />
                  </div>
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.content}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image (Optional)
                  </label>
                  
                  <div className="space-y-3">
                    {!imagePreview ? (
                      <div className="flex items-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg, image/png, image/gif, image/webp"
                          id="post-image"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="post-image"
                          className="flex items-center justify-center px-4 py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <ImagePlus className="w-4 h-4 mr-2" />
                          <span>Add Image</span>
                        </label>
                        
                        <div className="ml-3 text-gray-500 text-sm">
                          JPG, PNG, GIF, WebP (max 5MB)
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="border border-blue-100 rounded-lg overflow-hidden relative w-full h-48">
                          <Image
                            src={imagePreview}
                            alt={`Preview of ${title || 'post image'}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Create Post'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostPopup;