CREATE TABLE `creator_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companySize` varchar(64) NOT NULL,
	`industry` varchar(128) NOT NULL,
	`annualRevenue` varchar(64),
	`estimatedCreatorSpend` varchar(64),
	`currentPlatforms` text,
	`brandDescription` text,
	`creatorGoals` text,
	`score` float,
	`scoreBreakdown` json,
	`topRecommendations` json,
	`reportSummary` text,
	`contactEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactEmail` varchar(320),
	`answers` json NOT NULL,
	`strategyType` varchar(128),
	`strategyTitle` text,
	`strategySummary` text,
	`platformRecommendations` json,
	`examples` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_responses_id` PRIMARY KEY(`id`)
);
