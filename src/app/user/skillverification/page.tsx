import SkillVerificationPortal from '@/components/User/SkillVerificationPortal';

export default function Home() {
  const userId = 'user123';
  
  return (
    <div className="bg-white min-h-screen">
      <SkillVerificationPortal userId={userId} />
    </div>
  );
}