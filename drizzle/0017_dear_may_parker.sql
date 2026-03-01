ALTER TABLE `orders` ADD `deliveryTimeType` enum('now','scheduled') DEFAULT 'now' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduledDeliveryDate` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduledTimeSlot` varchar(20);