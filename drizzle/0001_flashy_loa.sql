CREATE TABLE `couriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vehicleType` enum('bicycle','motorcycle','car') NOT NULL,
	`vehiclePlate` varchar(20),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isVerified` boolean NOT NULL DEFAULT false,
	`rating` int DEFAULT 5,
	`totalDeliveries` int DEFAULT 0,
	`currentLatitude` varchar(50),
	`currentLongitude` varchar(50),
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
	`orderType` enum('restaurant','market','individual','express') NOT NULL,
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
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
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
CREATE TABLE `restaurants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phone` varchar(20),
	`isVerified` boolean NOT NULL DEFAULT false,
	`rating` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','courier','restaurant') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);