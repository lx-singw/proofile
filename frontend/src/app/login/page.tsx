import LoginForm from "../../components/auth/LoginForm";
import ProofileLogo from "@/components/branding/ProofileLogo";
import Link from "next/link";
import { Shield, CheckCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="p-6">
        <Link href="/home" className="inline-flex items-center">
          <ProofileLogo size={32} showWordmark={true} />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <div className="mb-6">
              <Shield className="w-16 h-16 text-green-500 mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome back to Proofile
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Sign in to access your verified professional profile
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Verified Credentials</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Multi-layer verification for work, education, and skills</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Peer Ratings</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Real feedback from colleagues who worked with you</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI Job Matching</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Smart opportunities matched to your verified skills</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Sign in</h2>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
