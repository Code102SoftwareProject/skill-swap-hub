"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { handleSuspensionApiResponse } from '@/components/ui/SuspendedPopup'





interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const Register = () => {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
        formData.phone
      )
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Professional title is required";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms agreement validation
    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the Terms and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "terms") {
      setAgreeToTerms(checked);
      if (checked && errors.terms) {
        setErrors({ ...errors, terms: undefined });
      }
    } else {
      setFormData({ ...formData, [name]: value });

      // Clear error when user starts typing
      if (errors[name as keyof FormErrors]) {
        setErrors({ ...errors, [name]: undefined });
      }

      // Clear confirm password error when password changes
      if (
        name === "password" &&
        errors.confirmPassword &&
        formData.confirmPassword
      ) {
        if (value === formData.confirmPassword) {
          setErrors({ ...errors, confirmPassword: undefined });
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);

 


      // Check if the response indicates the user is suspended
      if (handleSuspensionApiResponse(result)) {
        // User is suspended, popup has been shown
        return;
      }

      if (result.success) {
        showToast(
          "Registration successful! Redirecting to dashboard...",
          "success"
        );

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          title: "",
          password: "",
          confirmPassword: "",
        });
        setAgreeToTerms(false);

        // Add a small delay to ensure the toast is visible
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        showToast(result.message || "Registration failed", "error");
      }
    } catch (error) {
      showToast("An error occurred during registration", "error");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-blue-100 p-4">
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto bg-white rounded-xl shadow-lg w-[90%]">
        <div className="w-full md:w-1/2 p-4 sm:block">
          <div className="relative w-full h-48 md:h-full">
            <Image
              src="/register.jpg"
              alt="Register Image"
              fill
              style={{ objectFit: "cover" }}
              className="rounded-lg shadow-md"
              priority
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              Join SkillSwap Hub
            </h1>
            <p className="text-base text-gray-600 mt-1">
              Connect, Learn, and Share Your Skills
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="firstName"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={`mt-1 block w-full p-2 border ${errors.firstName ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  aria-invalid={errors.firstName ? "true" : "false"}
                  aria-describedby={
                    errors.firstName ? "firstName-error" : undefined
                  }
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600" id="firstName-error">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="lastName"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={`mt-1 block w-full p-2 border ${errors.lastName ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  aria-invalid={errors.lastName ? "true" : "false"}
                  aria-describedby={
                    errors.lastName ? "lastName-error" : undefined
                  }
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600" id="lastName-error">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`mt-1 block w-full p-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                placeholder="johndoe@example.com"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" id="email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="phone"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className={`mt-1 block w-full p-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={handleChange}
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600" id="phone-error">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="title"
              >
                Professional Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className={`mt-1 block w-full p-2 border ${errors.title ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                placeholder="Software Engineer"
                value={formData.title}
                onChange={handleChange}
                aria-invalid={errors.title ? "true" : "false"}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600" id="title-error">
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`mt-1 block w-full p-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" id="password-error">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`mt-1 block w-full p-2 border ${errors.confirmPassword ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm`}
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
              />
              {errors.confirmPassword && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="confirmPassword-error"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5 mt-1">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={agreeToTerms}
                  onChange={handleChange}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border ${errors.terms ? "border-red-500" : "border-gray-300"} rounded`}
                  aria-invalid={errors.terms ? "true" : "false"}
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                />
              </div>
              <div className="ml-2">
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600">
                    Privacy Policy
                  </Link>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600" id="terms-error">
                    {errors.terms}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 flex justify-center items-center"
              >
                {isLoading && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600">
                Login
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <Link href="/" className="text-blue-600">
                Back to Homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
