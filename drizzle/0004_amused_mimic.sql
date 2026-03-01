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
ALTER TABLE `restaurants` MODIFY COLUMN `phone` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurants` ADD `contactPerson` varchar(255);--> statement-breakpoint
ALTER TABLE `restaurants` ADD `balance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurants` ADD `totalDebt` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurants` ADD `status` enum('pending','approved','rejected','suspended') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurants` ADD CONSTRAINT `restaurants_userId_unique` UNIQUE(`userId`);