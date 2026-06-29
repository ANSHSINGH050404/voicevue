CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`content` text NOT NULL,
	`audio_url` text,
	`started_at` text,
	`submitted_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`question_id` text,
	`score` real,
	`feedback_json` text,
	`strengths` text,
	`weaknesses` text,
	`skills_assessed` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`question_text` text NOT NULL,
	`type` text DEFAULT 'opening' NOT NULL,
	`skill_category` text,
	`difficulty` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`mode` text NOT NULL,
	`topic` text,
	`difficulty` text DEFAULT 'medium' NOT NULL,
	`question_count` integer DEFAULT 5 NOT NULL,
	`duration` integer,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`session_token` text NOT NULL,
	`started_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`completed_at` text,
	`overall_score` real,
	`summary` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`avatar` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);