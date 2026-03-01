import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Star, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FavoriteAddressSelectorProps {
  value: string;
  onChange: (address: string) => void;
  label: string;
  placeholder: string;
  type: "pickup" | "delivery";
}

export default function FavoriteAddressSelector({
  value,
  onChange,
  label,
  placeholder,
  type,
}: FavoriteAddressSelectorProps) {
  const [showAddNew, setShowAddNew] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");

  // Get favorite addresses
  const { data: favoriteAddresses = [], refetch } = trpc.favoriteAddresses.list.useQuery();

  // Add favorite mutation
  const addFavoriteMutation = trpc.favoriteAddresses.create.useMutation({
    onSuccess: () => {
      toast.success("Favori adres eklendi");
      refetch();
      setShowAddNew(false);
      setNewAddressLabel("");
    },
    onError: (error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleSelectFavorite = (favoriteId: string) => {
    const favorite = favoriteAddresses.find(f => f.id === parseInt(favoriteId));
    if (favorite) {
      onChange(favorite.address);
      toast.success(`"${favorite.label}" adresi seçildi`);
    }
  };

  const handleAddToFavorites = () => {
    if (!value || !newAddressLabel) {
      toast.error("Lütfen adres ve etiket girin");
      return;
    }

    addFavoriteMutation.mutate({
      label: newAddressLabel,
      address: value,
      latitude: "0", // Will be updated when user provides coordinates
      longitude: "0",
    });
  };

  // Show all favorite addresses
  const filteredFavorites = favoriteAddresses;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {value && !showAddNew && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAddNew(!showAddNew)}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Star className="h-4 w-4 mr-1" />
            Favorilere Ekle
          </Button>
        )}
      </div>

      {/* Favorite Selector */}
      {filteredFavorites.length > 0 && (
        <Select onValueChange={handleSelectFavorite}>
          <SelectTrigger className="w-full bg-orange-50 border-orange-200 hover:bg-orange-100">
            <SelectValue placeholder="⭐ Favori adreslerimden seç" />
          </SelectTrigger>
          <SelectContent>
            {filteredFavorites.map((favorite) => (
              <SelectItem key={favorite.id} value={favorite.id.toString()}>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                  <div>
                    <div className="font-semibold">{favorite.label}</div>
                    <div className="text-xs text-gray-600 truncate max-w-[300px]">
                      {favorite.address}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Add to Favorites Form */}
      {showAddNew && value && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-orange-700 font-semibold">
            <Plus className="h-4 w-4" />
            Favorilere Ekle
          </div>
          <input
            type="text"
            placeholder="Etiket (örn: Ev, İş, Okul)"
            value={newAddressLabel}
            onChange={(e) => setNewAddressLabel(e.target.value)}
            className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="text-sm text-gray-600 bg-white p-2 rounded border border-orange-200">
            <strong>Adres:</strong> {value}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAddToFavorites}
              disabled={addFavoriteMutation.isPending || !newAddressLabel}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {addFavoriteMutation.isPending ? "Ekleniyor..." : "Kaydet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddNew(false);
                setNewAddressLabel("");
              }}
              className="flex-1"
            >
              İptal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
