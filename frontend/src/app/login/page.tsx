import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
