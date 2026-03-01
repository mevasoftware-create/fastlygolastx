import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, User as UserIcon, Calendar, Shield, Upload, Loader2, Edit2, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function Profile() {
  const { t } = useTranslation();
  const { user, loading, isAuthenticated } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showPersonalInfoDialog, setShowPersonalInfoDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const uploadAvatarMutation = trpc.user.uploadAvatar.useMutation();
  const updateProfileMutation = trpc.user.updateProfile.useMutation();
  const changePasswordMutation = trpc.user.changePassword.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileSizeError') || "File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await uploadAvatarMutation.mutateAsync({
          base64Image: base64,
          mimeType: file.type,
        });
        toast.success(t('photoUploadSuccess') || "Photo uploaded successfully");
        await utils.auth.me.refetch();
        setIsUploading(false);
      } catch (error: any) {
        toast.error(error.message || t('photoUploadError') || "Photo upload failed");
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync(formData);
      toast.success(t('profileUpdatedSuccess') || 'Profile updated successfully');
      setShowPersonalInfoDialog(false);
      utils.auth.me.invalidate();
    } catch (error: any) {
      toast.error(error.message || t('profileUpdateFailed') || 'Profile update failed');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
      toast.error(t('pleaseFillAllPasswordFields') || 'Please fill all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t('passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(t('passwordChangedSuccess') || 'Password changed successfully');
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || t('passwordChangeFailed') || 'Password change failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) return null;

  // Format member since date
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'N/A';
  const lastSignIn = user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-white to-amber-50/20">
      <Header />
      
      <main className="container max-w-2xl py-8 px-4">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Avatar Upload Card */}
        <Card className="mb-6 border-orange-100">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              {/* Avatar Circle */}
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-4 border-orange-300 shadow-lg">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-orange-500" />
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <label htmlFor="avatar-upload">
                <Button
                  variant="outline"
                  className="border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 rounded-xl px-6"
                  disabled={isUploading}
                  asChild
                >
                  <span className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </span>
                </Button>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-2">Max 5MB, JPG/PNG</p>
            </div>
          </CardContent>
        </Card>

        {/* Role & Member Since Card */}
        <Card className="mb-6 border-orange-100">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-orange-500" />
                <span className="text-gray-600">Role:</span>
                <span className="font-semibold capitalize">{user.role || 'User'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span className="text-gray-600">Member since:</span>
                <span className="font-semibold">{memberSince}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="mb-6 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <h2 className="text-xl font-bold">Personal Information</h2>
              <p className="text-sm text-gray-600">Update your personal details</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl"
              onClick={() => setShowPersonalInfoDialog(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-5 w-5 text-orange-500" />
                <Label className="text-gray-700 font-semibold">Name</Label>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-gray-900">{user.name || 'Not specified'}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-orange-500" />
                <Label className="text-gray-700 font-semibold">Email</Label>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-gray-900">{user.email}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-5 w-5 text-orange-500" />
                <Label className="text-gray-700 font-semibold">Phone</Label>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-gray-900">{user.phone || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="mb-6 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                Change Password
              </h2>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardHeader>
        </Card>

        {/* Account Activity Card */}
        <Card className="mb-6 border-orange-100">
          <CardHeader>
            <h2 className="text-xl font-bold">Account Activity</h2>
            <p className="text-sm text-gray-600">Your recent account activity</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold">Last Sign In</p>
                <p className="text-sm text-gray-600">{lastSignIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Edit Dialog */}
        <Dialog open={showPersonalInfoDialog} onOpenChange={setShowPersonalInfoDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Personal Information</DialogTitle>
              <DialogDescription>
                Update your name and phone number
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPersonalInfoDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Current Password */}
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
