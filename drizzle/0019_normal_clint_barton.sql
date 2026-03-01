CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactPerson` varchar(255),
	`businessType` enum('restaurant','market','pharmacy','retail') NOT NULL DEFAULT 'restaurant',
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phone` varchar(20) NOT NULL,
	`taxNumber` varchar(50),
	`balance` int NOT NULL DEFAULT 0,
	`totalDebt` int NOT NULL DEFAULT 0,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`isVerified` boolean NOT NULL DEFAULT false,
	`rating` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `couriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(20),
	`vehicleType` enum('bicycle','motorcycle','car') NOT NULL,
	`vehiclePlate` varchar(20),
	`experience` text,
	`availability` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`rating` int DEFAULT 5,
	`totalDeliveries` int DEFAULT 0,
	`currentLatitude` varchar(50),
	`currentLongitude` varchar(50),
	`iban` varchar(34),
	`identityNumber` varchar(20),
	`identityType` enum('tc','passport'),
	`identityVerified` boolean NOT NULL DEFAULT false,
	`isDemo` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `couriers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`orderId` int NOT NULL,
	`amount` int NOT NULL,
	`pricingScenario` enum('A','B','C') NOT NULL,
	`commissionAmount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favoriteAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`isDefault` enum('0','1') NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favoriteAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('order','delivery','system','payment') NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedOrderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`courierId` int,
	`restaurantId` int,
	`orderType` enum('restaurant','market','pharmacy','individual','express') NOT NULL,
	`pickupAddress` text NOT NULL,
	`pickupLatitude` varchar(50),
	`pickupLongitude` varchar(50),
	`deliveryAddress` text NOT NULL,
	`deliveryLatitude` varchar(50),
	`deliveryLongitude` varchar(50),
	`vehicleType` enum('bicycle','motorcycle','car','any') DEFAULT 'any',
	`packageDescription` text,
	`specialInstructions` text,
	`distance` int,
	`baseFee` int NOT NULL,
	`distanceFee` int NOT NULL,
	`totalFee` int NOT NULL,
	`pricingScenario` enum('A','B','C') DEFAULT 'A',
	`commissionRate` int,
	`status` enum('pending','accepted','picked_up','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`pickedUpAt` timestamp,
	`deliveredAt` timestamp,
	`deliveryPhotoUrl` text,
	`deliveryNotes` text,
	`customerSignature` text,
	`customerRating` int,
	`customerReview` text,
	`paymentType` enum('sender_pays','receiver_pays') NOT NULL DEFAULT 'sender_pays',
	`paymentStatus` enum('pending','collected','paid') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('cash','card','wallet') DEFAULT 'cash',
	`collectedAmount` int,
	`collectedAt` timestamp,
	`collectedBy` int,
	`deliveryTimeType` enum('now','scheduled') NOT NULL DEFAULT 'now',
	`scheduledDeliveryDate` timestamp,
	`scheduledTimeSlot` varchar(20),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `paymentRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`processedBy` int,
	`notes` text,
	`rejectionReason` text,
	CONSTRAINT `paymentRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenario` enum('A','B','C') NOT NULL,
	`baseFee` int NOT NULL,
	`perKmFee` int NOT NULL,
	`commissionRate` int,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricingConfig_scenario_unique` UNIQUE(`scenario`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`customerId` int NOT NULL,
	`courierId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `ratings_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `restaurantTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`type` enum('topup','order_charge','refund','adjustment') NOT NULL,
	`amount` int NOT NULL,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`relatedOrderId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	CONSTRAINT `restaurantTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`type` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','courier','business') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpires` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);