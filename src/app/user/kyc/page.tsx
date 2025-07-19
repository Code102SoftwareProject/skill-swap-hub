"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/context/AuthContext";

// API endpoint configuration for file uploads and KYC submission
const API_ENDPOINTS = {
  FILE_UPLOAD: "/api/file/upload",
  KYC_SUBMISSION: "/api/kyc",
};

// Accepted file formats for different document types
const FILE_TYPES = {
  NIC_DOCUMENT: ".pdf,.jpg,.jpeg,.png",
  PERSON_PHOTO: ".pdf,.jpg,.jpeg,.png",
};

// File validation constraints
const FILE_CONSTRAINTS = {
  MAX_SIZE_MB: 2,
  MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB in bytes
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
};

// Regex patterns for validating NIC (National Identity Card) formats
const NIC_PATTERNS = {
  OLD_NIC: /^[0-9]{9}[VvXx]$/, // Old format: 9 digits followed by V or X
  NEW_NIC: /^[0-9]{12}$/, // New format: 12 digits
};

// Full name validation pattern (first name and last name)
const FULLNAME_VALIDATION = {
  PATTERN: /^[A-Za-z]{2,}(\s+[A-Za-z]{2,})+$/, // At least 2 letters, followed by one or more words of at least 2 letters each
  MIN_LENGTH: 5,
  MAX_LENGTH: 50,
};

// User-facing messages for different scenarios
const MESSAGES = {
  FULLNAME_FORMAT_ERROR:
    "Please enter your full name with first name and last name (e.g., John Doe)",
  FULLNAME_FORMAT_INFO: "Enter your full name: First Name Last Name",
  NIC_FORMAT_ERROR:
    "Invalid NIC format. Please enter either 9 digits followed by V/X or 12 digits",
  NIC_FORMAT_INFO:
    "Enter either Old NIC (9 digits + V/X) or New NIC (12 digits)",
  PHOTO_GUIDANCE:
    "Your face and both sides of your NIC should be clearly visible",
  FORM_INCOMPLETE: "Please fill all fields and upload all required photos",
  INVALID_NIC: "Please enter a valid NIC number",
  INVALID_FULLNAME: "Please enter a valid full name",
  NIC_UPLOAD_FAILED: "NIC file upload failed",
  PERSON_PHOTO_UPLOAD_FAILED: "Photo with NIC upload failed",
  KYC_SUBMISSION_FAILED: "KYC submission failed",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  SUCCESS: "KYC information submitted successfully!",
  FILE_SIZE_ERROR: "File must be less than 2MB",
  FILE_TYPE_ERROR: "Only PDF and image files (.jpg, .jpeg, .png) are allowed",
  FILE_VALIDATION: "Files must be under 2MB and in PDF or image format",
};

// Form field identifiers with type safety
const FIELD_NAMES = {
  NIC_FILE: "nicFile" as const,
  NIC_WITH_PERSON_FILE: "nicWithPersonFile" as const,
};

type FieldName = (typeof FIELD_NAMES)[keyof typeof FIELD_NAMES];

// UI text labels
const FORM_LABELS = {
  TITLE: "NIC Document Upload",
  FULLNAME: "Full Name",
  NIC_NUMBER: "NIC Number",
  NIC_DOCUMENT: "NIC Document",
  PERSON_PHOTO: "Photo of you holding your NIC (both sides visible)",
  SUBMIT: "Submit",
  UPLOADING: "Uploading...",
};

// Type definitions for JWT token content
type DecodedToken = {
  username?: string;
  email?: string;
  sub?: string;
  [key: string]: any;
};

// Type for file validation error structure
type FileValidationError = {
  message: string;
  field: FieldName | null;
};

// Type for API error responses
type ApiErrorResponse = {
  error?: string;
  message?: string;
  status?: number;
};

// Extended error type to include field information
interface ExtendedError extends Error {
  field?: FieldName;
}

// Form state structure
type KYCFormState = {
  nic: string;
  nicFile: File | null;
  nicWithPersonFile: File | null;
};

// Initial form state values
const initialFormState: KYCFormState = {
  nic: "",
  nicFile: null,
  nicWithPersonFile: null,
};

