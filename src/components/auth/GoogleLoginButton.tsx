'use client';

import { useEffect } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError, disabled = false, isLoading = false }) => {
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && !disabled && !isLoading) {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError('Failed to get Google credential');
            }
          },
          // Prevent automatic prompts and popups for existing users
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        // Render the button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );

        // Disable automatic One Tap prompts to prevent unwanted popups
        window.google.accounts.id.disableAutoSelect();
      }
    };

    script.onerror = () => {
      onError('Failed to load Google Sign-In script');
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      
      // Cancel any Google prompts to prevent popups
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Ignore errors if cancel is not available
          console.log('Google prompt cancel not available');
        }
      }
    };
  }, [onSuccess, onError, disabled, isLoading]);

  return (
    <div className="w-full">
      {(disabled || isLoading) ? (
        <div className="w-full flex justify-center items-center min-h-[40px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          )}
          <span className="text-gray-500">
            {isLoading ? 'Signing in with Google...' : 'Google Sign-In Disabled'}
          </span>
        </div>
      ) : (
        <div 
          id="google-signin-button" 
          className="w-full flex justify-center"
          style={{ minHeight: '40px' }}
        />
      )}
    </div>
  );
};

// Add type declarations for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: () => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default GoogleLoginButton;
