import RegistrationForm from "../../components/auth/RegistrationForm";
import ProofileLogo from "@/components/branding/ProofileLogo";
import Link from "next/link";
import { Shield, Star, Zap, CheckCircle } from "lucide-react";

export default function RegisterPage() {
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
                Join Proofile Today
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Build your verified professional profile in minutes
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Get Verified</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Multi-layer verification for credentials and experience</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Build Reputation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Collect peer ratings from colleagues</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Get Matched</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">AI finds opportunities perfect for your skills</p>
                </div>
              </div>
            </div>
            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Free forever</span>
                <span className="text-green-600 dark:text-green-400">•</span>
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create your account</h2>
            <RegistrationForm />
          </div>
        </div>
      </div>
    </div>
  );
}