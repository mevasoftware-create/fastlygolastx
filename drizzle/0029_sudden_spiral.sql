DROP TABLE `areas`;--> statement-breakpoint
DROP TABLE `businesses`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
DROP TABLE `couriers`;--> statement-breakpoint
DROP TABLE `earnings`;--> statement-breakpoint
DROP TABLE `favoriteAddresses`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
DROP TABLE `paymentRequests`;--> statement-breakpoint
DROP TABLE `priceIncreaseHistory`;--> statement-breakpoint
DROP TABLE `pricingConfig`;--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
DROP TABLE `restaurantTransactions`;--> statement-breakpoint
DROP TABLE `siteSettings`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
DROP INDEX `openId_idx` ON `users`;--> statement-breakpoint
DROP INDEX `email_idx` ON `users`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phone`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `avatarUrl`;