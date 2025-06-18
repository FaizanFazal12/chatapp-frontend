'use client'
import { useState } from "react";
import { useLoginUserMutation, useRegisterUserMutation } from "@/store/api/userApi";
import { useUser } from "@/context/UserProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isRegister, setIsRegister] = useState(false);
  const [loginUser, { isLoading: isLoginLoading }] = useLoginUserMutation();
  const [registerUser, { isLoading: isRegisterLoading, error: registerError }] = useRegisterUserMutation();
  const { setUser, user } = useUser();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try{
      const response = await loginUser({
        email: e.target.email.value,
        password: e.target.password.value
      }).unwrap();
      setUser(response.user);
      router.push('/dashboard')
    }
    catch(error){
      alert(error.data.message)
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser({
        name: e.target.name.value,
        email: e.target.email.value,
        password: e.target.password.value,
      }).unwrap();
      alert(response.message)
      setUser(response.user);
      router.push('/dashboard')
    }
    catch (error) {
      alert(error.data.message)
    }   
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          {isRegister ? 'Register' : 'Login'}
        </h1>

        <form
          onSubmit={isRegister ? handleRegister : handleLogin}
          className="space-y-4"
        >
          {isRegister && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            minLength={6}
            maxLength={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoginLoading || isRegisterLoading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${(isLoginLoading || isRegisterLoading)
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            {(isRegister ? isRegisterLoading : isLoginLoading)
              ? (isRegister ? 'Registering...' : 'Logging in...')
              : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-500 hover:underline font-medium"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
