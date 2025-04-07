"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, LockKeyhole, User, UserPlus, LogIn, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = searchParams.get("redirected") === "true";
  const returnTo = searchParams.get("returnTo") || "/";
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration states
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    if (result?.error) {
      toast.error("Failed to sign in. Please check your credentials.");
    } else {
      router.push(returnTo);
      router.refresh();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is an image and not too large (under 5MB)
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    
    // Check for supported image formats
    const supportedFormats = ['image/jpeg', 'image/png', 'image/gif'];
    if (!supportedFormats.includes(file.type)) {
      toast.error("Please use JPG, PNG or GIF format only");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          profileImage
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if error is Imgur-related
        if (data.error && data.error.includes("Image upload failed")) {
          throw new Error(data.error);
        }
        throw new Error(data.error || "Registration failed");
      }
      
      toast.success("Registration successful! You can now log in.");
      
      // Auto-login the user
      const result = await signIn("credentials", {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      });
      
      if (!result?.error) {
        router.push(returnTo);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Account Access</h1>
      
      {redirected && (
        <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription>
            Authentication is required to access this content. Please sign in or register.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Your email"
                      className="pl-8"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      className="pl-8"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <LogIn className="mr-2 h-4 w-4" /> Sign in
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Important: Your profile details cannot be changed after registration. Please review carefully before submitting.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleRegister}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="register-name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      placeholder="Your name"
                      className="pl-8"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Your email"
                      className="pl-8"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-8"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters with uppercase, lowercase, and numbers.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-image">Profile Image (Required)</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {profileImage ? "Change Image" : "Upload Image"}
                    </Button>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profile images are uploaded to Imgur and will be publicly accessible.
                    Only JPG, PNG, and GIF formats are supported.
                  </p>
                  {profileImage && (
                    <div className="mt-2 flex justify-center">
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border">
                        <Image 
                          src={profileImage}
                          alt="Profile preview"
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <UserPlus className="mr-2 h-4 w-4" /> {isLoading ? "Creating account..." : "Register"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Button variant="link" onClick={() => router.push("/")}>
            Return to home page
          </Button>
        </div>
      </div>
    </div>
  );
} 