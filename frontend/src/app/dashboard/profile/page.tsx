"use client";

import { useEffect, useState } from "react";
import { useMetadata } from "@/providers/MetadataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, User as UserIcon, Lock, Image as ImageIcon, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { capitalizeWords } from "@/lib/utils";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function ProfilePage() {
  const { setTitle } = useMetadata();
  const setAuthUser = useAuthStore((state) => state.setUser);
  
  useEffect(() => {
    setTitle("My Profile");
  }, [setTitle]);

  const { data: response, isLoading } = useSWR("/users/me", fetcher);
  const userProfile = response?.data;

  // Profile Details State
  const [savingProfile, setSavingProfile] = useState(false);
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState("");

  // Password State
  const [savingPassword, setSavingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setExistingAvatarUrl(userProfile.avatarUrl || "");
    }
  }, [userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSavingProfile(true);
    try {
      let finalAvatarUrl: string | undefined = undefined;

      // Handle photo upload if selected
      if (photoFile) {
        try {
          const presignedRes = await api.post("/uploads/presigned-url", {
            filename: photoFile.name,
            contentType: photoFile.type,
            folder: "avatars"
          });
          
          const { uploadUrl, fileUrl } = presignedRes.data.data;

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: photoFile,
            headers: { "Content-Type": photoFile.type },
          });

          if (!uploadRes.ok) {
            throw new Error(`Cloudflare R2 returned ${uploadRes.status}`);
          }

          finalAvatarUrl = fileUrl;
        } catch (err: any) {
          toast.error("Failed to upload avatar. Check backend R2 configuration.");
          setSavingProfile(false);
          return;
        }
      }

      const updateData: any = { name };
      if (finalAvatarUrl) {
        updateData.avatarUrl = finalAvatarUrl;
      }

      const res = await api.patch("/users/me", updateData);
      const updatedUser = res.data.data;

      // Update global auth store so the topbar reflects changes
      setAuthUser(updatedUser);
      
      // Refresh local SWR data
      mutate("/users/me");

      toast.success("Profile updated successfully!");
      setPhotoFile(null); // Clear selected file after successful upload
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await api.post("/auth/password/change", {
        oldPassword,
        newPassword
      });
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Profile</h1>
        <p className="text-neutral-400">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <UserIcon className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <UserIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Personal Information</h2>
              <p className="text-sm text-neutral-400">Update your name and photo.</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-6 relative z-10">
            
            <div className="space-y-4">
              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {photoFile ? (
                    <img src={URL.createObjectURL(photoFile)} alt="Preview" className="h-full w-full object-cover" />
                  ) : existingAvatarUrl ? (
                    <img src={existingAvatarUrl.startsWith('http') ? existingAvatarUrl : `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ''}${existingAvatarUrl}`} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="w-8 h-8 text-neutral-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label htmlFor="photo-upload" className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-neutral-900 border border-neutral-700 text-sm font-medium text-white hover:bg-neutral-800 cursor-pointer transition-colors w-fit">
                    <UploadCloud className="w-4 h-4 mr-2 text-neutral-400" />
                    {photoFile ? "Change Photo" : "Upload Photo"}
                  </label>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => setPhotoFile(null)}
                      className="ml-3 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <input 
                    id="photo-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Image must be less than 2MB");
                          e.target.value = "";
                          return;
                        }
                        setPhotoFile(file);
                      }
                    }}
                  />
                  <p className="text-xs text-neutral-500">Max size: 2MB. Format: JPG/PNG.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Email Address</label>
                <Input 
                  value={userProfile?.email || ""}
                  readOnly
                  disabled
                  className="bg-neutral-900/50 border-neutral-800 text-neutral-500 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500">Email address cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Full Name</label>
                <Input 
                  value={name}
                  onChange={(e) => setName(capitalizeWords(e.target.value))}
                  className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-indigo-500 text-white"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex justify-end">
              <Button 
                type="submit" 
                disabled={savingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                {savingProfile ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Profile</>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Security / Password */}
        <div className="bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Lock className="w-32 h-32 text-purple-500" />
          </div>
          
          <div className="flex items-center gap-3 border-b border-neutral-800/60 pb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Security</h2>
              <p className="text-sm text-neutral-400">Update your password.</p>
            </div>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-6 relative z-10">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Current Password</label>
                <Input 
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-purple-500 text-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">New Password</label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-purple-500 text-white"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Confirm New Password</label>
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-neutral-900 border-neutral-800 focus:ring-1 focus:ring-purple-500 text-white"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex justify-end">
              <Button 
                type="submit" 
                disabled={savingPassword}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                {savingPassword ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Change Password</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
