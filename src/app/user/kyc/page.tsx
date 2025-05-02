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

// Add this with your other constants
const FIELD_NAMES = {
  NIC_FILE: "nicFile" as const,
  NIC_WITH_PERSON_FILE: "nicWithPersonFile" as const,
};

// Type derived from the constants
type FieldName = (typeof FIELD_NAMES)[keyof typeof FIELD_NAMES];

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
  field: FieldName | null;
};

// API error response structure
type ApiErrorResponse = {
  error?: string;
  message?: string;
  status?: number;
};

// Extended Error type for better TypeScript support
interface ExtendedError extends Error {
  field?: FieldName;
}

// Define the form state type
type KYCFormState = {
  nic: string;
  nicFile: File | null;
  nicWithPersonFile: File | null;
};

// Initial form state
const initialFormState: KYCFormState = {
  nic: "",
  nicFile: null,
  nicWithPersonFile: null,
};

export default function KYCForm() {
  // State for username
  const [username, setUsername] = useState("");

  // State for NIC validation error
  const [nicError, setNicError] = useState<string | null>(null);

  // State for file validation errors
  const [fileError, setFileError] = useState<FileValidationError | null>(null);

  // Loading state for upload feedback
  const [uploading, setUploading] = useState(false);

  // Status message for feedback
  const [status, setStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  // In your component
  const [formState, setFormState] = useState<KYCFormState>(initialFormState);

  // Update state with a setter method
  const updateField = <K extends keyof KYCFormState>(
    field: K,
    value: KYCFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form by returning to initial state
  const resetForm = () => {
    setFormState(initialFormState);
    setFileError(null);
    setNicError(null);

    // Reset file inputs
    const fileInputs = document.querySelectorAll(
      'input[type="file"]'
    ) as NodeListOf<HTMLInputElement>;
    fileInputs.forEach((input) => {
      input.value = "";
    });
  };

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
    updateField("nic", nicValue);

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
        setFileError({ message: error, field: FIELD_NAMES.NIC_FILE });
        updateField("nicFile", null);
        e.target.value = "";
        return;
      }
    }

    updateField("nicFile", file);
  };

  // Handle person with NIC photo file selection with validation
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
        e.target.value = ""; // Reset file input
        return;
      }
    }

    updateField("nicWithPersonFile", file);
  };

  /**
   * Handles file upload to the server
   *
   * @param {File} file - The file to upload
   * @param {string} errorMessage - The error message to show if upload fails
   * @param {string} field - The field name to help with error handling
   * @returns {Promise<{url: string}>} Object containing the uploaded file URL
   * @throws {Error} Throws an error if upload fails
   */
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

      // Add the field information to help with error handling
      if (field) {
        error.field = field;
      }

      throw error;
    }

    return await response.json();
  };

  /**
   * Checks if an error is related to file upload with field information
   *
   * @param error The error to check
   * @returns Whether the error has field information
   */
  const isFileUploadError = (error: unknown): error is ExtendedError => {
    return (
      error instanceof Error &&
      "field" in error &&
      (error as ExtendedError).field !== undefined
    );
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
    if (
      !username.trim() ||
      !formState.nic.trim() ||
      !formState.nicFile ||
      !formState.nicWithPersonFile
    ) {
      setStatus({
        message: MESSAGES.FORM_INCOMPLETE,
        isError: true,
      });
      return;
    }

    // Validate NIC format before submission
    if (!validateNIC(formState.nic)) {
      setStatus({ message: MESSAGES.INVALID_NIC, isError: true });
      return;
    }

    // Revalidate files before submission
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
      // Upload both files using the helper function with field identifiers
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

      // KYC submission code...
      const kycResponse = await fetch(API_ENDPOINTS.KYC_SUBMISSION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nic: formState.nic,
          recipient: username,
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

      // Success handling...
      setStatus({
        message: MESSAGES.SUCCESS,
        isError: false,
      });

      // Clear form data...
      resetForm();
    } catch (err: unknown) {
      console.error("KYC submission error:", err);

      if (isFileUploadError(err)) {
        // Handle file-specific errors
        setFileError({
          message: err.message,
          field: err.field || null,
        });
      } else if (err instanceof Error) {
        // Handle general errors
        setStatus({
          message: err.message || MESSAGES.KYC_SUBMISSION_FAILED,
          isError: true,
        });
      } else {
        // Handle unknown errors
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
        {/* Left side image */}
        <div className="md:w-1/2 hidden md:block">
          <img
            src="/kyc.png"
            alt="Person submitting identity verification documents"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side form */}
        <div className="bg-white p-4 max-w-md w-full py-16">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 bg-white shadow rounded"
            aria-labelledby="form-title"
          >
            <h2 id="form-title" className="text-xl font-bold text-center">
              {FORM_LABELS.TITLE}
            </h2>

            {/* Username field (autofilled from JWT) */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {FORM_LABELS.USERNAME}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
                aria-describedby={nicError ? "nic-error" : undefined}
              />
            </div>

            {/* NIC number input with validation */}
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

            {/* NIC Document upload input */}
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

            {/* Photo of person holding both sides of NIC */}
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
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              disabled={uploading || !!nicError || !!fileError}
              aria-busy={uploading}
            >
              {uploading ? FORM_LABELS.UPLOADING : FORM_LABELS.SUBMIT}
            </button>

            {/* Status message */}
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
