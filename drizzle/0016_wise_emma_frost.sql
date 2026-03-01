ALTER TABLE `orders` ADD `paymentType` enum('sender_pays','receiver_pays') DEFAULT 'sender_pays' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentStatus` enum('pending','collected','paid') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` enum('cash','card','wallet') DEFAULT 'cash';--> statement-breakpoint
ALTER TABLE `orders` ADD `collectedAmount` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `collectedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `collectedBy` int;