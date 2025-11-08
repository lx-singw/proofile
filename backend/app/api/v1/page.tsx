'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // The backend API URL should be configured in your environment variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors and other issues
        let errorMessage = 'An unknown error occurred.';
        if (data.detail) {
            if (Array.isArray(data.detail)) {
                // Handle Pydantic validation errors
                errorMessage = data.detail.map((err: any) => err.msg).join(', ');
            } else {
                // Handle other FastAPI HTTPExceptions
                errorMessage = data.detail;
            }
        }
        throw new Error(errorMessage);
      }

      // Handle success
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login'); // Redirect to login page after a short delay
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Full Name:</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Register</button>
      </form>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}