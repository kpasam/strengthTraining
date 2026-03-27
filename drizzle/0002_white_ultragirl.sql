CREATE TABLE `exercise_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise_id` integer NOT NULL,
	`is_exercise` integer DEFAULT true NOT NULL,
	`body_part` text,
	`intensity` text,
	`movement_type` text,
	`equipment` text,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_labels_exercise_id_unique` ON `exercise_labels` (`exercise_id`);--> statement-breakpoint
CREATE INDEX `idx_logs_user_exercise_reps` ON `workout_logs` (`user_id`,`exercise_id`,`reps`);