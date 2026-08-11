CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`eventId` text NOT NULL,
	`eventTitle` text NOT NULL,
	`uid` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`location` text NOT NULL,
	`image` text NOT NULL,
	`capacity` integer DEFAULT 0 NOT NULL,
	`registeredCount` integer DEFAULT 0 NOT NULL,
	`isPublished` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `fossils` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`shortCode` text,
	`speciesId` text NOT NULL,
	`specimen` text NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`thumbnail` text NOT NULL,
	`description` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`category` text NOT NULL,
	`likeCount` integer DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`speciesId`) REFERENCES `species`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fossils_slug_unique` ON `fossils` (`slug`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`titleEn` text,
	`company` text,
	`role` text NOT NULL,
	`period` text NOT NULL,
	`description` text NOT NULL,
	`challenges` text,
	`achievements` text,
	`technologies` text DEFAULT '[]' NOT NULL,
	`thumbnail` text NOT NULL,
	`cover` text,
	`images` text DEFAULT '[]' NOT NULL,
	`url` text,
	`github` text,
	`category` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`isPublic` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `species` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`taxonomy` text NOT NULL,
	`period` text NOT NULL,
	`description` text NOT NULL,
	`characteristics` text,
	`habitat` text,
	`distribution` text,
	`representativeImage` text,
	`specimenCount` integer DEFAULT 0 NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`category` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `species_slug_unique` ON `species` (`slug`);