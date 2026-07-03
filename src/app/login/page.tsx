import { LoginForm } from "@/components/login-form";
import { isGoogleConfigured } from "@/lib/google-auth";

export default function LoginPage() {
  return <LoginForm googleConfigured={isGoogleConfigured()} />;
}
