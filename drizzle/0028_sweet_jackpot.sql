ALTER TABLE `couriers` ADD CONSTRAINT `couriers_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
CREATE INDEX `business_userId_idx` ON `businesses` (`userId`);--> statement-breakpoint
CREATE INDEX `openId_idx` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerificationToken`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordResetToken`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordResetExpires`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailPreferences`;