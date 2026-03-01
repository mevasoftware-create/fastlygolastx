import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function NotificationPreferences() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [preferences, setPreferences] = useState({
    orderConfirmation: true,
    courierAssigned: true,
    deliveryCompleted: true,
    promotions: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current preferences
  const { data: currentPrefs, isLoading } = trpc.user.getEmailPreferences.useQuery(undefined, {
    enabled: !!user,
  });

  // Update preferences mutation (disabled - feature removed)
  const updateMutation = {
    mutate: () => {
      toast.info("Email preferences are read-only");
    },
    isPending: false,
  };

  // Load preferences when data is available
  useEffect(() => {
    if (currentPrefs) {
      setPreferences({
        orderConfirmation: currentPrefs.orderConfirmation ?? true,
        courierAssigned: currentPrefs.courierAssigned ?? true,
        deliveryCompleted: currentPrefs.deliveryCompleted ?? true,
        promotions: currentPrefs.promotions ?? true,
      });
    }
  }, [currentPrefs]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation(getLoginUrl());
    }
  }, [user, authLoading, setLocation]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.info("Email preferences cannot be changed at this time");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8 text-orange-500" />
            Notification Preferences
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your email notification settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which email notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Confirmation */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="orderConfirmation" className="text-base font-medium">
                  Order Confirmation
                </Label>
                <p className="text-sm text-gray-500">
                  Receive email when your order is confirmed
                </p>
              </div>
              <Switch
                id="orderConfirmation"
                checked={preferences.orderConfirmation}
                onCheckedChange={() => handleToggle("orderConfirmation")}
              />
            </div>

            {/* Courier Assigned */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="courierAssigned" className="text-base font-medium">
                  Courier Assigned
                </Label>
                <p className="text-sm text-gray-500">
                  Receive email when a courier is assigned to your order
                </p>
              </div>
              <Switch
                id="courierAssigned"
                checked={preferences.courierAssigned}
                onCheckedChange={() => handleToggle("courierAssigned")}
              />
            </div>

            {/* Delivery Completed */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deliveryCompleted" className="text-base font-medium">
                  Delivery Completed
                </Label>
                <p className="text-sm text-gray-500">
                  Receive email when your delivery is completed
                </p>
              </div>
              <Switch
                id="deliveryCompleted"
                checked={preferences.deliveryCompleted}
                onCheckedChange={() => handleToggle("deliveryCompleted")}
              />
            </div>

            {/* Promotions */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotions" className="text-base font-medium">
                  Promotions & Updates
                </Label>
                <p className="text-sm text-gray-500">
                  Receive promotional emails and service updates
                </p>
              </div>
              <Switch
                id="promotions"
                checked={preferences.promotions}
                onCheckedChange={() => handleToggle("promotions")}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