export default function KYCForm() {
  // State management hooks
  const { user, isLoading ,token} = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [nicError, setNicError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<FileValidationError | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const [formState, setFormState] = useState<KYCFormState>(initialFormState);

  // 3) Your JWT-decode effect (unconditional)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const name = decoded.username || decoded.email || decoded.sub || "";
        setFullName(name);
        if (
          name.trim().length >= 5 &&
          name.includes(" ") &&
          !FULLNAME_VALIDATION.PATTERN.test(name.trim())
        ) {
          setFullNameError(MESSAGES.FULLNAME_FORMAT_ERROR);
        }
      } catch {
        console.error("Invalid JWT");
      }
    }
  }, []);

  // 4) Your redirect-if-not-logged-in effect

  useEffect(() => {
    if (!isLoading && !user) {
      // not logged in → go to login
      router.replace("/login");
    }
  }, [isLoading, user, router]);
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Loading...</span>
      </div>
    );
  }

  // Helper function to update specific form field
  const updateField = <K extends keyof KYCFormState>(
    field: K,
    value: KYCFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormState(initialFormState);
    setFileError(null);
    setNicError(null);
    setFullNameError(null);

    // Clear file input elements
    const fileInputs = document.querySelectorAll(
      'input[type="file"]'
    ) as NodeListOf<HTMLInputElement>;
    fileInputs.forEach((input) => {
      input.value = "";
    });
  };

  // Validate full name format using regex pattern
  const validateFullName = (fullNameValue: string): boolean => {
    return FULLNAME_VALIDATION.PATTERN.test(fullNameValue);
  };

  // Validate file size and type
  const validateFile = (file: File): string | null => {
    if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      return MESSAGES.FILE_SIZE_ERROR;
    }

    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
      return MESSAGES.FILE_TYPE_ERROR;
    }

    return null;
  };

  // Handle changes to full name input field
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullNameValue = e.target.value;
    setFullName(fullNameValue);

    // Clear error while typing
    if (fullNameError) {
      setFullNameError(null);
    }

    // Only validate if user has typed something that looks complete
    const trimmedValue = fullNameValue.trim();
    if (trimmedValue.length >= 5 && trimmedValue.includes(" ")) {
      if (!validateFullName(trimmedValue)) {
        setFullNameError(MESSAGES.FULLNAME_FORMAT_ERROR);
      }
    }
  };

  // Handle full name validation when user leaves the input field
  const handleFullNameBlur = () => {
    const trimmedValue = fullName.trim();
    if (trimmedValue && !validateFullName(trimmedValue)) {
      setFullNameError(MESSAGES.FULLNAME_FORMAT_ERROR);
    }
  };

  // Validate NIC format using regex patterns
  const validateNIC = (nicNumber: string): boolean => {
    return (
      NIC_PATTERNS.OLD_NIC.test(nicNumber) ||
      NIC_PATTERNS.NEW_NIC.test(nicNumber)
    );
  };

  // Handle changes to NIC input field
  const handleNicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nicValue = e.target.value;
    updateField("nic", nicValue);

    // Validate NIC format if not empty
    if (nicValue && !validateNIC(nicValue)) {
      setNicError(MESSAGES.NIC_FORMAT_ERROR);
    } else {
      setNicError(null);
    }
  };

  // Handle NIC document file upload
  const handleNicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0] || null;

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError({ message: error, field: FIELD_NAMES.NIC_FILE });
        updateField("nicFile", null);
        e.target.value = ""; // Clear the file input
        return;
      }
    }

    updateField("nicFile", file);
  };

  // Handle person holding NIC photo upload
  const handlePersonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0] || null;

    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError({
          message: error,
          field: FIELD_NAMES.NIC_WITH_PERSON_FILE,
        });
        updateField("nicWithPersonFile", null);
        e.target.value = ""; // Clear the file input
        return;
      }
    }

    updateField("nicWithPersonFile", file);
  };

  // Upload file to server and handle response
  const uploadFile = async (
    file: File,
    errorMessage: string,
    field?: FieldName
  ): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_ENDPOINTS.FILE_UPLOAD, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiErrorResponse;
      const error = new Error(
        errorData.error || errorData.message || errorMessage
      ) as ExtendedError;

      if (field) {
        error.field = field;
      }

      throw error;
    }

    return await response.json();
  };

  // Type guard to check if an error is a file upload error
  const isFileUploadError = (error: unknown): error is ExtendedError => {
    return (
      error instanceof Error &&
      "field" in error &&
      (error as ExtendedError).field !== undefined
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    // Validate that all required fields are filled
    if (
      !fullName.trim() ||
      !formState.nic.trim() ||
      !formState.nicFile ||
      !formState.nicWithPersonFile
    ) {
      setStatus({
        message: MESSAGES.FORM_INCOMPLETE,
        isError: true,
      });
      return;
    } // Validate full name format
    if (!validateFullName(fullName.trim())) {
      setStatus({ message: MESSAGES.INVALID_FULLNAME, isError: true });
      return;
    }

    // Validate NIC format
    if (!validateNIC(formState.nic)) {
      setStatus({ message: MESSAGES.INVALID_NIC, isError: true });
      return;
    }

    // Validate files before submission
    const nicFileError = validateFile(formState.nicFile);
    if (nicFileError) {
      setFileError({ message: nicFileError, field: FIELD_NAMES.NIC_FILE });
      return;
    }

    const personFileError = validateFile(formState.nicWithPersonFile);
    if (personFileError) {
      setFileError({
        message: personFileError,
        field: FIELD_NAMES.NIC_WITH_PERSON_FILE,
      });
      return;
    }

    setUploading(true);
    setStatus(null);

    let nicUploadData;
    let personUploadData;

    try {
      // Upload both files in parallel
      [nicUploadData, personUploadData] = await Promise.all([
        uploadFile(
          formState.nicFile,
          MESSAGES.NIC_UPLOAD_FAILED,
          FIELD_NAMES.NIC_FILE
        ),
        uploadFile(
          formState.nicWithPersonFile,
          MESSAGES.PERSON_PHOTO_UPLOAD_FAILED,
          FIELD_NAMES.NIC_WITH_PERSON_FILE
        ),
      ]);

      // Submit KYC data to server
      const kycResponse = await fetch(API_ENDPOINTS.KYC_SUBMISSION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify({
          userId: user!._id,
          nic: formState.nic,
          recipient: fullName,
          nicUrl: nicUploadData.url,
          nicWithPersonUrl: personUploadData.url,
        }),
      });

      if (!kycResponse.ok) {
        const errorData = (await kycResponse.json()) as ApiErrorResponse;
        throw new Error(
          errorData.error || errorData.message || MESSAGES.KYC_SUBMISSION_FAILED
        );
      }

      await kycResponse.json();

      // Show success message and reset form
      setStatus({
        message: MESSAGES.SUCCESS,
        isError: false,
      });

      resetForm();
    } catch (err: unknown) {
      console.error("KYC submission error:", err);

      // Handle different error types
      if (isFileUploadError(err)) {
        setFileError({
          message: err.message,
          field: err.field || null,
        });
      } else if (err instanceof Error) {
        setStatus({
          message: err.message || MESSAGES.KYC_SUBMISSION_FAILED,
          isError: true,
        });
      } else {
        setStatus({
          message: MESSAGES.GENERIC_ERROR,
          isError: true,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="bg-secondary px-6 py-12 flex items-center justify-center min-h-screen">
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-full overflow-hidden">
        {/* Responsive image container - hidden on mobile */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/kyc.png"
            alt="Person submitting identity verification documents"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Form container */}
        <div className="bg-white p-4 max-w-md w-full py-16">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 bg-white shadow rounded"
            aria-labelledby="form-title"
          >
            <h2 id="form-title" className="text-xl font-bold text-center">
              {FORM_LABELS.TITLE}
            </h2>{" "}
            {/* Full Name field with validation */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {FORM_LABELS.FULLNAME}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={handleFullNameChange}
                onBlur={handleFullNameBlur}
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${fullNameError ? "border-red-500" : ""}`}
                required
                aria-invalid={!!fullNameError}
                aria-describedby={
                  fullNameError
                    ? "fullName-error fullName-format"
                    : "fullName-format"
                }
              />
              {fullNameError && (
                <p
                  id="fullName-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {fullNameError}
                </p>
              )}
              <p id="fullName-format" className="mt-1 text-xs text-gray-500">
                {MESSAGES.FULLNAME_FORMAT_INFO}
              </p>
            </div>
            {/* NIC number field with validation */}
            <div>
              <label
                htmlFor="nic"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {FORM_LABELS.NIC_NUMBER}
              </label>
              <input
                id="nic"
                type="text"
                value={formState.nic}
                onChange={handleNicChange}
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${nicError ? "border-red-500" : ""}`}
                required
                aria-invalid={!!nicError}
                aria-describedby={
                  nicError ? "nic-error nic-format" : "nic-format"
                }
              />
              {nicError && (
                <p
                  id="nic-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {nicError}
                </p>
              )}
              <p id="nic-format" className="mt-1 text-xs text-gray-500">
                {MESSAGES.NIC_FORMAT_INFO}
              </p>
            </div>
            {/* NIC document upload */}
            <div>
              <label
                htmlFor="nicFile"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {FORM_LABELS.NIC_DOCUMENT}
              </label>
              <input
                id="nicFile"
                type="file"
                accept={FILE_TYPES.NIC_DOCUMENT}
                onChange={handleNicFileChange}
                className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileError?.field === FIELD_NAMES.NIC_FILE ? "border border-red-500 rounded" : ""}`}
                required
                aria-invalid={fileError?.field === FIELD_NAMES.NIC_FILE}
                aria-describedby="nicFile-validation"
              />
              {fileError?.field === FIELD_NAMES.NIC_FILE && (
                <p
                  id="nicFile-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {fileError.message}
                </p>
              )}
              <p id="nicFile-validation" className="mt-1 text-xs text-gray-500">
                {MESSAGES.FILE_VALIDATION}
              </p>
            </div>
            {/* Photo with person holding NIC upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {FORM_LABELS.PERSON_PHOTO}
              </label>
              <input
                type="file"
                accept={FILE_TYPES.PERSON_PHOTO}
                onChange={handlePersonFileChange}
                className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileError?.field === FIELD_NAMES.NIC_WITH_PERSON_FILE ? "border border-red-500 rounded" : ""}`}
                required
              />
              {fileError?.field === FIELD_NAMES.NIC_WITH_PERSON_FILE && (
                <p className="mt-1 text-sm text-red-600">{fileError.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {MESSAGES.PHOTO_GUIDANCE}
              </p>
            </div>{" "}
            {/* Submit button - disabled during upload or if errors exist */}
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              disabled={
                uploading || !!nicError || !!fullNameError || !!fileError
              }
              aria-busy={uploading}
            >
              {uploading ? FORM_LABELS.UPLOADING : FORM_LABELS.SUBMIT}
            </button>
            {/* Status message display (success/error) */}
            {status && (
              <div
                className={`mt-4 p-3 rounded ${status.isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                role="status"
                aria-live="polite"
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
