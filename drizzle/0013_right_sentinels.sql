CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`contactPerson` varchar(255),
	`email` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phone` varchar(20) NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`totalDebt` int NOT NULL DEFAULT 0,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`isVerified` boolean NOT NULL DEFAULT false,
	`rating` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
DROP TABLE `restaurants`;