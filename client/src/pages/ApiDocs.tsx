import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Database, FileText, Lock, Unlock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ApiDocs() {
  useEffect(() => {
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const endpoints = [
    {
        "category": "Public",
        "method": "GET",
        "path": "public.stats",
        "description": "Anasayfa istatistikleri (toplam sipariş, aktif kurye, müşteri sayısı)",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": {
                "totalOrders": 34,
                "completedOrders": 32,
                "activeCustomers": 61,
                "activeCouriers": 38,
                "completedToday": 0
            }
        }
    },
    {
        "category": "Public",
        "method": "GET",
        "path": "public.recentOrders",
        "description": "Son tamamlanan siparişler listesi",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": [
                {
                    "id": 480001,
                    "orderNumber": "RT-MJRCQU9W-L85EZ",
                    "customerId": 2970302,
                    "courierId": 210008,
                    "restaurantId": null,
                    "orderType": "individual",
                    "pickupAddress": "Majakovski 12, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "42.0006557",
                    "pickupLongitude": "21.4168449",
                    "deliveryAddress": "Dimitrie Cupovski 4-1/11, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "41.9945209",
                    "deliveryLongitude": "21.4313987",
                    "vehicleType": "car",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 1383,
                    "baseFee": 100,
                    "distanceFee": 28,
                    "totalFee": 310,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": 310,
                    "offeredPrice": null,
                    "currentPrice": 310,
                    "priceMultiplier": 100,
                    "packageSize": "small",
                    "status": "delivered",
                    "createdAt": "2025-12-29T16:07:48.000Z",
                    "acceptedAt": "2025-12-29T16:08:26.000Z",
                    "pickedUpAt": "2025-12-29T16:23:43.000Z",
                    "deliveredAt": "2025-12-29T16:39:05.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJRCQU9W-L85EZ-1767025422974.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJRCQU9W-L85EZ-1767026344449.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 390005,
                    "orderNumber": "RT-MJ9BH9ZX-06700",
                    "customerId": 2970104,
                    "courierId": 210008,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "Ss Cyril & Methodius 3, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "41.9921804",
                    "pickupLongitude": "21.4252351",
                    "deliveryAddress": "Ss Cyril & Methodius 3, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "41.9921829",
                    "deliveryLongitude": "21.4252404",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 1,
                    "baseFee": 100,
                    "distanceFee": 0,
                    "totalFee": 100,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-17T01:12:31.000Z",
                    "acceptedAt": "2025-12-24T00:32:01.000Z",
                    "pickedUpAt": "2025-12-24T00:32:25.000Z",
                    "deliveredAt": "2025-12-24T00:32:33.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ9BH9ZX-06700-1766536345192.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ9BH9ZX-06700-1766536352779.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 420001,
                    "orderNumber": "RT-MJIZGNJA-CW9OW",
                    "customerId": 2970104,
                    "courierId": 210008,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "2C5V+VHX, Cvetan Dimov, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "42.0095724",
                    "pickupLongitude": "21.4439597",
                    "deliveryAddress": "2C5V+VHX, Cvetan Dimov, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "42.0096052",
                    "deliveryLongitude": "21.4439793",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 4,
                    "baseFee": 100,
                    "distanceFee": 0,
                    "totalFee": 150,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": 150,
                    "offeredPrice": null,
                    "currentPrice": 150,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-23T19:33:49.000Z",
                    "acceptedAt": "2025-12-24T00:31:58.000Z",
                    "pickedUpAt": "2025-12-24T00:32:11.000Z",
                    "deliveredAt": "2025-12-24T00:32:18.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJIZGNJA-CW9OW-1766536331014.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJIZGNJA-CW9OW-1766536337835.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 390002,
                    "orderNumber": "RT-MJ998YUF-RQZD1",
                    "customerId": 3090048,
                    "courierId": 210008,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "Sdf",
                    "pickupLatitude": "0",
                    "pickupLongitude": "0",
                    "deliveryAddress": "Fff",
                    "deliveryLatitude": "0",
                    "deliveryLongitude": "0",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 0,
                    "baseFee": 100,
                    "distanceFee": 0,
                    "totalFee": 100,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-17T00:10:05.000Z",
                    "acceptedAt": "2025-12-17T00:16:30.000Z",
                    "pickedUpAt": "2025-12-17T00:17:18.000Z",
                    "deliveredAt": "2025-12-17T00:20:35.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ998YUF-RQZD1-1765930637921.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ998YUF-RQZD1-1765930835012.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "card",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 390003,
                    "orderNumber": "RT-MJ99F7SH-BV59O",
                    "customerId": 3090048,
                    "courierId": 210008,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "2C49+M27, Boulevard Ilinden 1000, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "42.00648003615596",
                    "pickupLongitude": "21.417202949523926",
                    "deliveryAddress": "Borka Taleski 6, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "41.997810296660894",
                    "deliveryLongitude": "21.423365142822277",
                    "vehicleType": "any",
                    "packageDescription": "Paleti acmmayin telike var",
                    "specialInstructions": "",
                    "distance": 1090,
                    "baseFee": 100,
                    "distanceFee": 22,
                    "totalFee": 122,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-17T00:14:56.000Z",
                    "acceptedAt": "2025-12-17T00:16:22.000Z",
                    "pickedUpAt": "2025-12-17T00:16:53.000Z",
                    "deliveredAt": "2025-12-17T00:20:25.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ99F7SH-BV59O-1765930612950.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ99F7SH-BV59O-1765930824774.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "card",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 390004,
                    "orderNumber": "RT-MJ99GDQ5-8C927",
                    "customerId": 2970265,
                    "courierId": 210008,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "2F27+82W, Üsküp 1000, Kuzey Makedonya",
                    "pickupLatitude": "42.0010014",
                    "pickupLongitude": "21.4624931",
                    "deliveryAddress": "ул. Македонија бр. 5 1000, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "41.994133193659714",
                    "deliveryLongitude": "21.43128302383424",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 2690,
                    "baseFee": 100,
                    "distanceFee": 54,
                    "totalFee": 154,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-17T00:15:50.000Z",
                    "acceptedAt": "2025-12-17T00:16:20.000Z",
                    "pickedUpAt": "2025-12-17T00:16:42.000Z",
                    "deliveredAt": "2025-12-17T00:20:15.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ99GDQ5-8C927-1765930602201.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ99GDQ5-8C927-1765930814719.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 390001,
                    "orderNumber": "RT-MJ94YC0I-H2V6W",
                    "customerId": 3060521,
                    "courierId": 270009,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "Risto Ravanovski 2, Shkupi 1000, Kuzey Makedonya",
                    "pickupLatitude": "41.99569566826223",
                    "pickupLongitude": "21.411157119568216",
                    "deliveryAddress": "Kjurchiska 21, Skopje 1000, Самоилова 5, Shkupi 1000, Kuzey Makedonya",
                    "deliveryLatitude": "42.00176024262225",
                    "deliveryLongitude": "21.435856809679663",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 2150,
                    "baseFee": 100,
                    "distanceFee": 43,
                    "totalFee": 143,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-16T22:09:50.000Z",
                    "acceptedAt": "2025-12-16T22:10:30.000Z",
                    "pickedUpAt": "2025-12-16T22:11:45.000Z",
                    "deliveredAt": "2025-12-16T22:15:59.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ94YC0I-H2V6W-1765923104628.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ94YC0I-H2V6W-1765923358383.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 360020,
                    "orderNumber": "RT-MJ911HKD-IXJKY",
                    "customerId": 2970308,
                    "courierId": 270009,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "Treska Furniture, 3та Македонска Бригада бр.10, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "41.99564660012252",
                    "pickupLongitude": "21.41305859883154",
                    "deliveryAddress": "Anton Popov 1 lok. 3,4,5 MK Skopje MK, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "41.98838876895371",
                    "deliveryLongitude": "21.433572392692568",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 1878,
                    "baseFee": 100,
                    "distanceFee": 38,
                    "totalFee": 138,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-16T20:20:19.000Z",
                    "acceptedAt": "2025-12-16T20:21:02.000Z",
                    "pickedUpAt": "2025-12-16T20:35:44.000Z",
                    "deliveredAt": "2025-12-16T20:35:52.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ911HKD-IXJKY-1765917343454.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ911HKD-IXJKY-1765917352309.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 360018,
                    "orderNumber": "RT-MJ8ZUGU1-Q2G2X",
                    "customerId": 2970302,
                    "courierId": 270009,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "XCRJ+FFW, Ss Cyril & Methodius, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "41.99103918711129",
                    "pickupLongitude": "21.431283022524568",
                    "deliveryAddress": "Brakja Gjinoski 219, Gostivar 1230, Kuzey Makedonya",
                    "deliveryLatitude": "41.800065760303475",
                    "deliveryLongitude": "20.906469426277678",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 48351,
                    "baseFee": 100,
                    "distanceFee": 967,
                    "totalFee": 1067,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-16T19:46:51.000Z",
                    "acceptedAt": "2025-12-16T19:48:00.000Z",
                    "pickedUpAt": "2025-12-16T19:48:28.000Z",
                    "deliveredAt": "2025-12-16T20:20:30.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ8ZUGU1-Q2G2X-1765914508127.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ8ZUGU1-Q2G2X-1765916429901.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "receiver_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "card",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                },
                {
                    "id": 360019,
                    "orderNumber": "RT-MJ8ZVAEC-TQEKG",
                    "customerId": 2970308,
                    "courierId": 270009,
                    "restaurantId": null,
                    "orderType": "restaurant",
                    "pickupAddress": "9-ti Maj 6, Skopje 1000, Kuzey Makedonya",
                    "pickupLatitude": "41.99773179334241",
                    "pickupLongitude": "21.415765567202598",
                    "deliveryAddress": "Atanas Babata 21, 1000, Skopje 1000, Kuzey Makedonya",
                    "deliveryLatitude": "42.00402695052602",
                    "deliveryLongitude": "21.43715087599425",
                    "vehicleType": "any",
                    "packageDescription": "",
                    "specialInstructions": "",
                    "distance": 1901,
                    "baseFee": 100,
                    "distanceFee": 38,
                    "totalFee": 138,
                    "pricingScenario": "A",
                    "commissionRate": null,
                    "calculatedPrice": null,
                    "offeredPrice": null,
                    "currentPrice": null,
                    "priceMultiplier": 100,
                    "packageSize": "medium",
                    "status": "delivered",
                    "createdAt": "2025-12-16T19:47:30.000Z",
                    "acceptedAt": "2025-12-16T19:48:06.000Z",
                    "pickedUpAt": "2025-12-16T19:48:18.000Z",
                    "deliveredAt": "2025-12-16T19:49:35.000Z",
                    "pickupPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/pickup-photos/RT-MJ8ZVAEC-TQEKG-1765914498250.jpg",
                    "deliveryPhotoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/310519663142180542/ZkKgZDz9VnqDkYQWNb7iTG/delivery-photos/RT-MJ8ZVAEC-TQEKG-1765914574947.jpg",
                    "deliveryNotes": null,
                    "customerSignature": null,
                    "customerRating": null,
                    "customerReview": null,
                    "paymentType": "sender_pays",
                    "paymentStatus": "pending",
                    "paymentMethod": "cash",
                    "collectedAmount": null,
                    "collectedAt": null,
                    "collectedBy": null,
                    "deliveryTimeType": "now",
                    "scheduledDeliveryDate": null,
                    "scheduledTimeSlot": "",
                    "isArchived": false,
                    "archivedAt": null,
                    "archivedBy": null
                }
            ]
        }
    },
    {
        "category": "Public",
        "method": "GET",
        "path": "public.getActiveCouriers",
        "description": "Harita için aktif kuryeleri getirir",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": [
                {
                    "id": 210005,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 210006,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 210007,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 210008,
                    "vehicleType": "motorcycle",
                    "currentLatitude": "41.9945918",
                    "currentLongitude": "21.430928",
                    "isDemo": false,
                    "isAvailable": true
                },
                {
                    "id": 210009,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 210010,
                    "vehicleType": "motorcycle",
                    "currentLatitude": "41.9921227",
                    "currentLongitude": "21.4253565",
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 240001,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270001,
                    "vehicleType": "motorcycle",
                    "currentLatitude": "41.9817178",
                    "currentLongitude": "21.4395766",
                    "isDemo": false,
                    "isAvailable": true
                },
                {
                    "id": 270002,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270003,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270004,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270005,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270006,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270007,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270008,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270009,
                    "vehicleType": "car",
                    "currentLatitude": "41.0414658",
                    "currentLongitude": "28.8670831",
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270010,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270011,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270012,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 270013,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 300001,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 330001,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360001,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360002,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360003,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360004,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360005,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360006,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 360007,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 390001,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 420001,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 420002,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 420003,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 450001,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 450002,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 450003,
                    "vehicleType": "bicycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 480001,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 480002,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 480003,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 510001,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 510002,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 540001,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 540002,
                    "vehicleType": "motorcycle",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 540003,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                },
                {
                    "id": 540004,
                    "vehicleType": "car",
                    "currentLatitude": null,
                    "currentLongitude": null,
                    "isDemo": false,
                    "isAvailable": false
                }
            ]
        }
    },
    {
        "category": "Auth",
        "method": "GET",
        "path": "auth.me",
        "description": "Mevcut kullanıcı bilgisini döndürür",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": [
                {
                    "result": {
                        "data": {
                            "json": null
                        }
                    }
                }
            ]
        }
    },
    {
        "category": "Auth",
        "method": "POST",
        "path": "auth.logout",
        "description": "Kullanıcı oturumunu sonlandırır",
        "auth": false,
        "input": "{}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": {
                "result": {
                    "data": {
                        "json": {
                            "success": true
                        }
                    }
                }
            }
        }
    },
    {
        "category": "Categories",
        "method": "GET",
        "path": "categories.list",
        "description": "Tüm kategorileri listeler",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": [
                {
                    "id": 6,
                    "slug": "pet-supplies",
                    "icon": "🐾",
                    "shortName": "{\"en\":\"Pet Supplies\",\"mk\":\"Производи за Миленици\",\"sq\":\"Produkte për Kafshë\",\"tr\":\"Evcil Hayvan Malzemeleri\"}",
                    "seoMeta": "{\n  \"en\": {\n    \"title\": \"Pet Supplies - Cat & Dog Food, Toys, Accessories | FastlyGo\",\n    \"subtitle\": \"Pet food and supplies delivered in Skopje\",\n    \"description\": \"Order cat food, dog food, pet toys, accessories and care products. Fast delivery of pet supplies in Skopje!\",\n    \"keywords\": \"pet supplies skopje, cat food delivery, dog food delivery, pet toys, pet accessories\"\n  },\n  \"tr\": {\n    \"title\": \"Evcil Hayvan Ürünleri - Kedi ve Köpek Maması, Oyuncaklar | FastlyGo\",\n    \"subtitle\": \"Üsküp'te evcil hayvan maması ve ürünleri teslimatı\",\n    \"description\": \"Kedi maması, köpek maması, oyuncaklar, aksesuarlar ve bakım ürünleri sipariş edin. Üsküp'te hızlı evcil hayvan ürünleri teslimatı!\",\n    \"keywords\": \"üsküp evcil hayvan ürünleri, kedi maması teslimatı, köpek maması teslimatı, evcil hayvan oyuncakları\"\n  },\n  \"mk\": {\n    \"title\": \"Производи за домашни миленици - Храна за мачки и кучиња, играчки | FastlyGo\",\n    \"subtitle\": \"Храна и производи за домашни миленици доставени во Скопје\",\n    \"description\": \"Нарачајте храна за мачки, храна за кучиња, играчки, додатоци и производи за нега. Брза достава на производи за домашни миленици во Скопје!\",\n    \"keywords\": \"производи за домашни миленици скопје, достава храна за мачки, достава храна за кучиња, играчки за миленици\"\n  },\n  \"sq\": {\n    \"title\": \"Produkte për Kafshë Shtëpiake - Ushqim për Mace e Qen, Lodra | FastlyGo\",\n    \"subtitle\": \"Ushqim dhe produkte për kafshë shtëpiake të dërguara në Shkup\",\n    \"description\": \"Porosit ushqim për mace, ushqim për qen, lodra, aksesorë dhe produkte për kujdes. Shpërndarje e shpejtë e produkteve për kafshë shtëpiake në Shkup!\",\n    \"keywords\": \"produkte për kafshë shtëpiake shkup, shpërndarja ushqim për mace, shpërndarja ushqim për qen, lodra për kafshë\"\n  }\n}",
                    "active": true,
                    "displayOrder": 0,
                    "createdAt": "2026-01-06T13:02:18.000Z",
                    "updatedAt": "2026-01-06T22:10:34.000Z"
                },
                {
                    "id": 1,
                    "slug": "food-delivery",
                    "icon": "🍕",
                    "shortName": "{\"en\":\"Food Delivery\",\"mk\":\"Достава на Храна\",\"sq\":\"Dorëzim Ushqimi\",\"tr\":\"Yemek Siparişi\"}",
                    "seoMeta": "{\n  \"en\": {\n    \"title\": \"Food Delivery - Pizza, Burgers, Sushi & More | FastlyGo\",\n    \"subtitle\": \"Order from your favorite restaurants in Skopje\",\n    \"description\": \"Fast food delivery in Skopje. Pizza, burgers, sushi, kebabs, desserts and more from top restaurants. Order now and get delivery in 15 minutes!\",\n    \"keywords\": \"food delivery skopje, restaurant delivery, pizza delivery, burger delivery, sushi delivery\"\n  },\n  \"tr\": {\n    \"title\": \"Yemek Teslimatı - Pizza, Burger, Suşi ve Daha Fazlası | FastlyGo\",\n    \"subtitle\": \"Üsküp'teki favori restoranlarınızdan sipariş verin\",\n    \"description\": \"Üsküp'te hızlı yemek teslimatı. Pizza, burger, suşi, kebap, tatlılar ve daha fazlası en iyi restoranlardan. Şimdi sipariş verin, 15 dakikada teslim alın!\",\n    \"keywords\": \"üsküp yemek teslimatı, restoran teslimatı, pizza teslimatı, burger teslimatı, suşi teslimatı\"\n  },\n  \"mk\": {\n    \"title\": \"Достава на храна - Пица, Бургери, Суши и повеќе | FastlyGo\",\n    \"subtitle\": \"Нарачајте од вашите омилени ресторани во Скопје\",\n    \"description\": \"Брза достава на храна во Скопје. Пица, бургери, суши, кебап, десерти и повеќе од врвни ресторани. Нарачајте сега и добијте достава за 15 минути!\",\n    \"keywords\": \"достава храна скопје, достава ресторан, достава пица, достава бургер, достава суши\"\n  },\n  \"sq\": {\n    \"title\": \"Shpërndarja e Ushqimit - Pizza, Burger, Sushi dhe më shumë | FastlyGo\",\n    \"subtitle\": \"Porosit nga restorantet e tua të preferuara në Shkup\",\n    \"description\": \"Shpërndarje e shpejtë e ushqimit në Shkup. Pizza, burger, sushi, qebap, ëmbëlsira dhe më shumë nga restorantet më të mira. Porosit tani dhe merr shpërndarjen për 15 minuta!\",\n    \"keywords\": \"shpërndarja ushqim shkup, shpërndarja restorant, shpërndarja pizza, shpërndarja burger, shpërndarja sushi\"\n  }\n}",
                    "active": true,
                    "displayOrder": 1,
                    "createdAt": "2025-12-13T16:26:39.000Z",
                    "updatedAt": "2026-01-06T22:10:19.000Z"
                },
                {
                    "id": 2,
                    "slug": "grocery-delivery",
                    "icon": "🛒",
                    "shortName": "{\"en\":\"Grocery Delivery\",\"mk\":\"Достава на Намирници\",\"sq\":\"Dorëzim Marketi\",\"tr\":\"Market Alışverişi\"}",
                    "seoMeta": "{\n  \"en\": {\n    \"title\": \"Grocery Delivery - Fresh Fruits, Vegetables & Essentials | FastlyGo\",\n    \"subtitle\": \"Fresh groceries delivered to your door in Skopje\",\n    \"description\": \"Order fresh fruits, vegetables, dairy products, bread and daily essentials. Fast grocery delivery in Skopje in 15 minutes!\",\n    \"keywords\": \"grocery delivery skopje, fresh produce delivery, supermarket delivery, online grocery shopping\"\n  },\n  \"tr\": {\n    \"title\": \"Market Teslimatı - Taze Meyve, Sebze ve Temel Gıdalar | FastlyGo\",\n    \"subtitle\": \"Üsküp'te taze market ürünleri kapınıza kadar\",\n    \"description\": \"Taze meyve, sebze, süt ürünleri, ekmek ve günlük ihtiyaçlarınızı sipariş edin. Üsküp'te hızlı market teslimatı 15 dakikada!\",\n    \"keywords\": \"üsküp market teslimatı, taze ürün teslimatı, süpermarket teslimatı, online market alışverişi\"\n  },\n  \"mk\": {\n    \"title\": \"Достава на намирници - Свежо овошје, зеленчук и основни продукти | FastlyGo\",\n    \"subtitle\": \"Свежи намирници доставени до вашата врата во Скопје\",\n    \"description\": \"Нарачајте свежо овошје, зеленчук, млечни производи, леб и секојдневни потреби. Брза достава на намирници во Скопје за 15 минути!\",\n    \"keywords\": \"достава намирници скопје, достава свежи производи, достава супермаркет, онлајн купување намирници\"\n  },\n  \"sq\": {\n    \"title\": \"Shpërndarja e Ushqimeve - Fruta të Freskëta, Perime dhe Produkte Themelore | FastlyGo\",\n    \"subtitle\": \"Ushqime të freskëta të dërguara në derën tuaj në Shkup\",\n    \"description\": \"Porosit fruta të freskëta, perime, produkte qumështi, bukë dhe nevojat e përditshme. Shpërndarje e shpejtë e ushqimeve në Shkup për 15 minuta!\",\n    \"keywords\": \"shpërndarja ushqime shkup, shpërndarja produkte të freskëta, shpërndarja supermarket, blerje online ushqime\"\n  }\n}",
                    "active": true,
                    "displayOrder": 2,
                    "createdAt": "2025-12-13T16:26:39.000Z",
                    "updatedAt": "2026-01-06T22:10:19.000Z"
                },
                {
                    "id": 3,
                    "slug": "pharmacy-delivery",
                    "icon": "💊",
                    "shortName": "{\"en\":\"Pharmacy Delivery\",\"mk\":\"Достава од Аптека\",\"sq\":\"Dorëzim Farmaci\",\"tr\":\"Eczane Teslimatı\"}",
                    "seoMeta": "{\n  \"en\": {\n    \"title\": \"Pharmacy Delivery - Medicines, Vitamins & Health Products | FastlyGo\",\n    \"subtitle\": \"Medicines and health products delivered fast in Skopje\",\n    \"description\": \"Order prescription medicines, vitamins, supplements, baby care products and health essentials. Fast pharmacy delivery in Skopje!\",\n    \"keywords\": \"pharmacy delivery skopje, medicine delivery, prescription delivery, health products delivery\"\n  },\n  \"tr\": {\n    \"title\": \"Eczane Teslimatı - İlaçlar, Vitaminler ve Sağlık Ürünleri | FastlyGo\",\n    \"subtitle\": \"Üsküp'te ilaçlar ve sağlık ürünleri hızlı teslimat\",\n    \"description\": \"Reçeteli ilaçlar, vitaminler, takviyeler, bebek bakım ürünleri ve sağlık ürünlerini sipariş edin. Üsküp'te hızlı eczane teslimatı!\",\n    \"keywords\": \"üsküp eczane teslimatı, ilaç teslimatı, reçete teslimatı, sağlık ürünleri teslimatı\"\n  },\n  \"mk\": {\n    \"title\": \"Достава од аптека - Лекови, витамини и здравствени производи | FastlyGo\",\n    \"subtitle\": \"Лекови и здравствени производи брзо доставени во Скопје\",\n    \"description\": \"Нарачајте лекови на рецепт, витамини, додатоци, производи за нега на бебиња и здравствени потреби. Брза достава од аптека во Скопје!\",\n    \"keywords\": \"достава аптека скопје, достава лекови, достава рецепт, достава здравствени производи\"\n  },\n  \"sq\": {\n    \"title\": \"Shpërndarja nga Farmacia - Ilaçe, Vitamina dhe Produkte Shëndetësore | FastlyGo\",\n    \"subtitle\": \"Ilaçe dhe produkte shëndetësore të dërguara shpejt në Shkup\",\n    \"description\": \"Porosit ilaçe me recetë, vitamina, shtesa, produkte për kujdesin e fëmijëve dhe nevoja shëndetësore. Shpërndarje e shpejtë nga farmacia në Shkup!\",\n    \"keywords\": \"shpërndarja farmaci shkup, shpërndarja ilaçe, shpërndarja recetë, shpërndarja produkte shëndetësore\"\n  }\n}",
                    "active": true,
                    "displayOrder": 3,
                    "createdAt": "2025-12-13T16:26:39.000Z",
                    "updatedAt": "2026-01-06T22:10:19.000Z"
                },
                {
                    "id": 4,
                    "slug": "flower-delivery",
                    "icon": "🌺",
                    "shortName": "{\"en\":\"Flower Delivery\",\"mk\":\"Достава на Цвеќиња\",\"sq\":\"Dorëzim Lulesh\",\"tr\":\"Çiçek Teslimatı\"}",
                    "seoMeta": "{\n  \"en\": {\n    \"title\": \"Flower Delivery - Roses, Bouquets & Arrangements | FastlyGo\",\n    \"subtitle\": \"Fresh flowers delivered in Skopje\",\n    \"description\": \"Order fresh roses, tulips, orchids and beautiful flower arrangements. Same-day flower delivery in Skopje for all occasions!\",\n    \"keywords\": \"flower delivery skopje, rose delivery, bouquet delivery, fresh flowers, flower arrangements\"\n  },\n  \"tr\": {\n    \"title\": \"Çiçek Teslimatı - Güller, Buketler ve Aranjmanlar | FastlyGo\",\n    \"subtitle\": \"Üsküp'te taze çiçek teslimatı\",\n    \"description\": \"Taze güller, laleler, orkideler ve güzel çiçek aranjmanları sipariş edin. Üsküp'te tüm özel günler için aynı gün çiçek teslimatı!\",\n    \"keywords\": \"üsküp çiçek teslimatı, gül teslimatı, buket teslimatı, taze çiçekler, çiçek aranjmanları\"\n  },\n  \"mk\": {\n    \"title\": \"Достава на цвеќиња - Рози, букети и аранжмани | FastlyGo\",\n    \"subtitle\": \"Свежи цвеќиња доставени во Скопје\",\n    \"description\": \"Нарачајте свежи рози, лалиња, орхидеи и убави цветни аранжмани. Достава на цвеќиња истиот ден во Скопје за сите прилики!\",\n    \"keywords\": \"достава цвеќиња скопје, достава рози, достава букети, свежи цвеќиња, цветни аранжмани\"\n  },\n  \"sq\": {\n    \"title\": \"Shpërndarja e Luleve - Trëndafila, Buketa dhe Aranzhime | FastlyGo\",\n    \"subtitle\": \"Lule të freskëta të dërguara në Shkup\",\n    \"description\": \"Porosit trëndafila të freskët, tulipanë, orkide dhe aranzhime të bukura me lule. Shpërndarje e luleve në të njëjtën ditë në Shkup për të gjitha rastet!\",\n    \"keywords\": \"shpërndarja luleve shkup, shpërndarja trëndafilave, shpërndarja buketave, lule të freskëta, aranzhime me lule\"\n  }\n}",
                    "active": true,
                    "displayOrder": 4,
                    "createdAt": "2025-12-13T16:26:39.000Z",
                    "updatedAt": "2026-01-06T22:10:19.000Z"
                },
                {
                    "id": 5,
                    "slug": "cargo-package-delivery",
                    "icon": "📦",
                    "shortName": "{\"en\":\"Cargo & Packages\",\"mk\":\"Карго и Пакети\",\"sq\":\"Kargo dhe Paketa\",\"tr\":\"Kargo ve Paketler\"}",
                    "seoMeta": "{\"en\":{\"title\":\"Cargo & Package Delivery - Documents, Parcels & Cargo | FastlyGo\",\"subtitle\":\"Fast and secure cargo & package delivery in Skopje\",\"description\":\"Send packages, documents, parcels and cargo anywhere in Skopje. Professional courier service with real-time tracking!\",\"keywords\":\"cargo delivery skopje, package delivery skopje, parcel delivery, document delivery, courier service\"},\"tr\":{\"title\":\"Kargo ve Paket Teslimatı - Evraklar, Kargolar ve Paketler | FastlyGo\",\"subtitle\":\"Üsküp'te hızlı ve güvenli kargo ve paket teslimatı\",\"keywords\":\"üsküp kargo teslimatı, üsküp paket teslimatı, evrak teslimatı, kurye hizmeti\"},\"mk\":{\"title\":\"Достава на товар и пакети - Документи, пратки и товар | FastlyGo\",\"subtitle\":\"Брза и сигурна достава на товар и пакети во Скопје\",\"description\":\"Испратете пакети, документи, пратки и товар насекаде во Скопје. Професионална курирска услуга со следење во реално време!\",\"keywords\":\"достава товар скопје, достава пакети скопје, достава пратки, достава документи, курирска услуга\"},\"sq\":{\"title\":\"Shpërndarja e Ngarkesave dhe Paketave - Dokumente, Dërgesa dhe Ngarkesa | FastlyGo\",\"subtitle\":\"Shpërndarje e shpejtë dhe e sigurt e ngarkesave dhe paketave në Shkup\",\"description\":\"Dërgo paketa, dokumente, dërgesa dhe ngarkesa kudo në Shkup. Shërbim profesional i korierit me ndjekje në kohë reale!\",\"keywords\":\"shpërndarja ngarkesa shkup, shpërndarja paketa shkup, shpërndarja dërgesa, shpërndarja dokumente, shërbim korieri\"}}",
                    "active": true,
                    "displayOrder": 5,
                    "createdAt": "2025-12-13T16:26:39.000Z",
                    "updatedAt": "2026-01-06T22:11:04.000Z"
                }
            ]
        }
    },
    {
        "category": "Categories",
        "method": "GET",
        "path": "categories.getBySlug",
        "description": "Slug'a göre kategori getirir",
        "auth": false,
        "input": "{'slug': 'food-delivery'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Areas",
        "method": "GET",
        "path": "areas.list",
        "description": "Tüm teslimat alanlarını listeler",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": [
                {
                    "id": 30001,
                    "slug": "skopje",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Delivery Services in Skopje\",\"subtitle\":\"Fast and reliable delivery\",\"description\":\"Professional courier and delivery services in Skopje, Macedonia. Same-day delivery available.\",\"keywords\":\"courier, delivery, Skopje, fast delivery, same-day\"},\"tr\":{\"title\":\"Üsküp'te Kurye ve Teslimat Hizmetleri\",\"subtitle\":\"Hızlı ve güvenilir teslimat\",\"description\":\"Üsküp, Makedonya'da profesyonel kurye ve teslimat hizmetleri. Aynı gün teslimat mevcuttur.\",\"keywords\":\"kurye, teslimat, Üsküp, hızlı teslimat, aynı gün\"},\"mk\":{\"title\":\"Услуги на достава во Скопје\",\"subtitle\":\"Брза и сигурна достава\",\"description\":\"Професионални услуги на курир и достава во Скопје, Македонија. Достава во исти ден.\",\"keywords\":\"курир, достава, Скопје, брза достава, исти ден\"},\"sq\":{\"title\":\"Shërbime të Kurerit në Shkup\",\"subtitle\":\"Dërgim i shpejtë dhe i sigurt\",\"description\":\"Shërbime profesionale të kurerit dhe dërgimit në Shkup, Maqedoni. Dërgim në të njëjtën ditë.\",\"keywords\":\"kurier, dërgim, Shkup, dërgim i shpejtë, e njëjta ditë\"}}",
                    "active": true,
                    "displayOrder": 1,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 1,
                    "slug": "aerodrom",
                    "seoMeta": "{\"en\": {\"title\": \"Aerodrom Delivery\", \"subtitle\": \"Fast delivery in Aerodrom municipality. Modern residential areas, shopping centers, and business districts served efficiently.\", \"description\": \"Premium delivery service in Aerodrom, Skopje's modern district. Quick access to malls, offices, and residential complexes.\", \"keywords\": \"aerodrom delivery, aerodrom skopje, modern district delivery, shopping center delivery\"}, \"tr\": {\"title\": \"Aerodrom Teslimat\", \"subtitle\": \"Aerodrom belediyesinde hızlı teslimat. Modern konut alanları, alışveriş merkezleri ve iş bölgeleri verimli bir şekilde hizmet vermektedir.\", \"description\": \"Üsküp'ün modern bölgesi Aerodrom'da premium teslimat hizmeti. AVM'lere, ofislere ve konut komplekslerine hızlı erişim.\", \"keywords\": \"aerodrom teslimat, aerodrom üsküp, modern bölge teslimatı, alışveriş merkezi teslimatı\"}, \"mk\": {\"title\": \"Достава во Аеродром\", \"subtitle\": \"Брза достава во општина Аеродром. Модерни станбени подрачја, трговски центри и деловни четврти ефикасно опслужени.\", \"description\": \"Премиум услуга за достава во Аеродром, модерната општина на Скопје. Брз пристап до молови, канцеларии и станбени комплекси.\", \"keywords\": \"достава во аеродром, аеродром скопје, достава во модерна општина, достава во трговски центар\"}, \"sq\": {\"title\": \"Dorëzim në Aerodrom\", \"subtitle\": \"Dorëzim i shpejtë në komunën e Aerodromit. Zonat moderne rezidenciale, qendrat tregtare dhe rajonet e biznesit shërbehen në mënyrë efikase.\", \"description\": \"Shërbim premium dorëzimi në Aerodrom, komuna moderne e Shkupit. Qasje e shpejtë në qendra tregtare, zyra dhe komplekse rezidenciale.\", \"keywords\": \"dorëzim në aerodrom, aerodrom shkup, dorëzim në rajon modern, dorëzim në qendër tregtare\"}}",
                    "active": true,
                    "displayOrder": 1,
                    "createdAt": "2025-12-13T16:26:39.000Z",
                    "updatedAt": "2026-01-06T21:10:56.000Z"
                },
                {
                    "id": 3,
                    "slug": "centar",
                    "seoMeta": "{\"en\": {\"title\": \"Centar Delivery\", \"subtitle\": \"Fast delivery in Skopje city center. Restaurants, shops, pharmacies, and businesses in the heart of the city delivered in minutes.\", \"description\": \"Quick delivery service in Centar, the bustling heart of Skopje. Access to hundreds of restaurants, shops, and services.\", \"keywords\": \"centar delivery, skopje center, city center delivery, downtown skopje\"}, \"tr\": {\"title\": \"Centar Teslimat\", \"subtitle\": \"Üsküp şehir merkezinde hızlı teslimat. Şehrin kalbindeki restoranlar, mağazalar, eczaneler ve işletmeler dakikalar içinde teslim.\", \"description\": \"Üsküp'ün hareketli kalbi Centar'da hızlı teslimat hizmeti. Yüzlerce restoran, mağaza ve hizmete erişim.\", \"keywords\": \"centar teslimat, üsküp merkez, şehir merkezi teslimat, downtown üsküp\"}, \"mk\": {\"title\": \"Достава во Центар\", \"subtitle\": \"Брза достава во центарот на Скопје. Ресторани, продавници, аптеки и бизниси во срцето на градот доставени за неколку минути.\", \"description\": \"Брза услуга за достава во Центар, врвното срце на Скопје. Пристап до стотици ресторани, продавници и услуги.\", \"keywords\": \"достава во центар, центар на скопје, достава во центар на градот, downtown скопје\"}, \"sq\": {\"title\": \"Dorëzim në Centar\", \"subtitle\": \"Dorëzim i shpejtë në qendrën e qytetit të Shkupit. Restorantet, dyqanet, farmacitë dhe bizneset në zemër të qytetit të dërguara për minuta.\", \"description\": \"Shërbim i shpejtë dorëzimi në Centar, zemra e gjallë e Shkupit. Qasje në qindra restorante, dyqane dhe shërbime.\", \"keywords\": \"dorëzim në centar, qendra e shkupit, dorëzim në qendër të qytetit, downtown shkup\"}}",
                    "active": true,
                    "displayOrder": 2,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T21:10:56.000Z"
                },
                {
                    "id": 30002,
                    "slug": "tetovo",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Tetovo\",\"subtitle\":\"Reliable delivery to Tetovo\",\"description\":\"Fast courier and delivery services in Tetovo, Macedonia.\",\"keywords\":\"courier, delivery, Tetovo, Macedonia\"},\"tr\":{\"title\":\"Tetova'da Kurye Hizmetleri\",\"subtitle\":\"Tetova'ya güvenilir teslimat\",\"description\":\"Tetova, Makedonya'da hızlı kurye ve teslimat hizmetleri.\",\"keywords\":\"kurye, teslimat, Tetova, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Тетово\",\"subtitle\":\"Сигурна достава до Тетово\",\"description\":\"Брза услуга на курир и достава во Тетово, Македонија.\",\"keywords\":\"курир, достава, Тетово, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Tetovë\",\"subtitle\":\"Dërgim i besueshëm në Tetovë\",\"description\":\"Shërbime të shpejta të kurerit dhe dërgimit në Tetovë, Maqedoni.\",\"keywords\":\"kurier, dërgim, Tetovë, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 2,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 4,
                    "slug": "karpos",
                    "seoMeta": "{\"en\": {\"title\": \"Karpos Delivery\", \"subtitle\": \"Reliable delivery in Karpos district. Residential and commercial areas covered with fast service to homes and businesses.\", \"description\": \"Efficient delivery service in Karpos, one of Skopje's largest districts. Serving residential neighborhoods and commercial zones.\", \"keywords\": \"karpos delivery, karpos skopje, residential delivery, karpos district\"}, \"tr\": {\"title\": \"Karpos Teslimat\", \"subtitle\": \"Karpos bölgesinde güvenilir teslimat. Konut ve ticari alanlar evlere ve işletmelere hızlı hizmetle kapsanmaktadır.\", \"description\": \"Üsküp'ün en büyük bölgelerinden biri olan Karpos'ta verimli teslimat hizmeti. Konut mahallelerine ve ticari bölgelere hizmet.\", \"keywords\": \"karpos teslimat, karpos üsküp, konut teslimatı, karpos bölgesi\"}, \"mk\": {\"title\": \"Достава во Карпош\", \"subtitle\": \"Сигурна достава во општината Карпош. Станбени и комерцијални подрачја покриени со брза услуга до домови и бизниси.\", \"description\": \"Ефикасна услуга за достава во Карпош, една од најголемите општини во Скопје. Опслужување на станбени населби и комерцијални зони.\", \"keywords\": \"достава во карпош, карпош скопје, станбена достава, општина карпош\"}, \"sq\": {\"title\": \"Dorëzim në Karpos\", \"subtitle\": \"Dorëzim i besueshëm në komunën e Karposit. Zonat rezidenciale dhe komerciale të mbuluara me shërbim të shpejtë në shtëpi dhe biznese.\", \"description\": \"Shërbim efikas dorëzimi në Karpos, një nga komunat më të mëdha të Shkupit. Shërbim për lagjet rezidenciale dhe zonat komerciale.\", \"keywords\": \"dorëzim në karpos, karpos shkup, dorëzim rezidencial, komuna e karposit\"}}",
                    "active": true,
                    "displayOrder": 3,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T21:10:56.000Z"
                },
                {
                    "id": 30003,
                    "slug": "bitola",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Bitola\",\"subtitle\":\"Express delivery to Bitola\",\"description\":\"Professional courier services in Bitola, Macedonia.\",\"keywords\":\"courier, delivery, Bitola, Macedonia\"},\"tr\":{\"title\":\"Bitola'da Kurye Hizmetleri\",\"subtitle\":\"Bitola'ya ekspres teslimat\",\"description\":\"Bitola, Makedonya'da profesyonel kurye hizmetleri.\",\"keywords\":\"kurye, teslimat, Bitola, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Битола\",\"subtitle\":\"Експресна достава до Битола\",\"description\":\"Професионални услуги на курир во Битола, Македонија.\",\"keywords\":\"курир, достава, Битола, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Bitola\",\"subtitle\":\"Dërgim ekspres në Bitola\",\"description\":\"Shërbime profesionale të kurerit në Bitola, Maqedoni.\",\"keywords\":\"kurier, dërgim, Bitola, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 3,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 5,
                    "slug": "kisela-voda",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Service in Kisela Voda, Skopje | FastlyGo\",\"description\":\"Professional courier and delivery service in Kisela Voda neighborhood, Skopje. Food, groceries, pharmacy, documents - fast delivery in 15 minutes.\",\"keywords\":\"skopje courier, courier kisela voda, delivery kisela voda, kisela voda delivery service, fast courier skopje\"},\"tr\":{\"title\":\"Kisela Voda Kurye Hizmeti, Skopje | FastlyGo\",\"description\":\"Skopje Kisela Voda bölgesinde profesyonel kurye ve teslimat hizmeti. Yemek, market, eczane, evrak - 15 dakikada hızlı teslimat.\",\"keywords\":\"skopje kurye, skopje kurier, kisela voda kurye, kisela voda teslimat, kisela voda kurye hizmeti\"},\"mk\":{\"title\":\"Куриерска услуга во Кисела Вода, Скопје | FastlyGo\",\"description\":\"Професионална куриерска и услуга за достава во населба Кисела Вода, Скопје. Храна, намирници, аптека, документи - брза достава за 15 минути.\",\"keywords\":\"скопје куриер, куриер кисела вода, достава кисела вода, куриерска услуга кисела вода\"},\"sq\":{\"title\":\"Shërbim Kurieri në Kisela Voda, Shkup | FastlyGo\",\"description\":\"Shërbim profesional kurieri dhe dorëzimi në lagjen Kisela Voda, Shkup. Ushqim, ushqime, farmaci, dokumente - dorëzim i shpejtë për 15 minuta.\",\"keywords\":\"shkup kurier, kurier kisela voda, dorëzim kisela voda, shërbim kurieri kisela voda\"}}",
                    "active": true,
                    "displayOrder": 4,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T11:19:10.000Z"
                },
                {
                    "id": 30004,
                    "slug": "kumanovo",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Kumanovo\",\"subtitle\":\"Reliable delivery to Kumanovo\",\"description\":\"Fast courier and delivery services in Kumanovo, Macedonia.\",\"keywords\":\"courier, delivery, Kumanovo, Macedonia\"},\"tr\":{\"title\":\"Kumanova'da Kurye Hizmetleri\",\"subtitle\":\"Kumanova'ya güvenilir teslimat\",\"description\":\"Kumanova, Makedonya'da hızlı kurye ve teslimat hizmetleri.\",\"keywords\":\"kurye, teslimat, Kumanova, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Куманово\",\"subtitle\":\"Сигурна достава до Куманово\",\"description\":\"Брза услуга на курир и достава во Куманово, Македонија.\",\"keywords\":\"курир, достава, Куманово, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Kumanovo\",\"subtitle\":\"Dërgim i besueshëm në Kumanovo\",\"description\":\"Shërbime të shpejta të kurerit dhe dërgimit në Kumanovo, Maqedoni.\",\"keywords\":\"kurier, dërgim, Kumanovo, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 4,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 6,
                    "slug": "cair",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Service in Čair, Skopje | FastlyGo\",\"description\":\"Professional courier and delivery service in Čair neighborhood, Skopje. Food, groceries, pharmacy, documents - fast delivery in 15 minutes.\",\"keywords\":\"skopje courier, courier čair, delivery čair, čair delivery service, fast courier skopje\"},\"tr\":{\"title\":\"Čair Kurye Hizmeti, Skopje | FastlyGo\",\"description\":\"Skopje Čair bölgesinde profesyonel kurye ve teslimat hizmeti. Yemek, market, eczane, evrak - 15 dakikada hızlı teslimat.\",\"keywords\":\"skopje kurye, skopje kurier, čair kurye, čair teslimat, čair kurye hizmeti\"},\"mk\":{\"title\":\"Куриерска услуга во Чаир, Скопје | FastlyGo\",\"description\":\"Професионална куриерска и услуга за достава во населба Чаир, Скопје. Храна, намирници, аптека, документи - брза достава за 15 минути.\",\"keywords\":\"скопје куриер, куриер чаир, достава чаир, куриерска услуга чаир\"},\"sq\":{\"title\":\"Shërbim Kurieri në Čair, Shkup | FastlyGo\",\"description\":\"Shërbim profesional kurieri dhe dorëzimi në lagjen Čair, Shkup. Ushqim, ushqime, farmaci, dokumente - dorëzim i shpejtë për 15 minuta.\",\"keywords\":\"shkup kurier, kurier čair, dorëzim čair, shërbim kurieri čair\"}}",
                    "active": true,
                    "displayOrder": 5,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T11:19:10.000Z"
                },
                {
                    "id": 30005,
                    "slug": "istip",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Istip\",\"subtitle\":\"Express delivery to Istip\",\"description\":\"Professional courier services in Istip, Macedonia.\",\"keywords\":\"courier, delivery, Istip, Macedonia\"},\"tr\":{\"title\":\"İştip'te Kurye Hizmetleri\",\"subtitle\":\"İştip'e ekspres teslimat\",\"description\":\"İştip, Makedonya'da profesyonel kurye hizmetleri.\",\"keywords\":\"kurye, teslimat, İştip, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Иштип\",\"subtitle\":\"Експресна достава до Иштип\",\"description\":\"Професионални услуги на курир во Иштип, Македонија.\",\"keywords\":\"курир, достава, Иштип, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Ishtip\",\"subtitle\":\"Dërgim ekspres në Ishtip\",\"description\":\"Shërbime profesionale të kurerit në Ishtip, Maqedoni.\",\"keywords\":\"kurier, dërgim, Ishtip, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 5,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 7,
                    "slug": "gazi-baba",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Service in Gazi Baba, Skopje | FastlyGo\",\"description\":\"Professional courier and delivery service in Gazi Baba neighborhood, Skopje. Food, groceries, pharmacy, documents - fast delivery in 15 minutes.\",\"keywords\":\"skopje courier, courier gazi baba, delivery gazi baba, gazi baba delivery service, fast courier skopje\"},\"tr\":{\"title\":\"Gazi Baba Kurye Hizmeti, Skopje | FastlyGo\",\"description\":\"Skopje Gazi Baba bölgesinde profesyonel kurye ve teslimat hizmeti. Yemek, market, eczane, evrak - 15 dakikada hızlı teslimat.\",\"keywords\":\"skopje kurye, skopje kurier, gazi baba kurye, gazi baba teslimat, gazi baba kurye hizmeti\"},\"mk\":{\"title\":\"Куриерска услуга во Гази Баба, Скопје | FastlyGo\",\"description\":\"Професионална куриерска и услуга за достава во населба Гази Баба, Скопје. Храна, намирници, аптека, документи - брза достава за 15 минути.\",\"keywords\":\"скопје куриер, куриер гази баба, достава гази баба, куриерска услуга гази баба\"},\"sq\":{\"title\":\"Shërbim Kurieri në Gazi Baba, Shkup | FastlyGo\",\"description\":\"Shërbim profesional kurieri dhe dorëzimi në lagjen Gazi Baba, Shkup. Ushqim, ushqime, farmaci, dokumente - dorëzim i shpejtë për 15 minuta.\",\"keywords\":\"shkup kurier, kurier gazi baba, dorëzim gazi baba, shërbim kurieri gazi baba\"}}",
                    "active": true,
                    "displayOrder": 6,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T11:19:10.000Z"
                },
                {
                    "id": 30006,
                    "slug": "veles",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Veles\",\"subtitle\":\"Reliable delivery to Veles\",\"description\":\"Fast courier and delivery services in Veles, Macedonia.\",\"keywords\":\"courier, delivery, Veles, Macedonia\"},\"tr\":{\"title\":\"Veles'te Kurye Hizmetleri\",\"subtitle\":\"Veles'e güvenilir teslimat\",\"description\":\"Veles, Makedonya'da hızlı kurye ve teslimat hizmetleri.\",\"keywords\":\"kurye, teslimat, Veles, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Велес\",\"subtitle\":\"Сигурна достава до Велес\",\"description\":\"Брза услуга на курир и достава во Велес, Македонија.\",\"keywords\":\"курир, достава, Велес, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Veles\",\"subtitle\":\"Dërgim i besueshëm në Veles\",\"description\":\"Shërbime të shpejta të kurerit dhe dërgimit në Veles, Maqedoni.\",\"keywords\":\"kurier, dërgim, Veles, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 6,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 8,
                    "slug": "saraj",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Service in Saraj, Skopje | FastlyGo\",\"description\":\"Professional courier and delivery service in Saraj neighborhood, Skopje. Food, groceries, pharmacy, documents - fast delivery in 15 minutes.\",\"keywords\":\"skopje courier, courier saraj, delivery saraj, saraj delivery service, fast courier skopje\"},\"tr\":{\"title\":\"Saraj Kurye Hizmeti, Skopje | FastlyGo\",\"description\":\"Skopje Saraj bölgesinde profesyonel kurye ve teslimat hizmeti. Yemek, market, eczane, evrak - 15 dakikada hızlı teslimat.\",\"keywords\":\"skopje kurye, skopje kurier, saraj kurye, saraj teslimat, saraj kurye hizmeti\"},\"mk\":{\"title\":\"Куриерска услуга во Сарај, Скопје | FastlyGo\",\"description\":\"Професионална куриерска и услуга за достава во населба Сарај, Скопје. Храна, намирници, аптека, документи - брза достава за 15 минути.\",\"keywords\":\"скопје куриер, куриер сарај, достава сарај, куриерска услуга сарај\"},\"sq\":{\"title\":\"Shërbim Kurieri në Saraj, Shkup | FastlyGo\",\"description\":\"Shërbim profesional kurieri dhe dorëzimi në lagjen Saraj, Shkup. Ushqim, ushqime, farmaci, dokumente - dorëzim i shpejtë për 15 minuta.\",\"keywords\":\"shkup kurier, kurier saraj, dorëzim saraj, shërbim kurieri saraj\"}}",
                    "active": true,
                    "displayOrder": 7,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T11:19:10.000Z"
                },
                {
                    "id": 30007,
                    "slug": "prilep",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Prilep\",\"subtitle\":\"Express delivery to Prilep\",\"description\":\"Professional courier services in Prilep, Macedonia.\",\"keywords\":\"courier, delivery, Prilep, Macedonia\"},\"tr\":{\"title\":\"Prilepe'de Kurye Hizmetleri\",\"subtitle\":\"Prilepe'ye ekspres teslimat\",\"description\":\"Prilepe, Makedonya'da profesyonel kurye hizmetleri.\",\"keywords\":\"kurye, teslimat, Prilepe, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Прилеп\",\"subtitle\":\"Експресна достава до Прилеп\",\"description\":\"Професионални услуги на курир во Прилеп, Македонија.\",\"keywords\":\"курир, достава, Прилеп, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Prilepi\",\"subtitle\":\"Dërgim ekspres në Prilepi\",\"description\":\"Shërbime profesionale të kurerit në Prilepi, Maqedoni.\",\"keywords\":\"kurier, dërgim, Prilepi, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 7,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 9,
                    "slug": "butel",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Service in Butel, Skopje | FastlyGo\",\"description\":\"Professional courier and delivery service in Butel neighborhood, Skopje. Food, groceries, pharmacy, documents - fast delivery in 15 minutes.\",\"keywords\":\"skopje courier, courier butel, delivery butel, butel delivery service, fast courier skopje\"},\"tr\":{\"title\":\"Butel Kurye Hizmeti, Skopje | FastlyGo\",\"description\":\"Skopje Butel bölgesinde profesyonel kurye ve teslimat hizmeti. Yemek, market, eczane, evrak - 15 dakikada hızlı teslimat.\",\"keywords\":\"skopje kurye, skopje kurier, butel kurye, butel teslimat, butel kurye hizmeti\"},\"mk\":{\"title\":\"Куриерска услуга во Бутел, Скопје | FastlyGo\",\"description\":\"Професионална куриерска и услуга за достава во населба Бутел, Скопје. Храна, намирници, аптека, документи - брза достава за 15 минути.\",\"keywords\":\"скопје куриер, куриер бутел, достава бутел, куриерска услуга бутел\"},\"sq\":{\"title\":\"Shërbim Kurieri në Butel, Shkup | FastlyGo\",\"description\":\"Shërbim profesional kurieri dhe dorëzimi në lagjen Butel, Shkup. Ushqim, ushqime, farmaci, dokumente - dorëzim i shpejtë për 15 minuta.\",\"keywords\":\"shkup kurier, kurier butel, dorëzim butel, shërbim kurieri butel\"}}",
                    "active": true,
                    "displayOrder": 8,
                    "createdAt": "2025-12-13T21:41:43.000Z",
                    "updatedAt": "2026-01-06T11:19:10.000Z"
                },
                {
                    "id": 30008,
                    "slug": "kocani",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Kocani\",\"subtitle\":\"Reliable delivery to Kocani\",\"description\":\"Fast courier and delivery services in Kocani, Macedonia.\",\"keywords\":\"courier, delivery, Kocani, Macedonia\"},\"tr\":{\"title\":\"Koçani'de Kurye Hizmetleri\",\"subtitle\":\"Koçani'ye güvenilir teslimat\",\"description\":\"Koçani, Makedonya'da hızlı kurye ve teslimat hizmetleri.\",\"keywords\":\"kurye, teslimat, Koçani, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Кочани\",\"subtitle\":\"Сигурна достава до Кочани\",\"description\":\"Брза услуга на курир и достава во Кочани, Македонија.\",\"keywords\":\"курир, достава, Кочани, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Koçani\",\"subtitle\":\"Dërgim i besueshëm në Koçani\",\"description\":\"Shërbime të shpejta të kurerit dhe dërgimit në Koçani, Maqedoni.\",\"keywords\":\"kurier, dërgim, Koçani, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 8,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 30009,
                    "slug": "strumica",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Strumica\",\"subtitle\":\"Express delivery to Strumica\",\"description\":\"Professional courier services in Strumica, Macedonia.\",\"keywords\":\"courier, delivery, Strumica, Macedonia\"},\"tr\":{\"title\":\"Strumica'da Kurye Hizmetleri\",\"subtitle\":\"Strumica'ya ekspres teslimat\",\"description\":\"Strumica, Makedonya'da profesyonel kurye hizmetleri.\",\"keywords\":\"kurye, teslimat, Strumica, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Струмица\",\"subtitle\":\"Експресна достава до Струмица\",\"description\":\"Професионални услуги на курир во Струмица, Македонија.\",\"keywords\":\"курир, достава, Струмица, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Strumica\",\"subtitle\":\"Dërgim ekspres në Strumica\",\"description\":\"Shërbime profesionale të kurerit në Strumica, Maqedoni.\",\"keywords\":\"kurier, dërgim, Strumica, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 9,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 30010,
                    "slug": "gostivar",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Gostivar\",\"subtitle\":\"Reliable delivery to Gostivar\",\"description\":\"Fast courier and delivery services in Gostivar, Macedonia.\",\"keywords\":\"courier, delivery, Gostivar, Macedonia\"},\"tr\":{\"title\":\"Gostivar'da Kurye Hizmetleri\",\"subtitle\":\"Gostivar'a güvenilir teslimat\",\"description\":\"Gostivar, Makedonya'da hızlı kurye ve teslimat hizmetleri.\",\"keywords\":\"kurye, teslimat, Gostivar, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Гостивар\",\"subtitle\":\"Сигурна достава до Гостивар\",\"description\":\"Брза услуга на курир и достава во Гостивар, Македонија.\",\"keywords\":\"курир, достава, Гостивар, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Gostivar\",\"subtitle\":\"Dërgim i besueshëm në Gostivar\",\"description\":\"Shërbime të shpejta të kurerit dhe dërgimit në Gostivar, Maqedoni.\",\"keywords\":\"kurier, dërgim, Gostivar, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 10,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                },
                {
                    "id": 30011,
                    "slug": "ohrid",
                    "seoMeta": "{\"en\":{\"title\":\"Courier Services in Ohrid\",\"subtitle\":\"Express delivery to Ohrid\",\"description\":\"Professional courier services in Ohrid, Macedonia.\",\"keywords\":\"courier, delivery, Ohrid, Macedonia\"},\"tr\":{\"title\":\"Ohri'de Kurye Hizmetleri\",\"subtitle\":\"Ohri'ye ekspres teslimat\",\"description\":\"Ohri, Makedonya'da profesyonel kurye hizmetleri.\",\"keywords\":\"kurye, teslimat, Ohri, Makedonya\"},\"mk\":{\"title\":\"Услуги на курир во Охрид\",\"subtitle\":\"Експресна достава до Охрид\",\"description\":\"Професионални услуги на курир во Охрид, Македонија.\",\"keywords\":\"курир, достава, Охрид, Македонија\"},\"sq\":{\"title\":\"Shërbime Kurierie në Ohrid\",\"subtitle\":\"Dërgim ekspres në Ohrid\",\"description\":\"Shërbime profesionale të kurerit në Ohrid, Maqedoni.\",\"keywords\":\"kurier, dërgim, Ohrid, Maqedoni\"}}",
                    "active": true,
                    "displayOrder": 11,
                    "createdAt": "2026-01-07T17:44:15.000Z",
                    "updatedAt": "2026-01-07T17:44:15.000Z"
                }
            ]
        }
    },
    {
        "category": "Areas",
        "method": "GET",
        "path": "areas.getBySlug",
        "description": "Slug'a göre alan getirir",
        "auth": false,
        "input": "{'slug': 'skopje-center'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Pages",
        "method": "GET",
        "path": "pages.getBySlug",
        "description": "Sayfa içeriğini getirir",
        "auth": false,
        "input": "{'slug': 'home'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Orders",
        "method": "GET",
        "path": "orders.list",
        "description": "Kullanıcının tüm siparişlerini listeler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Orders",
        "method": "POST",
        "path": "orders.calculatePrice",
        "description": "Sipariş fiyatını hesaplar",
        "auth": false,
        "input": "{'distance': 5000, 'vehicleType': 'motorcycle', 'packageSize': 'medium', 'scenario': 'A'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Orders",
        "method": "POST",
        "path": "orders.offerPrice",
        "description": "Sipariş için fiyat teklifi verir",
        "auth": true,
        "input": "{'orderId': 1, 'offeredPrice': 500}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 404,
            "statusIcon": "❓",
            "statusText": "Başarısız (404)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Orders",
        "method": "POST",
        "path": "orders.increasePrice",
        "description": "Sipariş fiyatını artırır",
        "auth": true,
        "input": "{'orderId': 1, 'newPrice': 600}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 404,
            "statusIcon": "❓",
            "statusText": "Başarısız (404)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Orders",
        "method": "GET",
        "path": "orders.getAvailableOrders",
        "description": "Mevcut siparişleri listeler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 404,
            "statusIcon": "❓",
            "statusText": "Başarısız (404)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Orders",
        "method": "POST",
        "path": "orders.acceptOrder",
        "description": "Sipariş kabul eder",
        "auth": true,
        "input": "{'orderId': 1}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 404,
            "statusIcon": "❓",
            "statusText": "Başarısız (404)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "POST",
        "path": "courierV2.applyToCourier",
        "description": "Kurye başvurusu yapar",
        "auth": false,
        "input": "{'email': 'test@example.com', 'password': 'test123', 'name': 'Test Courier', 'phone': '+38970123456', 'vehicleType': 'motorcycle', 'vehiclePlate': 'SK-123-AB', 'identityNumber': '1234567890', 'identityType': 'id_card'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "GET",
        "path": "courierV2.getProfile",
        "description": "Kurye profilini getirir",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "POST",
        "path": "courierV2.updateProfile",
        "description": "Kurye profilini günceller",
        "auth": true,
        "input": "{'phone': '+38970123456', 'vehicleType': 'car'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "POST",
        "path": "courierV2.updateLocation",
        "description": "Kurye konumunu günceller",
        "auth": true,
        "input": "{'latitude': 42, 'longitude': 21.4}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "GET",
        "path": "courierV2.getAvailableOrders",
        "description": "Kurye için mevcut siparişleri listeler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "POST",
        "path": "courierV2.acceptOrder",
        "description": "Kurye sipariş kabul eder",
        "auth": true,
        "input": "{'orderId': 1}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Courier",
        "method": "GET",
        "path": "courierV2.getStats",
        "description": "Kurye istatistiklerini getirir",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Business",
        "method": "POST",
        "path": "business.register",
        "description": "İşletme kaydı yapar",
        "auth": false,
        "input": "{'email': 'business@example.com', 'password': 'test123', 'name': 'Test Business', 'businessName': 'Test Restaurant', 'businessType': 'restaurant', 'address': 'Test Address', 'phone': '+38970123456', 'taxNumber': '1234567890'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Business",
        "method": "GET",
        "path": "business.getStatus",
        "description": "İşletme durumunu getirir",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Business",
        "method": "GET",
        "path": "business.myOrders",
        "description": "İşletme siparişlerini listeler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Notifications",
        "method": "GET",
        "path": "notifications.list",
        "description": "Bildirimleri listeler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Notifications",
        "method": "GET",
        "path": "notifications.unreadCount",
        "description": "Okunmamış bildirim sayısı",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Notifications",
        "method": "POST",
        "path": "notifications.markAsRead",
        "description": "Bildirimi okundu olarak işaretle",
        "auth": true,
        "input": "{'notificationId': 1}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Coupons",
        "method": "POST",
        "path": "coupons.validate",
        "description": "Kupon kodunu doğrular",
        "auth": true,
        "input": "{'code': 'TEST123', 'orderTotal': 1000}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Addresses",
        "method": "GET",
        "path": "favoriteAddresses.list",
        "description": "Favori adresleri listeler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Addresses",
        "method": "POST",
        "path": "favoriteAddresses.create",
        "description": "Favori adres ekler",
        "auth": true,
        "input": "{'name': 'Home', 'address': 'Test Address', 'latitude': 42, 'longitude': 21.4}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Ratings",
        "method": "POST",
        "path": "ratings.create",
        "description": "Değerlendirme oluşturur",
        "auth": true,
        "input": "{'orderId': 1, 'courierId': 1, 'rating': 5, 'comment': 'Great service!'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Ratings",
        "method": "GET",
        "path": "ratings.getMyRatings",
        "description": "Kullanıcının değerlendirmelerini getirir",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "User",
        "method": "POST",
        "path": "user.updateProfile",
        "description": "Kullanıcı profilini günceller",
        "auth": true,
        "input": "{'name': 'Updated Name', 'phone': '+38970123456'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Images",
        "method": "POST",
        "path": "images.upload",
        "description": "Resim yükler",
        "auth": true,
        "input": "{'image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Push Notifications",
        "method": "POST",
        "path": "pushNotifications.registerToken",
        "description": "Push notification token kaydeder",
        "auth": true,
        "input": "{'token': 'test-token', 'platform': 'web'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Tracking",
        "method": "POST",
        "path": "locationTracking.recordLocation",
        "description": "Konum kaydeder",
        "auth": true,
        "input": "{'orderId': 1, 'latitude': 42, 'longitude': 21.4}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Tracking",
        "method": "GET",
        "path": "locationTracking.getCurrentLocation",
        "description": "Güncel konumu getirir",
        "auth": false,
        "input": "{'orderId': 1}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Referrals",
        "method": "GET",
        "path": "referrals.getMyCode",
        "description": "Referans kodunu getirir",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Referrals",
        "method": "POST",
        "path": "referrals.applyCode",
        "description": "Referans kodu uygular",
        "auth": true,
        "input": "{'code': 'TEST123'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Earnings",
        "method": "GET",
        "path": "earnings.stats",
        "description": "Kazanç istatistikleri",
        "auth": true,
        "input": "{'period': 'month'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Earnings",
        "method": "GET",
        "path": "earnings.list",
        "description": "Kazanç listesi",
        "auth": true,
        "input": "{'page': 1, 'limit': 10}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "GET",
        "path": "mobileApp.checkVersion",
        "description": "Uygulama versiyonunu kontrol eder",
        "auth": false,
        "input": "{'platform': 'android', 'version': '1.0.0'}",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 400,
            "statusIcon": "❌",
            "statusText": "Başarısız (400)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "GET",
        "path": "mobileApp.getConfig",
        "description": "Uygulama yapılandırmasını getirir",
        "auth": false,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": true,
            "status": 200,
            "statusIcon": "✅",
            "statusText": "Başarılı (200)",
            "errorDetail": "",
            "sampleResponse": {
                "features": {
                    "googleOAuth": true,
                    "appleOAuth": false,
                    "facebookOAuth": false,
                    "biometricAuth": true,
                    "offlineMode": true
                },
                "limits": {
                    "maxUploadSizeMB": 10,
                    "maxImagesPerOrder": 5
                },
                "pricing": {
                    "currency": "EUR",
                    "currencySymbol": "€"
                },
                "support": {
                    "email": "support@rtransfer.com",
                    "phone": "+1234567890"
                }
            }
        }
    },
    {
        "category": "Admin",
        "method": "GET",
        "path": "admin.getDashboardStats",
        "description": "Admin dashboard istatistikleri",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Admin",
        "method": "GET",
        "path": "admin.allOrders",
        "description": "Tüm siparişler",
        "auth": true,
        "input": "Yok",
        "output": "Bkz. Test Sonuçları",
        "testResult": {
            "tested": true,
            "success": false,
            "status": 401,
            "statusIcon": "🔒",
            "statusText": "Başarısız (401)",
            "errorDetail": "Bilinmeyen hata",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "POST",
        "path": "auth.register",
        "description": "Yeni kullanıcı kaydı (email, password, name, role)",
        "auth": false,
        "input": "{\"email\": \"user@example.com\", \"password\": \"password123\", \"name\": \"Ahmet Yılmaz\", \"role\": \"user\"}",
        "output": "{\"success\": true, \"userId\": 123, \"token\": \"...\", \"message\": \"Kayıt başarılı!\"}",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "POST",
        "path": "auth.login",
        "description": "Email ve şifre ile giriş",
        "auth": false,
        "input": "{\"email\": \"user@example.com\", \"password\": \"password123\"}",
        "output": "{\"success\": true, \"userId\": 123, \"role\": \"user\", \"token\": \"...\"}",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "POST",
        "path": "auth.googleLogin",
        "description": "Google OAuth ile giriş (idToken gerekli)",
        "auth": false,
        "input": "{\"email\": \"user@gmail.com\", \"name\": \"Ahmet Yılmaz\", \"googleId\": \"...\"}",
        "output": "{\"success\": true, \"userId\": 123, \"token\": \"...\"}",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "GET",
        "path": "orders.getById",
        "description": "Sipariş detayını al (ID ile) - Kurye bilgileri dahil",
        "auth": true,
        "input": "{\"id\": 123}",
        "output": "Sipariş detayları + kurye bilgileri (name, phone, rating, location)",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "GET",
        "path": "orders.myOrders",
        "description": "Kullanıcının tüm siparişlerini listele",
        "auth": true,
        "input": "Yok",
        "output": "Sipariş listesi (array)",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "GET",
        "path": "orders.getByOrderNumber",
        "description": "Sipariş numarası ile takip et (Public - Auth gerekmez)",
        "auth": false,
        "input": "{\"orderNumber\": \"RT-123ABC\"}",
        "output": "Sipariş detayları + kurye konumu",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    },
    {
        "category": "Mobile",
        "method": "POST",
        "path": "pricing.calculate",
        "description": "Fiyat hesaplama (pickup, delivery koordinatları gerekli)",
        "auth": false,
        "input": "{\"pickupLat\": 41.9973, \"pickupLng\": 21.4280, \"deliveryLat\": 41.9981, \"deliveryLng\": 21.4254, \"vehicleType\": \"any\", \"packageSize\": \"medium\", \"priority\": \"normal\"}",
        "output": "{\"baseFee\": 100, \"distanceFee\": 20, \"totalFee\": 308} (EUR cents)",
        "testResult": {
            "tested": false,
            "success": false,
            "status": 0,
            "statusIcon": "📱",
            "statusText": "Mobil API",
            "errorDetail": "",
            "sampleResponse": null
        }
    }
];

  const categories = ["all", ...Array.from(new Set(endpoints.map((e: any) => e.category)))];
  const categoryCount = (cat: string) => endpoints.filter((e: any) => e.category === cat).length;
  const filteredEndpoints = selectedCategory === "all" 
    ? endpoints 
    : endpoints.filter((e: any) => e.category === selectedCategory);

  const dataModels = [
    {
      name: "User",
      description: "Platform kullanıcıları",
      fields: [
        { name: "id", type: "number", description: "Benzersiz kullanıcı ID" },
        { name: "name", type: "string", description: "Kullanıcı adı" },
        { name: "email", type: "string", description: "E-posta adresi" },
        { name: "phone", type: "string", description: "Telefon numarası" },
        { name: "role", type: "enum", description: "Kullanıcı rolü (admin, user, courier, business)" },
        { name: "createdAt", type: "timestamp", description: "Hesap oluşturulma tarihi" },
        { name: "lastSignedIn", type: "timestamp", description: "Son giriş tarihi" },
      ],
    },
    {
      name: "Courier",
      description: "Kurye bilgileri",
      fields: [
        { name: "id", type: "number", description: "Benzersiz kurye ID" },
        { name: "userId", type: "number", description: "İlişkili kullanıcı ID" },
        { name: "phone", type: "string", description: "Telefon numarası" },
        { name: "vehicleType", type: "string", description: "Araç tipi (motorcycle, bicycle, car)" },
        { name: "vehiclePlate", type: "string", description: "Plaka numarası" },
        { name: "status", type: "enum", description: "Durum (pending, approved, rejected)" },
        { name: "isAvailable", type: "boolean", description: "Müsaitlik durumu" },
        { name: "currentLatitude", type: "string", description: "Güncel enlem" },
        { name: "currentLongitude", type: "string", description: "Güncel boylam" },
        { name: "rating", type: "number", description: "Ortalama değerlendirme" },
        { name: "totalDeliveries", type: "number", description: "Toplam teslimat sayısı" },
      ],
    },
    {
      name: "Order",
      description: "Sipariş bilgileri",
      fields: [
        { name: "id", type: "number", description: "Benzersiz sipariş ID" },
        { name: "orderNumber", type: "string", description: "Sipariş numarası (RT-XXX)" },
        { name: "customerId", type: "number", description: "Müşteri kullanıcı ID" },
        { name: "courierId", type: "number", description: "Atanan kurye ID" },
        { name: "restaurantId", type: "number", description: "İşletme ID (varsa)" },
        { name: "pickupAddress", type: "string", description: "Alış adresi" },
        { name: "deliveryAddress", type: "string", description: "Teslimat adresi" },
        { name: "status", type: "enum", description: "Durum (pending, accepted, picked_up, in_transit, delivered, cancelled)" },
        { name: "totalFee", type: "number", description: "Toplam ücret (kuruş)" },
        { name: "distance", type: "number", description: "Mesafe (metre)" },
        { name: "createdAt", type: "timestamp", description: "Oluşturulma tarihi" },
        { name: "deliveredAt", type: "timestamp", description: "Teslim tarihi" },
      ],
    },
  ];

  // Calculate statistics
  const totalEndpoints = endpoints.length;
  const successfulEndpoints = endpoints.filter((e: any) => e.testResult.success).length;
  const authRequiredEndpoints = endpoints.filter((e: any) => e.testResult.status === 401).length;
  const failedEndpoints = endpoints.filter((e: any) => !e.testResult.success && e.testResult.status !== 401).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <Code className="inline-block mr-3 h-10 w-10 text-orange-600" />
              FastlyGo API Dokümantasyonu
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              tRPC tabanlı type-safe API endpoint'leri ve veri modelleri
            </p>
            
            {/* Test Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-gray-900">{totalEndpoints}</div>
                  <div className="text-sm text-gray-600">Toplam Endpoint</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-600">{successfulEndpoints}</div>
                  <div className="text-sm text-gray-600">Başarılı</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-amber-600">{authRequiredEndpoints}</div>
                  <div className="text-sm text-gray-600">Auth Gerekli</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-red-600">{failedEndpoints}</div>
                  <div className="text-sm text-gray-600">Hatalı</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="endpoints" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="endpoints" className="text-lg">
                <FileText className="mr-2 h-5 w-5" />
                API Endpoints
              </TabsTrigger>
              <TabsTrigger value="models" className="text-lg">
                <Database className="mr-2 h-5 w-5" />
                Veri Modelleri
              </TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-6">
              {/* Category Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Kategoriler</CardTitle>
                  <CardDescription>Endpoint'leri kategoriye göre filtrele</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat: string) => (
                      <Badge
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm"
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === "all" ? `Tümü (${totalEndpoints})` : `${cat} (${categoryCount(cat)})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Endpoints List */}
              <div className="space-y-4">
                {filteredEndpoints.map((endpoint: any, idx: number) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge variant={endpoint.method === "GET" ? "secondary" : "default"}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                              {endpoint.path}
                            </code>
                            {endpoint.auth ? (
                              <Lock className="h-4 w-4 text-red-600" />
                            ) : (
                              <Unlock className="h-4 w-4 text-green-600" />
                            )}
                            {/* Test Status Badge */}
                            {endpoint.testResult.success ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {endpoint.testResult.statusText}
                              </Badge>
                            ) : endpoint.testResult.status === 401 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Auth Gerekli
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                {endpoint.testResult.statusText}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-base">
                            {endpoint.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Input:</h4>
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                            {endpoint.input}
                          </pre>
                        </div>
                        
                        {/* Test Results */}
                        {endpoint.testResult.success && endpoint.testResult.sampleResponse && (
                          <div>
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Örnek Response:</h4>
                            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-64">
                              {JSON.stringify(endpoint.testResult.sampleResponse, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {endpoint.testResult.errorDetail && endpoint.testResult.errorDetail !== "Bilinmeyen hata" && (
                          <div>
                            <h4 className="font-semibold text-sm text-red-700 mb-2">Hata Detayı:</h4>
                            <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto text-red-700">
                              {endpoint.testResult.errorDetail}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-6">
              {dataModels.map((model, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-orange-600" />
                      {model.name}
                    </CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Alan</th>
                            <th className="text-left py-2 px-4">Tip</th>
                            <th className="text-left py-2 px-4">Açıklama</th>
                          </tr>
                        </thead>
                        <tbody>
                          {model.fields.map((field, fieldIdx) => (
                            <tr key={fieldIdx} className="border-b last:border-0">
                              <td className="py-2 px-4 font-mono text-xs">{field.name}</td>
                              <td className="py-2 px-4">
                                <Badge variant="secondary">{field.type}</Badge>
                              </td>
                              <td className="py-2 px-4 text-gray-600">{field.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
