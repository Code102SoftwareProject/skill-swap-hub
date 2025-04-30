"use client"; // Ensures this component runs on the client side

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // Named import for decoding JWT

// Constants for API endpoints
const API_ENDPOINTS = {
  FILE_UPLOAD: "/api/file/upload",
  KYC_SUBMISSION: "/api/kyc",
};

// Constants for file types and formats
const FILE_TYPES = {
  NIC_DOCUMENT: ".pdf,.jpg,.jpeg,.png",
  PERSON_PHOTO: ".jpg,.jpeg,.png",
};

// File validation constraints
const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 2,
  MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB in bytes
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
};

// Constants for validation patterns
const NIC_PATTERNS = {
  OLD_NIC: /^[0-9]{9}[VvXx]$/,
  NEW_NIC: /^[0-9]{12}$/,
};

// Constants for error and info messages
const MESSAGES = {
  NIC_FORMAT_ERROR:
    "Invalid NIC format. Please enter either 9 digits followed by V/X or 12 digits",
  NIC_FORMAT_INFO:
    "Enter either Old NIC (9 digits + V/X) or New NIC (12 digits)",
  PHOTO_GUIDANCE:
    "Your face and both sides of your NIC should be clearly visible",
  FORM_INCOMPLETE: "Please fill all fields and upload all required photos",
  INVALID_NIC: "Please enter a valid NIC number",
  NIC_UPLOAD_FAILED: "NIC file upload failed",
  PERSON_PHOTO_UPLOAD_FAILED: "Photo with NIC upload failed",
  KYC_SUBMISSION_FAILED: "KYC submission failed",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  SUCCESS: "KYC information submitted successfully!",
  FILE_SIZE_ERROR: "File must be less than 2MB",
  FILE_TYPE_ERROR: "Only PDF and image files (.jpg, .jpeg, .png) are allowed",
  FILE_VALIDATION: "Files must be under 2MB and in PDF or image format",
};

// Form field labels and placeholders
const FORM_LABELS = {
  TITLE: "NIC Document Upload",
  USERNAME: "Username",
  NIC_NUMBER: "NIC Number",
  NIC_DOCUMENT: "NIC Document",
  PERSON_PHOTO: "Photo of you holding your NIC (both sides visible)",
  SUBMIT: "Submit",
  UPLOADING: "Uploading...",
};

// Define a type to represent the decoded JWT payload
type DecodedToken = {
  username?: string;
  email?: string;
  sub?: string;
  [key: string]: any;
};

// File validation error type
type FileValidationError = {
  message: string;
  field: "nicFile" | "nicWithPersonFile" | null;
};

