ALTER TABLE `orders` ADD `calculatedPrice` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `offeredPrice` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `currentPrice` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `priceMultiplier` int DEFAULT 100;--> statement-breakpoint
ALTER TABLE `orders` ADD `packageSize` enum('small','medium','large') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `orders` ADD `priorityLevel` enum('normal','urgent','express') DEFAULT 'normal';