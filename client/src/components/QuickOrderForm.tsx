import { useState } from "react";
import { MapPin, Zap, Bike, Car, Truck, CircleDashed, ArrowRight, Banknote, Navigation } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AddressMapPicker } from "./AddressMapPicker";
import { trpc } from "@/lib/trpc";

export function QuickOrderForm() {
  const { t } = useTranslation();
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [packageSize, setPackageSize] = useState<"small" | "medium" | "large">("medium");
  const [vehicleType, setVehicleType] = useState<"bicycle" | "motorcycle" | "car" | "any">("any");

  const { data: priceData, isLoading: isPriceLoading } = trpc.pricing.calculate.useQuery(
    {
      pickupLatitude: pickupCoords?.lat ?? 0,
      pickupLongitude: pickupCoords?.lng ?? 0,
      deliveryLatitude: deliveryCoords?.lat ?? 0,
      deliveryLongitude: deliveryCoords?.lng ?? 0,
      vehicleType,
      packageSize,
      priority: "normal",
      orderType: "individual",
    },
    {
      enabled: !!(pickupCoords && deliveryCoords),
      refetchOnWindowFocus: false,
    }
  );

  const handleSubmit = () => {
    const params = new URLSearchParams({
      pickupAddress: pickupAddress || "",
      deliveryAddress: deliveryAddress || "",
      pickupLat: pickupCoords?.lat.toString() || "",
      pickupLng: pickupCoords?.lng.toString() || "",
      deliveryLat: deliveryCoords?.lat.toString() || "",
      deliveryLng: deliveryCoords?.lng.toString() || "",
      packageSize,
      vehicleType,
    });
    window.location.href = `/new-order?${params.toString()}`;
  };

  const formatPrice = (cents: number | undefined) => {
    if (!cents) return "€0.00";
    return `€${(cents / 100).toFixed(2)}`;
  };

  const packageOptions = [
    { value: "small" as const, label: t("small"), icon: "S" },
    { value: "medium" as const, label: t("medium"), icon: "M" },
    { value: "large" as const, label: t("large"), icon: "L" },
  ];

  const vehicleOptions = [
    { value: "bicycle" as const, label: t("bicycle"), Icon: Bike },
    { value: "motorcycle" as const, label: t("motorcycle"), Icon: Truck },
    { value: "car" as const, label: t("car"), Icon: Car },
    { value: "any" as const, label: t("any"), Icon: CircleDashed },
  ];

  const canSubmit = pickupAddress && deliveryAddress;

  return (
    <div className="w-full">
      {/* Outer card with 3D depth shadow */}
      <div
        className="bg-white rounded-3xl overflow-hidden border border-orange-100/60"
        style={{
          boxShadow:
            "0 4px 0 0 #e8620a, 0 8px 32px 0 rgba(255,107,53,0.18), 0 2px 8px 0 rgba(0,0,0,0.08)",
        }}
      >
        {/* Header — deeper orange with 3D bottom edge */}
        <div
          className="relative px-6 py-5 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #ff7a35 0%, #f55f00 60%, #e05000 100%)",
            boxShadow: "inset 0 -3px 0 0 rgba(0,0,0,0.15)",
          }}
        >
          {/* Decorative light streaks */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-2 left-6 w-24 h-24 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-4 w-16 h-16 bg-white rounded-full blur-xl" />
          </div>

          <div className="relative flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.18)",
                boxShadow: "0 2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight tracking-tight">
                {t("quickCourierCall")}
              </h2>
              <p className="text-white/70 text-xs mt-0.5">{t("enterAddressesCallCourier")}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Address Fields */}
          <div className="relative">
            {/* Route line */}
            <div className="absolute left-[18px] top-[52px] bottom-[52px] w-0.5 bg-gradient-to-b from-orange-400 to-emerald-400 z-0 rounded-full" />

            <div className="space-y-3">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 pt-[22px]">
                  <div
                    className="w-9 h-9 rounded-full bg-orange-50 border-2 border-orange-400 flex items-center justify-center"
                    style={{ boxShadow: "0 2px 0 #c45000, 0 4px 8px rgba(255,107,53,0.2)" }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">
                    {t("pickup") || "Pickup"}
                  </p>
                  <div
                    className="rounded-xl border border-gray-200 hover:border-orange-300 focus-within:border-orange-400 transition-all duration-200"
                    style={{
                      background: "#fafafa",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.8)",
                    }}
                  >
                    <AddressMapPicker
                      label=""
                      value={pickupAddress}
                      onChange={(address: string, lat: number, lng: number) => {
                        setPickupAddress(address);
                        setPickupCoords({ lat, lng });
                      }}
                      placeholder={t("enterPickupAddress")}
                      compact
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 pt-[22px]">
                  <div
                    className="w-9 h-9 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center"
                    style={{ boxShadow: "0 2px 0 #0a7c50, 0 4px 8px rgba(16,185,129,0.2)" }}
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                    {t("delivery") || "Delivery"}
                  </p>
                  <div
                    className="rounded-xl border border-gray-200 hover:border-emerald-300 focus-within:border-emerald-400 transition-all duration-200"
                    style={{
                      background: "#fafafa",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.8)",
                    }}
                  >
                    <AddressMapPicker
                      label=""
                      value={deliveryAddress}
                      onChange={(address: string, lat: number, lng: number) => {
                        setDeliveryAddress(address);
                        setDeliveryCoords({ lat, lng });
                      }}
                      placeholder={t("enterDeliveryAddress")}
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Package Size */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
              <span
                className="w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #ff7a35, #f55f00)" }}
              >
                P
              </span>
              {t("packageSize")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "small" as const, label: t("small"), weight: "< 3 kg", emoji: "📦" },
                { value: "medium" as const, label: t("medium"), weight: "3–10 kg", emoji: "🗃️" },
                { value: "large" as const, label: t("large"), weight: "10+ kg", emoji: "📫" },
              ]).map(({ value, label, weight, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPackageSize(value)}
                  className="relative rounded-2xl transition-all duration-200 flex flex-col items-center justify-center gap-1.5 select-none py-4 px-2"
                  style={
                    packageSize === value
                      ? {
                          background: "linear-gradient(160deg, #ff7a35 0%, #f55f00 100%)",
                          border: "2px solid #f55f00",
                          color: "white",
                          boxShadow: "0 4px 0 #c04500, 0 8px 20px rgba(255,107,53,0.3)",
                          transform: "translateY(-2px)",
                        }
                      : {
                          background: "#f9fafb",
                          border: "2px solid #e5e7eb",
                          color: "#6b7280",
                          boxShadow: "0 2px 0 #d1d5db",
                        }
                  }
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="text-sm font-bold leading-tight">{label}</span>
                  <span
                    className="text-[10px] font-medium leading-none"
                    style={{ color: packageSize === value ? "rgba(255,255,255,0.8)" : "#9ca3af" }}
                  >
                    {weight}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
              <span
                className="w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #ff7a35, #f55f00)" }}
              >
                V
              </span>
              {t("vehicleType")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {vehicleOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVehicleType(value)}
                  className="py-3 px-1 rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-1.5 border-2 select-none"
                  style={
                    vehicleType === value
                      ? {
                          background: "linear-gradient(160deg, #ff7a35 0%, #f55f00 100%)",
                          borderColor: "#f55f00",
                          color: "white",
                          boxShadow: "0 3px 0 #c04500, 0 6px 16px rgba(255,107,53,0.35)",
                          transform: "translateY(-1px)",
                        }
                      : {
                          background: "white",
                          borderColor: "#e5e7eb",
                          color: "#9ca3af",
                          boxShadow: "0 2px 0 #d1d5db, 0 2px 6px rgba(0,0,0,0.05)",
                        }
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Estimate */}
          {(priceData || isPriceLoading) && pickupCoords && deliveryCoords && (
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #fff7f2 0%, #fff3e8 100%)",
                border: "1px solid #fde0cc",
                boxShadow: "0 2px 0 #f5d0b0, 0 4px 12px rgba(255,107,53,0.08)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #ff7a35, #f55f00)",
                    boxShadow: "0 2px 0 #c04500",
                  }}
                >
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700">{t("estimatedPrice")}</p>
              </div>
              {isPriceLoading ? (
                <div className="h-8 w-20 bg-orange-200/50 rounded-lg animate-pulse" />
              ) : (
                <span
                  className="text-2xl font-extrabold"
                  style={{ color: "#f55f00", textShadow: "0 1px 0 rgba(0,0,0,0.1)" }}
                >
                  {formatPrice(priceData?.totalFee)}
                </span>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2.5 select-none"
            style={
              canSubmit
                ? {
                    background: "linear-gradient(160deg, #ff7a35 0%, #f55f00 100%)",
                    color: "white",
                    boxShadow: "0 4px 0 #c04500, 0 8px 24px rgba(255,107,53,0.4)",
                    transform: "translateY(0)",
                  }
                : {
                    background: "#f3f4f6",
                    color: "#9ca3af",
                    cursor: "not-allowed",
                    boxShadow: "0 2px 0 #d1d5db",
                  }
            }
            onMouseDown={(e) => {
              if (canSubmit) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(3px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 0 #c04500, 0 2px 8px rgba(255,107,53,0.3)";
              }
            }}
            onMouseUp={(e) => {
              if (canSubmit) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 0 #c04500, 0 8px 24px rgba(255,107,53,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 0 #c04500, 0 8px 24px rgba(255,107,53,0.4)";
              }
            }}
          >
            {canSubmit ? (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>{t("callCourierNow")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>{t("callCourierNow")}</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
