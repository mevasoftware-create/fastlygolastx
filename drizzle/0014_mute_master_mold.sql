ALTER TABLE `businesses` ADD `businessType` enum('restaurant','market','pharmacy','retail') DEFAULT 'restaurant' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `taxNumber` varchar(50);