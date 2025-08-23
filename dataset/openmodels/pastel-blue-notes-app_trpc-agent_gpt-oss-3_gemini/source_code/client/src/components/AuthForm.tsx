import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import type { User, CreateUserInput, LoginInput } from "../../../server/src/schema";

interface AuthFormProps {
  onAuth: (user: User) => void;
}

export function AuthForm({ onAuth }: AuthFormProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const loginInput: LoginInput = { email, password };
      const user = await trpc.login.mutate(loginInput);
      onAuth(user);
    } catch (err) {
      console.error(err);
      setError("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const createInput: CreateUserInput = { email, password };
      await trpc.createUser.mutate(createInput);
      // After creating, automatically log in
      const user = await trpc.login.mutate({ email, password });
      onAuth(user);
    } catch (err) {
      console.error(err);
      setError("Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">Welcome</h2>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <form className="space-y-4">
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex space-x-2">
          <Button type="submit" onClick={handleLogin} disabled={isLoading} className="flex-1">
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSignup}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>
        </div>
      </form>
    </div>
  );
}
