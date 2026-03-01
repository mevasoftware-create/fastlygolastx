ALTER TABLE `couriers` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `couriers` ADD `experience` text;--> statement-breakpoint
ALTER TABLE `couriers` ADD `availability` text;--> statement-breakpoint
ALTER TABLE `couriers` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;