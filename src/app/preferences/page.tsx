'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Mail, Rss, Save, RotateCcw, Sparkles } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/homepage/Navbar';

interface Preferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

export default function PreferencesPage() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = useUserPreferences();
  const router = useRouter();
  
  const [localPreferences, setLocalPreferences] = useState<Preferences>({
    emailNotifications: true,
    pushNotifications: true,
    digestFrequency: 'weekly'
  });
  const [forumInterests, setForumInterests] = useState<string[]>([]);
  const [likedCategories, setLikedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences.preferences);
      setForumInterests(preferences.forumInterests || []);
      setLikedCategories(preferences.likedCategories || []);
    }
  }, [preferences]);

  // Check for changes
  useEffect(() => {
    if (!preferences) return;
    
    const originalPrefs = preferences.preferences;
    const changed = (
      localPreferences.emailNotifications !== originalPrefs.emailNotifications ||
      localPreferences.pushNotifications !== originalPrefs.pushNotifications ||
      localPreferences.digestFrequency !== originalPrefs.digestFrequency
    );
    
    setHasChanges(changed);
  }, [localPreferences, preferences]);

  // Handle preference changes
  const handlePreferenceChange = (key: keyof Preferences, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save preferences
  const savePreferences = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await updatePreferences({
        preferences: localPreferences
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setHasChanges(false);
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset preferences
  const resetPreferences = () => {
    if (preferences) {
      setLocalPreferences(preferences.preferences);
      setHasChanges(false);
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Please log in to manage your preferences</h2>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Preferences</h1>
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main preferences */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notification Preferences */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                </div>

                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.emailNotifications}
                        onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive real-time notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.pushNotifications}
                        onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Digest Frequency */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Digest Frequency</h3>
                    <p className="text-sm text-gray-500 mb-3">How often would you like to receive digest emails?</p>
                    <select
                      value={localPreferences.digestFrequency}
                      onChange={(e) => handlePreferenceChange('digestFrequency', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feed Preferences */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Feed Personalization</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Interested Forums</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      You are currently following {forumInterests.length} forums. 
                      Your feed is personalized based on your interactions.
                    </p>
                    <div className="text-sm text-blue-600">
                      <span>🔥 Keep interacting with posts to improve your recommendations!</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Preferred Categories</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      You show interest in {likedCategories.length} categories.
                    </p>
                    {likedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {likedCategories.map((category, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Forums Following</span>
                    <span className="font-medium">{forumInterests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Categories Interested</span>
                    <span className="font-medium">{likedCategories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Digest Frequency</span>
                    <span className="font-medium capitalize">{localPreferences.digestFrequency}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={savePreferences}
                    disabled={!hasChanges || loading}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      hasChanges && !loading
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  
                  <button
                    onClick={resetPreferences}
                    disabled={!hasChanges || loading}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      hasChanges && !loading
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3">💡 Tips</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Like and comment on posts to improve recommendations</li>
                  <li>• Watch posts you want to follow closely</li>
                  <li>• Join forums relevant to your interests</li>
                  <li>• Adjust notification frequency to your preference</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
