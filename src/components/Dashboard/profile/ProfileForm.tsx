'use client';

import { useState } from 'react';

export default function ProfileForm() {
  const [formState, setFormState] = useState({
    userId: '', // put your test user ID here
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('userId', formState.userId);
    if (formState.firstName) formData.append('firstName', formState.firstName);
    if (formState.lastName) formData.append('lastName', formState.lastName);
    if (formState.email) formData.append('email', formState.email);
    if (formState.phone) formData.append('phone', formState.phone);
    if (formState.title) formData.append('title', formState.title);
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Profile updated successfully!');
        console.log('Updated user:', data.user);
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error while updating profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded">
      <input name="userId" placeholder="User ID" value={formState.userId} onChange={handleChange} className="w-full border p-2" required />

      <input name="firstName" placeholder="First Name" value={formState.firstName} onChange={handleChange} className="w-full border p-2" />
      <input name="lastName" placeholder="Last Name" value={formState.lastName} onChange={handleChange} className="w-full border p-2" />
      <input name="email" placeholder="Email" value={formState.email} onChange={handleChange} className="w-full border p-2" />
      <input name="phone" placeholder="Phone" value={formState.phone} onChange={handleChange} className="w-full border p-2" />
      <input name="title" placeholder="Title" value={formState.title} onChange={handleChange} className="w-full border p-2" />
      
      <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border p-2" />

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Profile</button>

      {message && <p className="text-green-600 mt-2">{message}</p>}
    </form>
  );
}
