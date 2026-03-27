CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`canonical_name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_canonical_name_unique` ON `exercises` (`canonical_name`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`pin` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `workout_group_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`exercise_id` integer NOT NULL,
	`variant_flags` text DEFAULT '[]',
	`prescribed_reps` text NOT NULL,
	`prescribed_notes` text DEFAULT '',
	`is_accessory` integer DEFAULT false,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `workout_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `workout_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`group_label` text NOT NULL,
	`prescribed_sets` integer DEFAULT 3,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `workout_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_plan_group` ON `workout_groups` (`plan_id`,`group_label`);--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer DEFAULT 1 NOT NULL,
	`date` text NOT NULL,
	`exercise_id` integer NOT NULL,
	`variant_flags` text DEFAULT '[]',
	`group_label` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real,
	`weight_unit` text DEFAULT 'lbs',
	`reps` integer,
	`duration` text,
	`rpe` integer,
	`notes` text DEFAULT '',
	`completed_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_logs_exercise_date` ON `workout_logs` (`exercise_id`,`date`);--> statement-breakpoint
CREATE TABLE `workout_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`raw_text` text NOT NULL,
	`parsed_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_plans_date_unique` ON `workout_plans` (`date`);