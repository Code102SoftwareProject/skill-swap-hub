import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

// Define the schema for form validation
// Updated validation schema
const feedbackSchema = z.object({
  feedback: z.string()
    .min(10, { message: "Feedback must be at least 10 characters long" })
    .refine(val => val.trim().length >= 10, "Feedback cannot be empty")
    .refine(val => !/^\s+$/.test(val), "Feedback cannot be only spaces")
    .refine(val => (val.match(/[a-zA-Z]/g) || []).length >= 10, {
      message: "Feedback must contain at least 10 letters"
    }),
  
  successStory: z.string().optional(),
  
  rating: z.number().min(1).max(5),
  isAnonymous: z.boolean(),
  
  displayName: z.string()
    .optional()
    .refine(val => !val || (
      val.trim().length >= 3 &&
      (val.match(/[a-zA-Z]/g) || []).length >= 3
    ), {
      message: "Display name must contain at least 3 letters"
    }),
  
  canSuccessStoryPost: z.boolean(),
})
.refine(data => {
  if (data.canSuccessStoryPost && data.successStory) {
    return (
      data.successStory.trim().length >= 10 &&
      (data.successStory.match(/[a-zA-Z]/g) || []).length >= 10
    );
  }
  return true;
}, {
  message: "Success story must contain at least 10 letters when allowing posting",
  path: ["successStory"]
});


type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function FeedbackForm({ userId }: { userId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 5,
      isAnonymous: false,
      canSuccessStoryPost: false,
    },
  });

  const isAnonymous = watch('isAnonymous');
  const canSuccessStoryPost = watch('canSuccessStoryPost');

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data,
          feedback: data.feedback.trim(),
          successStory: data.successStory?.trim(),
          displayName: data.displayName?.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSuccessMessage('Thank you for your valuable feedback. Feel free to share your thoughts again.');
      setTimeout(() => setSuccessMessage(''), 7000);
      reset();
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of your JSX remains exactly the same ...


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {successMessage && (
        <div className="mb-6 p-4 rounded bg-blue-100 border border-blue-300 text-blue-800 text-center font-medium animate-fade-in">
          {successMessage}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">
        Share Your Feedback
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Feedback Textarea */}
        <div className="space-y-2">
          <label htmlFor="feedback" className="block text-lg font-medium text-gray-800">
            Your Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            id="feedback"
            {...register('feedback')}
            placeholder="What did you like or what could be improved?"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 text-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.feedback ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={5}
          />
          {errors.feedback && (
            <p className="mt-1 text-sm text-red-600">{errors.feedback.message}</p>
          )}
        </div>

        {/* Success Story Textarea */}
        <div className="space-y-2">
          <label htmlFor="successStory" className="block text-lg font-medium text-gray-800">
            Success Story {canSuccessStoryPost && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="successStory"
            {...register('successStory')}
            placeholder="Share how this platform helped you succeed..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 text-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.successStory ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={5}
          />
          {errors.successStory && (
            <p className="mt-1 text-sm text-red-600">{errors.successStory.message}</p>
          )}
          {canSuccessStoryPost && (
            <p className="mt-1 text-sm text-red-600">Since you're allowing us to post this, please provide a meaningful story</p>
          )}
        </div>

        {/* Rating Selector */}
        <div className="space-y-2">
          <label className="block text-lg font-medium text-gray-800">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <label key={star} className="cursor-pointer">
                <input
                  type="radio"
                  value={star}
                  checked={watch('rating') === star}
                  onChange={() => setValue('rating', star)}
                  className="sr-only"
                />
                <span
                  className={`text-3xl ${
                    watch('rating') >= star
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              </label>
            ))}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
          )}
        </div>

        {/* Privacy Options */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAnonymous"
              {...register('isAnonymous')}
              className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isAnonymous" className="ml-3 text-gray-700">
              Do not display my name publicly
            </label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2">
              <label htmlFor="displayName" className="block text-gray-700">
                Display Name (Optional)
              </label>
              <input
                type="text"
                id="displayName"
                {...register('displayName')}
               placeholder="Name (if not using username)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 text-gray-600 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.displayName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="canSuccessStoryPost"
              {...register('canSuccessStoryPost')}
              className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="canSuccessStoryPost" className="ml-3 text-gray-700">
              Allow us to feature your success story (if provided)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </form>
    </div>
  );
}