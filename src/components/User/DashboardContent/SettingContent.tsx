/* Main profile settings page containing user's profile form */
import ProfileForm from '@/components/Dashboard/profile/ProfileForm';

export default function SettingContent() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 pb-6  ">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-500 mt-2">
              Update your basic details and contact information              </p>
            </div>
            
          </div>
        </div>

        {/* Profile Form with Card Layout */}
          <div className="p-6 sm:p-8">
          
            <ProfileForm />
          </div>
        

       
      </div>
    </div>
  );
}