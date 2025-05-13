import ProfileForm from '@/components/Dashboard/profile/ProfileForm';

export default function SettingContent() {
  return (
    <div className="p-8">
      <h1 className="text-xl text-gray-800 font-bold mb-4">Update Profile</h1>
      <ProfileForm />
    </div>
  );
}
