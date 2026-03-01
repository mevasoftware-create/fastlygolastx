import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TrendingUp, Plus, Trash2, Power, PowerOff, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SurgePricing() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    reason: "",
    multiplier: "1.0",
    isActive: false,
    startDate: "",
    endDate: "",
  });

  const { data: surgeConfigs, refetch } = trpc.admin.getAllSurgeConfigs.useQuery();
  const { data: activeSurge } = trpc.admin.getActiveSurgeConfig.useQuery();
  
  const createMutation = trpc.admin.createSurgeConfig.useMutation({
    onSuccess: () => {
      toast.success("Surge configuration created successfully");
      refetch();
      setShowCreateForm(false);
      setFormData({
        name: "",
        reason: "",
        multiplier: "1.0",
        isActive: false,
        startDate: "",
        endDate: "",
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const toggleMutation = trpc.admin.toggleSurgeConfig.useMutation({
    onSuccess: () => {
      toast.success("Surge configuration updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.deleteSurgeConfig.useMutation({
    onSuccess: () => {
      toast.success("Surge configuration deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const multiplier = parseFloat(formData.multiplier);
    if (isNaN(multiplier) || multiplier < 0.5 || multiplier > 5.0) {
      toast.error("Multiplier must be between 0.5 and 5.0");
      return;
    }

    await createMutation.mutateAsync({
      name: formData.name,
      reason: formData.reason,
      multiplier,
      isActive: formData.isActive,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    });
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    await toggleMutation.mutateAsync({ id, isActive });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this surge configuration?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const formatMultiplier = (multiplier: string | number) => {
    const num = typeof multiplier === 'string' ? parseFloat(multiplier) : multiplier;
    const percentage = ((num - 1) * 100).toFixed(0);
    return num >= 1 ? `+${percentage}%` : `${percentage}%`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Surge Pricing Management
          </h1>
          <p className="text-gray-600 mt-1">
            Control dynamic pricing for special conditions (weather, holidays, events)
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Surge
        </Button>
      </div>

      {/* Active Surge Alert */}
      {activeSurge && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Active Surge Pricing
            </CardTitle>
            <CardDescription>
              {activeSurge.name} - {formatMultiplier(activeSurge.multiplier)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{activeSurge.reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Surge Configuration</CardTitle>
            <CardDescription>
              Define manual surge pricing for special conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Snow Storm Surge"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="multiplier">Multiplier (0.5 - 5.0)</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={formData.multiplier}
                    onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1.0 = no change, 1.5 = +50%, 2.0 = +100%
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Heavy snowfall, limited courier availability"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Activate immediately</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Surge"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Surge Configurations List */}
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">All Surge Configurations</h2>
        {surgeConfigs && surgeConfigs.length > 0 ? (
          surgeConfigs.map((config) => (
            <Card key={config.id} className={config.isActive ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.name}
                      <span className={`text-sm font-normal px-2 py-1 rounded ${
                        config.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {config.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-sm font-normal px-2 py-1 rounded bg-orange-100 text-orange-700">
                        {formatMultiplier(config.multiplier)}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-2">{config.reason}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={config.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggle(config.id, !config.isActive)}
                      disabled={toggleMutation.isPending}
                    >
                      {config.isActive ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(config.startDate || config.endDate) && (
                <CardContent>
                  <div className="text-sm text-gray-600">
                    {config.startDate && (
                      <p>Start: {new Date(config.startDate).toLocaleString()}</p>
                    )}
                    {config.endDate && (
                      <p>End: {new Date(config.endDate).toLocaleString()}</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No surge configurations yet. Create one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
