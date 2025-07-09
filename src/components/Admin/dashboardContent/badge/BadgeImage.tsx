"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCcw } from "lucide-react";
import { getFullImageUrl } from "./badgeHelpers";

interface BadgeImageProps {
  badgeId: string;
  badgeName: string;
  imageUrl: string;
  editMode?: boolean;
  editImagePreview?: string | null;
  size?: number;
}

const BadgeImage = ({
  badgeId,
  badgeName,
  imageUrl,
  editMode = false,
  editImagePreview = null,
  size = 64,
}: BadgeImageProps) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_ATTEMPTS = 2;

  const handleImageRetry = () => {
    console.log(`Manually retrying image for badge ID: ${badgeId}`);
    setHasError(false);
    setRetryCount(0);
  };

  // Reset error state when image URL changes
  useEffect(() => {
    setHasError(false);
    setRetryCount(0);
  }, [imageUrl]);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded border border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-1">⚠️</div>
          <span className="text-xs text-gray-500">Image unavailable</span>
        </div>
        <button
          className="mt-1 text-xs text-blue-500 hover:text-blue-700"
          onClick={handleImageRetry}
          title="Try loading the image again"
        >
          <RefreshCcw size={12} className="mr-1 inline" />
          Retry
        </button>
      </div>
    );
  }

  const displayUrl =
    editMode && editImagePreview ? editImagePreview : getFullImageUrl(imageUrl);

  return (
    <div className="relative w-full h-full">
      <Image
        src={displayUrl}
        alt={badgeName}
        className="rounded object-cover"
        fill
        sizes={`${size}px`}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;

          // Log the error for debugging
          console.error(
            `Failed to load image for badge ${badgeName} (Attempt ${retryCount + 1})`
          );
          console.error(`URL attempted: ${target.src}`);

          // If we haven't exceeded max retry attempts, try different URL formats
          if (retryCount < MAX_RETRY_ATTEMPTS) {
            let retryUrl: string | null = null;
            const timestamp = Date.now();

            if (retryCount === 0) {
              if (imageUrl && imageUrl.includes("badges/")) {
                const badgePath = imageUrl.substring(
                  imageUrl.indexOf("badges/")
                );
                retryUrl = `/api/file/retrieve?file=${encodeURIComponent(badgePath)}&t=${timestamp}`;
              } else if (imageUrl) {
                retryUrl = `/api/file/retrieve?file=${encodeURIComponent(imageUrl)}&t=${timestamp}`;
              }
            } else if (retryCount === 1) {
              if (imageUrl) {
                retryUrl = `/api/file/retrieve?file=${encodeURIComponent(imageUrl)}&nocache=${timestamp}`;
              }
            }

            if (retryUrl) {
              console.log(`Retrying with URL: ${retryUrl}`);
              // Increment retry count
              setRetryCount((prevCount) => prevCount + 1);

              // Small timeout to prevent rapid retry loops
              setTimeout(() => {
                target.src = retryUrl as string;
              }, 100);
              return;
            }
          }

          // Mark as error after all retries fail
          console.log(`All retry attempts failed for badge: ${badgeName}`);
          setHasError(true);
        }}
        priority={true}
      />
    </div>
  );
};

export default BadgeImage;
