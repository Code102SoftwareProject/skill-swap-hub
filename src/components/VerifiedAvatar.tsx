import { useEffect, useState } from 'react';
import Image from 'next/image';

interface VerifiedAvatarProps {
  userId: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
}

export default function VerifiedAvatar({ userId, avatarUrl, size = 96, className = '' }: VerifiedAvatarProps) {
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKycStatus() {
      try {
        const res = await fetch(`/api/kyc/status?userId=${userId}`);
        const data = await res.json();
        setKycStatus(data.success ? data.status : null);
      } catch (err) {
        setKycStatus(null);
      }
    }
    fetchKycStatus();
  }, [userId]);

  return (
    <div className={`relative`} style={{ width: size, height: size }}>
      <Image
        src={avatarUrl ? `/api/file/retrieve?fileUrl=${encodeURIComponent(avatarUrl)}` : '/profile.png'}
        alt="User Avatar"
        width={size}
        height={size}
        className={`rounded-full object-cover w-full h-full border-2 border-gray-200 ${className}`}
      />
      {(kycStatus === 'Accepted' || kycStatus === 'Approved') && (
        <div
          className="absolute bottom-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-300"
          title="KYC Verified"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-blue-700"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
} 