DROP TABLE `businesses`;--> statement-breakpoint
DROP TABLE `couriers`;--> statement-breakpoint
DROP TABLE `earnings`;--> statement-breakpoint
DROP TABLE `favoriteAddresses`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
DROP TABLE `paymentRequests`;--> statement-breakpoint
DROP TABLE `pricingConfig`;--> statement-breakpoint
DROP TABLE `ratings`;--> statement-breakpoint
DROP TABLE `restaurantTransactions`;--> statement-breakpoint
DROP TABLE `siteSettings`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerificationToken`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordResetToken`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordResetExpires`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phone`;