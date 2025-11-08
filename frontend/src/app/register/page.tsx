import RegistrationForm from "../../components/auth/RegistrationForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        <RegistrationForm />
      </div>
    </div>
  );
}