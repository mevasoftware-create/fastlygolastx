CREATE TABLE `appVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('ios','android','web') NOT NULL,
	`version` varchar(20) NOT NULL,
	`isForceUpdate` tinyint NOT NULL DEFAULT 0,
	`releaseNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`seoMeta` text NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `areas_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`address` text,
	`businessType` varchar(100),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phone` varchar(20),
	`countryCode` varchar(5),
	`taxNumber` varchar(50),
	`isVerified` tinyint NOT NULL DEFAULT 0,
	`rating` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`contactPerson` varchar(255),
	`email` varchar(320),
	`balance` int DEFAULT 0,
	`totalDebt` int DEFAULT 0,
	`status` enum('active','inactive','suspended') DEFAULT 'active',
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`seoMeta` text NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`shortName` text NOT NULL,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `couponUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`userId` int NOT NULL,
	`orderId` int,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `couponUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` int NOT NULL,
	`minOrderValue` int DEFAULT 0,
	`maxUsage` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `courierLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`latitude` varchar(50) NOT NULL,
	`longitude` varchar(50) NOT NULL,
	`accuracy` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courierLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `couriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vehicleType` enum('bicycle','motorcycle','car') NOT NULL,
	`vehiclePlate` varchar(20),
	`isAvailable` tinyint NOT NULL DEFAULT 1,
	`isVerified` tinyint NOT NULL DEFAULT 0,
	`rating` int DEFAULT 5,
	`totalDeliveries` int DEFAULT 0,
	`currentLatitude` varchar(50),
	`currentLongitude` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`phone` varchar(20),
	`countryCode` varchar(5),
	`gender` enum('male','female','other'),
	`experience` text,
	`availability` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`iban` varchar(34),
	`identityNumber` varchar(20),
	`identityType` enum('tc','passport'),
	`identityVerified` tinyint NOT NULL DEFAULT 0,
	`isDemo` tinyint NOT NULL DEFAULT 0,
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
CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`errorType` varchar(100) NOT NULL,
	`errorMessage` text NOT NULL,
	`stackTrace` text,
	`userId` int,
	`userEmail` varchar(320),
	`url` text,
	`userAgent` text,
	`source` enum('frontend','backend','api') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`statusCode` int,
	`resolved` tinyint NOT NULL DEFAULT 0,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`notes` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favoriteAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isDefault` enum('0','1') NOT NULL DEFAULT '0',
	CONSTRAINT `favoriteAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fcmTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`platform` enum('web','ios','android') NOT NULL,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fcmTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`isRead` tinyint NOT NULL DEFAULT 0,
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` varchar(50) NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderTracking_id` PRIMARY KEY(`id`)
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
	`pickupPhotoUrl` text,
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
	`isArchived` tinyint NOT NULL DEFAULT 0,
	`archivedAt` timestamp,
	`archivedBy` int,
	`calculatedPrice` int,
	`offeredPrice` int,
	`currentPrice` int,
	`priceMultiplier` int DEFAULT 100,
	`packageSize` enum('small','medium','large') DEFAULT 'medium',
	`pickupPhone` varchar(20),
	`deliveryPhone` varchar(20),
	`pickupFullName` varchar(255),
	`deliveryFullName` varchar(255),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`seoMeta` text NOT NULL,
	`active` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
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
CREATE TABLE `priceIncreaseHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`customerId` int NOT NULL,
	`previousPrice` int NOT NULL,
	`newPrice` int NOT NULL,
	`increaseAmount` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceIncreaseHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceOffers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`courierId` int NOT NULL,
	`offeredPrice` int NOT NULL,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priceOffers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenario` enum('A','B','C') NOT NULL,
	`baseFee` int NOT NULL,
	`perKmFee` int NOT NULL,
	`commissionRate` int,
	`description` text,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricingConfig_scenario_unique` UNIQUE(`scenario`)
);
--> statement-breakpoint
CREATE TABLE `push_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('order','delivery','system','payment') NOT NULL,
	`isRead` tinyint NOT NULL DEFAULT 0,
	`relatedOrderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`token` text NOT NULL,
	`platform` enum('web','ios','android') NOT NULL,
	`deviceInfo` json,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`)
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
CREATE TABLE `redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`targetUrl` varchar(500) NOT NULL,
	`redirectType` enum('301','302') NOT NULL DEFAULT '301',
	`isActive` tinyint NOT NULL DEFAULT 1,
	`description` text,
	`hitCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `redirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `redirects_sourceUrl_unique` UNIQUE(`sourceUrl`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredId` int NOT NULL,
	`status` enum('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
	`rewardAmount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
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
CREATE TABLE `supportTicketMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`isStaff` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportTicketMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surgeConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`reason` text NOT NULL,
	`multiplier` decimal(4,2) NOT NULL,
	`isActive` tinyint NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surgeConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userWallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userWallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `userWallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `walletTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('credit','debit') NOT NULL,
	`amount` int NOT NULL,
	`description` text,
	`relatedOrderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','courier','business') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpires` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailPreferences` json;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);