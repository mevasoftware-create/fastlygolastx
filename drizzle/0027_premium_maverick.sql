CREATE TABLE `priceIncreaseHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`customerId` int NOT NULL,
	`previousPrice` int NOT NULL,
	`newPrice` int NOT NULL,
	`increaseAmount` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceIncreaseHistory_id` PRIMARY KEY(`id`)
);