export default function KYCForm() {
  // State for username
  const [username, setUsername] = useState("");

  // State for NIC number entered by the user
  const [nic, setNic] = useState("");

  // State for NIC validation error
  const [nicError, setNicError] = useState<string | null>(null);

  // File state to hold selected NIC document
  const [nicFile, setNicFile] = useState<File | null>(null);

  // State for photo with person holding both sides of the NIC
  const [nicWithPersonFile, setNicWithPersonFile] = useState<File | null>(null);

  // State for file validation errors
  const [fileError, setFileError] = useState<FileValidationError | null>(null);

  // Loading state for upload feedback
  const [uploading, setUploading] = useState(false);

  // Status message for feedback
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  // Automatically extract and set the username from the JWT (stored in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const name = decoded.username || decoded.email || decoded.sub || "";
        setUsername(name);
      } catch (err) {
        console.error("Invalid JWT", err);
      }
    }
  }, []);

  /**
   * Validates if a file meets the required size and type constraints
   *
   * @param {File} file - The file to validate
   * @returns {string|null} Error message if invalid, null if valid
   */
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      return MESSAGES.FILE_SIZE_ERROR;
    }

    // Check file type
    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
      return MESSAGES.FILE_TYPE_ERROR;
    }

    return null;
  };

  /**
   * Validates if the provided NIC number matches Sri Lankan NIC format
   *
   * @param {string} nicNumber - The National Identity Card number to validate
   * @returns {boolean} True if the NIC format is valid, false otherwise
   */
  const validateNIC = (nicNumber: string): boolean => {
    return (
      NIC_PATTERNS.OLD_NIC.test(nicNumber) ||
      NIC_PATTERNS.NEW_NIC.test(nicNumber)
    );
  };

  // Handle NIC input change with validation
  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nicValue = e.target.value;
    setNic(nicValue);

    if (nicValue && !validateNIC(nicValue)) {
      setNicError(MESSAGES.NIC_FORMAT_ERROR);
    } else {
      setNicError(null);
    }
  };

  // Handle NIC document file selection with validation
  const handleNicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0] || null;

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError({ message: error, field: "nicFile" });
        setNicFile(null);
        e.target.value = ""; // Reset file input
        return;
      }
    }

    setNicFile(file);
  };

  // Handle person with NIC photo file selection with validation
  const handlePersonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0] || null;

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError({ message: error, field: "nicWithPersonFile" });
        setNicWithPersonFile(null);
        e.target.value = ""; // Reset file input
        return;
      }
    }

    setNicWithPersonFile(file);
  };

  /**
   * Handles the form submission for KYC document upload
   *
   * @param {React.FormEvent} e - The form submission event
   * @returns {Promise<void>} Promise representing the async form submission process
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    // Basic form validation
    if (!username.trim() || !nic.trim() || !nicFile || !nicWithPersonFile) {
      setStatus({
        message: MESSAGES.FORM_INCOMPLETE,
        isError: true,
      });
      return;
    }

    // Validate NIC format before submission
    if (!validateNIC(nic)) {
      setStatus({ message: MESSAGES.INVALID_NIC, isError: true });
      return;
    }

    // Revalidate files before submission
    const nicFileError = validateFile(nicFile);
    if (nicFileError) {
      setFileError({ message: nicFileError, field: "nicFile" });
      return;
    }

    const personFileError = validateFile(nicWithPersonFile);
    if (personFileError) {
      setFileError({ message: personFileError, field: "nicWithPersonFile" });
      return;
    }

    setUploading(true);
    setStatus(null);

    let nicUploadData;
    let personUploadData;

    // Step 1: Upload the NIC document
    try {
      const nicFormData = new FormData();
      nicFormData.append("file", nicFile);

      const nicUploadRes = await fetch(API_ENDPOINTS.FILE_UPLOAD, {
        method: "POST",
        body: nicFormData,
      });

      if (!nicUploadRes.ok) {
        const errorData = await nicUploadRes.json();
        throw new Error(
          errorData.error || errorData.message || MESSAGES.NIC_UPLOAD_FAILED
        );
      }

      nicUploadData = await nicUploadRes.json();
    } catch (err: any) {
      console.error("NIC document upload error:", err);
      setStatus({
        message: err.message || MESSAGES.NIC_UPLOAD_FAILED,
        isError: true,
      });
      setUploading(false);
      return;
    }

    // Step 2: Upload photo of person holding NIC
    try {
      const personFormData = new FormData();
      personFormData.append("file", nicWithPersonFile);

      const personUploadRes = await fetch(API_ENDPOINTS.FILE_UPLOAD, {
        method: "POST",
        body: personFormData,
      });

      if (!personUploadRes.ok) {
        const errorData = await personUploadRes.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            MESSAGES.PERSON_PHOTO_UPLOAD_FAILED
        );
      }

      personUploadData = await personUploadRes.json();
    } catch (err: any) {
      console.error("Person photo upload error:", err);
      setStatus({
        message: err.message || MESSAGES.PERSON_PHOTO_UPLOAD_FAILED,
        isError: true,
      });
      setUploading(false);
      return;
    }

    // Step 3: Save the KYC record with all file URLs
    try {
      const kycResponse = await fetch(API_ENDPOINTS.KYC_SUBMISSION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nic: nic,
          recipient: username,
          nicUrl: nicUploadData.url, // NIC document URL
          nicWithPersonUrl: personUploadData.url, // Photo with person holding NIC
        }),
      });

      if (!kycResponse.ok) {
        const errorData = await kycResponse.json();
        throw new Error(
          errorData.error || errorData.message || MESSAGES.KYC_SUBMISSION_FAILED
        );
      }

      await kycResponse.json();

      // Success message
      setStatus({
        message: MESSAGES.SUCCESS,
        isError: false,
      });

      // Clear form
      setNic("");
      setNicFile(null);
      setNicWithPersonFile(null);
    } catch (err: any) {
      console.error("KYC submission error:", err);
      setStatus({
        message: err.message || MESSAGES.KYC_SUBMISSION_FAILED,
        isError: true,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="bg-secondary px-6 py-12 flex items-center justify-center min-h-screen">
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* Left side image */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/kyc.png"
            alt="NIC Upload"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side form */}
        <div className="bg-white p-4 max-w-md w-full py-16">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 bg-white shadow rounded"
          >
            <h2 className="text-xl font-bold text-center">
              {FORM_LABELS.TITLE}
            </h2>

            {/* Username field (autofilled from JWT) */}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={FORM_LABELS.USERNAME}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* NIC number input with validation */}
            <div>
              <input
                type="text"
                value={nic}
                onChange={handleNicChange}
                placeholder={FORM_LABELS.NIC_NUMBER}
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${nicError ? "border-red-500" : ""}`}
                required
              />
              {nicError && (
                <p className="mt-1 text-sm text-red-600">{nicError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {MESSAGES.NIC_FORMAT_INFO}
              </p>
            </div>

            {/* NIC Document upload input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {FORM_LABELS.NIC_DOCUMENT}
              </label>
              <input
                type="file"
                accept={FILE_TYPES.NIC_DOCUMENT}
                onChange={handleNicFileChange}
                className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileError?.field === "nicFile" ? "border border-red-500 rounded" : ""}`}
                required
              />
              {fileError?.field === "nicFile" && (
                <p className="mt-1 text-sm text-red-600">{fileError.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {MESSAGES.FILE_VALIDATION}
              </p>
            </div>

            {/* Photo of person holding both sides of NIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {FORM_LABELS.PERSON_PHOTO}
              </label>
              <input
                type="file"
                accept={FILE_TYPES.PERSON_PHOTO}
                onChange={handlePersonFileChange}
                className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileError?.field === "nicWithPersonFile" ? "border border-red-500 rounded" : ""}`}
                required
              />
              {fileError?.field === "nicWithPersonFile" && (
                <p className="mt-1 text-sm text-red-600">{fileError.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {MESSAGES.PHOTO_GUIDANCE}
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              disabled={uploading || !!nicError || !!fileError}
            >
              {uploading ? FORM_LABELS.UPLOADING : FORM_LABELS.SUBMIT}
            </button>

            {/* Status message */}
            {status && (
              <div
                className={`mt-4 p-3 rounded ${status.isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
              >
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
