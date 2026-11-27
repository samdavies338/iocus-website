CREATE TABLE `enquiry_reminders` (
	`enquiry_id` integer PRIMARY KEY NOT NULL,
	`delivery` text NOT NULL,
	`collection` text NOT NULL,
	`first_attempt_at` text,
	`last_attempt_at` text,
	`email_sent_at` text,
	`email_failed_at` text,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiry_decisions`(`enquiry_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `enquiry_decisions` ADD `package_price_pence` integer;--> statement-breakpoint
ALTER TABLE `enquiry_decisions` ADD `delivery_fee_pence` integer;--> statement-breakpoint
ALTER TABLE `enquiry_decisions` ADD `booking_template_version` integer;