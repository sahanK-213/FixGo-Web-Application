-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 18, 2026 at 12:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fixgo_web`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `contactNumber` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

CREATE TABLE `customer` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `contactNumber` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `profilePhoto` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customerVehicle`
--

CREATE TABLE `customerVehicle` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `vehicle_category_id` int(11) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `history`
--

CREATE TABLE `history` (
  `id` int(11) NOT NULL,
  `service_request_id` int(11) DEFAULT NULL,
  `monthly_bill_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monthlyBill`
--

CREATE TABLE `monthlyBill` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `service_charge_rule_id` int(11) DEFAULT NULL,
  `month` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `totalCompletedRequests` int(11) DEFAULT NULL,
  `totalAmount` double DEFAULT NULL,
  `paymentStatus` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `service_request_id` int(11) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

CREATE TABLE `review` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `service_request_id` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `serviceChargeRule`
--

CREATE TABLE `serviceChargeRule` (
  `id` int(11) NOT NULL,
  `chargePerRequest` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `serviceRequest`
--

CREATE TABLE `serviceRequest` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `vehicle_category_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `urgency_level` varchar(20) DEFAULT 'Normal',
  `location` point DEFAULT NULL,
  `pickup_landmark` varchar(255) DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `preferred_time` varchar(50) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `vehicle_brand` varchar(255) DEFAULT NULL,
  `vehicle_color` varchar(255) DEFAULT NULL,
  `issue_category` varchar(100) DEFAULT NULL,
  `requires_tow` tinyint(1) DEFAULT 0,
  `dispatched_driver_name` varchar(255) DEFAULT NULL,
  `dispatched_driver_phone` varchar(255) DEFAULT NULL,
  `dispatched_truck_brand` varchar(255) DEFAULT NULL,
  `dispatched_truck_color` varchar(255) DEFAULT NULL,
  `dispatched_truck_plate` varchar(255) DEFAULT NULL,
  `promised_eta` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop`
--

CREATE TABLE `shop` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `contactNumber` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `location` point DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `openTime` time DEFAULT NULL,
  `closeTime` time DEFAULT NULL,
  `isAvailable` tinyint(1) DEFAULT NULL,
  `carriageService` tinyint(1) DEFAULT 0,
  `BRN` varchar(255) DEFAULT NULL,
  `profileImageURL` varchar(255) DEFAULT NULL,
  `default_driver_name` varchar(255) DEFAULT NULL,
  `default_driver_phone` varchar(255) DEFAULT NULL,
  `default_truck_brand` varchar(255) DEFAULT NULL,
  `default_truck_color` varchar(255) DEFAULT NULL,
  `tow_truck_plate` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shopCategory`
--

CREATE TABLE `shopCategory` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shopCategoryMapping`
--

CREATE TABLE `shopCategoryMapping` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `shop_category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shopImage`
--

CREATE TABLE `shopImage` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shopServices`
--

CREATE TABLE `shopServices` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `starting_price` varchar(50) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shopVehicleCategories`
--

CREATE TABLE `shopVehicleCategories` (
  `id` int(11) NOT NULL,
  `shop_id` int(11) DEFAULT NULL,
  `vehicle_category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `userRole` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicleCategory`
--

CREATE TABLE `vehicleCategory` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customer`
--
ALTER TABLE `customer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customerVehicle`
--
ALTER TABLE `customerVehicle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `vehicle_category_id` (`vehicle_category_id`);

--
-- Indexes for table `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_request_id` (`service_request_id`),
  ADD KEY `monthly_bill_id` (`monthly_bill_id`);

--
-- Indexes for table `monthlyBill`
--
ALTER TABLE `monthlyBill`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `service_charge_rule_id` (`service_charge_rule_id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `service_request_id` (`service_request_id`);

--
-- Indexes for table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `service_request_id` (`service_request_id`);

--
-- Indexes for table `serviceChargeRule`
--
ALTER TABLE `serviceChargeRule`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `serviceRequest`
--
ALTER TABLE `serviceRequest`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `vehicle_category_id` (`vehicle_category_id`);

--
-- Indexes for table `shop`
--
ALTER TABLE `shop`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shopCategory`
--
ALTER TABLE `shopCategory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shopCategoryMapping`
--
ALTER TABLE `shopCategoryMapping`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `shop_category_id` (`shop_category_id`);

--
-- Indexes for table `shopImage`
--
ALTER TABLE `shopImage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `shopServices`
--
ALTER TABLE `shopServices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `shopVehicleCategories`
--
ALTER TABLE `shopVehicleCategories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `vehicle_category_id` (`vehicle_category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicleCategory`
--
ALTER TABLE `vehicleCategory`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customerVehicle`
--
ALTER TABLE `customerVehicle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `history`
--
ALTER TABLE `history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `monthlyBill`
--
ALTER TABLE `monthlyBill`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review`
--
ALTER TABLE `review`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `serviceChargeRule`
--
ALTER TABLE `serviceChargeRule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `serviceRequest`
--
ALTER TABLE `serviceRequest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `shop`
--
ALTER TABLE `shop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `shopCategory`
--
ALTER TABLE `shopCategory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `shopCategoryMapping`
--
ALTER TABLE `shopCategoryMapping`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `shopImage`
--
ALTER TABLE `shopImage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shopServices`
--
ALTER TABLE `shopServices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shopVehicleCategories`
--
ALTER TABLE `shopVehicleCategories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `vehicleCategory`
--
ALTER TABLE `vehicleCategory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`);

--
-- Constraints for table `customer`
--
ALTER TABLE `customer`
  ADD CONSTRAINT `customer_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`);

--
-- Constraints for table `customerVehicle`
--
ALTER TABLE `customerVehicle`
  ADD CONSTRAINT `customerVehicle_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  ADD CONSTRAINT `customerVehicle_ibfk_2` FOREIGN KEY (`vehicle_category_id`) REFERENCES `vehicleCategory` (`id`);

--
-- Constraints for table `history`
--
ALTER TABLE `history`
  ADD CONSTRAINT `history_ibfk_1` FOREIGN KEY (`service_request_id`) REFERENCES `serviceRequest` (`id`),
  ADD CONSTRAINT `history_ibfk_2` FOREIGN KEY (`monthly_bill_id`) REFERENCES `monthlyBill` (`id`);

--
-- Constraints for table `monthlyBill`
--
ALTER TABLE `monthlyBill`
  ADD CONSTRAINT `monthlyBill_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  ADD CONSTRAINT `monthlyBill_ibfk_2` FOREIGN KEY (`service_charge_rule_id`) REFERENCES `serviceChargeRule` (`id`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `notification_ibfk_2` FOREIGN KEY (`service_request_id`) REFERENCES `serviceRequest` (`id`);

--
-- Constraints for table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `review_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  ADD CONSTRAINT `review_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  ADD CONSTRAINT `review_ibfk_3` FOREIGN KEY (`service_request_id`) REFERENCES `serviceRequest` (`id`);

--
-- Constraints for table `serviceRequest`
--
ALTER TABLE `serviceRequest`
  ADD CONSTRAINT `serviceRequest_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
  ADD CONSTRAINT `serviceRequest_ibfk_2` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  ADD CONSTRAINT `serviceRequest_ibfk_3` FOREIGN KEY (`vehicle_category_id`) REFERENCES `vehicleCategory` (`id`);

--
-- Constraints for table `shop`
--
ALTER TABLE `shop`
  ADD CONSTRAINT `shop_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`);

--
-- Constraints for table `shopCategoryMapping`
--
ALTER TABLE `shopCategoryMapping`
  ADD CONSTRAINT `shopCategoryMapping_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  ADD CONSTRAINT `shopCategoryMapping_ibfk_2` FOREIGN KEY (`shop_category_id`) REFERENCES `shopCategory` (`id`);

--
-- Constraints for table `shopImage`
--
ALTER TABLE `shopImage`
  ADD CONSTRAINT `shopImage_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`);

--
-- Constraints for table `shopServices`
--
ALTER TABLE `shopServices`
  ADD CONSTRAINT `shopServices_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shopVehicleCategories`
--
ALTER TABLE `shopVehicleCategories`
  ADD CONSTRAINT `shopVehicleCategories_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`),
  ADD CONSTRAINT `shopVehicleCategories_ibfk_2` FOREIGN KEY (`vehicle_category_id`) REFERENCES `vehicleCategory` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
