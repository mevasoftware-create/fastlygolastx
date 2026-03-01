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
ALTER TABLE `couriers` ADD `iban` varchar(34);--> statement-breakpoint
ALTER TABLE `couriers` ADD `identityNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `couriers` ADD `identityType` enum('tc','passport');--> statement-breakpoint
ALTER TABLE `couriers` ADD `identityVerified` boolean DEFAULT false NOT NULL;