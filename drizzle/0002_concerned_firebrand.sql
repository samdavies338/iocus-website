CREATE TABLE `enquiry_decisions` (
	`enquiry_id` integer PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`decided_at` text NOT NULL,
	`decided_by` text NOT NULL,
	`customer_note` text NOT NULL,
	`first_attempt_at` text,
	`last_attempt_at` text,
	`email_sent_at` text,
	`email_failed_at` text,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "enquiry_decision_status" CHECK("enquiry_decisions"."status" IN ('booked', 'rejected'))
);
