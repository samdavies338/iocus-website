CREATE TABLE `enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text NOT NULL,
	`event_type` text NOT NULL,
	`games` text NOT NULL,
	`event_date` text NOT NULL,
	`start_time` text NOT NULL,
	`venue` text NOT NULL,
	`guest_count` integer NOT NULL,
	`notes` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL
);
