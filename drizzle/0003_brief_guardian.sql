CREATE TABLE `admin_login_links` (
	`email` text PRIMARY KEY NOT NULL,
	`token_hash` text,
	`expires_at` integer NOT NULL,
	`requested_at` integer NOT NULL,
	`window_started_at` integer NOT NULL,
	`requests_in_window` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_login_links_token_hash_unique` ON `admin_login_links` (`token_hash`);--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_session_email_expiry` ON `admin_sessions` (`email`,`expires_at`);