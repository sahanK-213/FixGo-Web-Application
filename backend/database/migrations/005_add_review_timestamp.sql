ALTER TABLE `review` 
  ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `comment`,
  ADD UNIQUE KEY `unique_review` (`service_request_id`, `customer_id`);