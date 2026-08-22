-- Master Seed File generated from fixgo_web(6).sql
-- Execution Order optimized for Foreign Keys

-- Seeding users
INSERT INTO `users` (`id`, `email`, `userRole`, `password`, `isActive`, `verification_token`, `is_email_verified`, `token_expiry`, `reset_token`, `reset_token_expiry`) VALUES
(1, 'ranjith.autoworks@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(2, 'pradeep.motors@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(3, 'hameed.spareparts@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(4, 'suresh.servicecentre@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(5, 'nalaka.kelaniya@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(6, 'chaminda.moratuwa@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(7, 'dasun.malabe@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(8, 'thilina.gampaha@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(9, 'rizwan.panadura@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(10, 'lasantha.negombo@gmail.com', 'shop_owner', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(11, 'kamal.perera@gmail.com', 'customer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(12, 'nirosha.fernando@gmail.com', 'customer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(13, 'tharaka.silva@gmail.com', 'customer', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL),
(14, 'admin@fixgo.lk', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NULL, 1, NULL, NULL, NULL);

-- Seeding admin
INSERT INTO `admin` (`id`, `name`, `contactNumber`) VALUES
(14, 'FixGo System Admin', '0112223344');

-- Seeding customer
INSERT INTO `customer` (`id`, `name`, `contactNumber`, `address`, `profilePhoto`, `cancellation_strikes`, `createdAt`, `loyalty_points`) VALUES
(11, 'Kamal Perera', '0771234567', '12/3, Wijerama Road, Nugegoda', NULL, 0, '2026-06-01 08:00:00', 0),
(12, 'Nirosha Fernando', '0712345678', '45, Station Road, Dehiwala', NULL, 0, '2026-06-05 10:00:00', 0),
(13, 'Tharaka Silva', '0763456789', '78, Lake Drive, Battaramulla, Colombo 20', NULL, 0, '2026-06-10 14:00:00', 0);

-- Seeding shop
INSERT INTO `shop` (`id`, `name`, `address`, `contactNumber`, `owner`, `location`, `description`, `openTime`, `closeTime`, `isAvailable`, `carriageService`, `BRN`, `profileImageURL`, `default_driver_name`, `default_driver_phone`, `default_truck_brand`, `default_truck_color`, `tow_truck_plate`) VALUES
(1, 'Colombo Auto Works', '32, Galle Road, Kollupitiya, Colombo 03', '0112456789', 'Ranjith Perera', 0x00000000010100000035ef384547f6534091ed7c3f359e1b40, 'Full-service garage specialising in engine overhaul, brake systems, and AC servicing.', '07:30:00', '18:00:00', 1, 0, 'PV/2019/1001', 'uploads/shopOwners/garage1.jpg', NULL, NULL, NULL, NULL, NULL),
(2, 'Nugegoda Motors', '45, High Level Road, Nugegoda', '0112889733', 'Pradeep Jayasinghe', 0x0000000001010000005b423ee8d9f8534092cb7f48bf7d1b40, 'Trusted neighbourhood garage for quick repairs, oil changes, and tyre rotations.', '08:00:00', '18:30:00', 1, 0, 'PV/2018/2002', 'uploads/shopOwners/garage2.jpg', NULL, NULL, NULL, NULL, NULL),
(3, 'Lanka Spare Parts Hub', '210, Panchikawatte Road, Colombo 10', '0112445599', 'M.H.M. Hameed', 0x0000000001010000001f85eb51b8f65340dc68006f81c41b40, 'One-stop shop for genuine OEM spare parts, lubricants, and accessories for Japanese and Korean vehicles.', '08:30:00', '17:30:00', 1, 0, 'PV/2020/3003', 'uploads/shopOwners/spare.jpeg', NULL, NULL, NULL, NULL, NULL),
(4, 'Mount Lavinia Auto Service', '78, Galle Road, Mount Lavinia', '0112738899', 'Suresh Kumara', 0x000000000101000000f31fd26f5ff7534060764f1e166a1b40, 'Premium detailing, full body wash, interior cleaning, and computerised diagnostics.', '07:00:00', '19:00:00', 1, 0, 'PV/2017/4004', 'uploads/shopOwners/service.jpg', NULL, NULL, NULL, NULL, NULL),
(5, 'Kelaniya Auto Repair', '15, Kandy Road, Kelaniya', '0112912345', 'Nalaka Bandara', 0x000000000101000000492eff21fdfa5340fdf675e09cd11b40, 'Specialising in electrical systems, suspension, and exhaust repairs for all local brands.', '08:00:00', '17:00:00', 1, 0, 'PV/2021/5005', 'uploads/shopOwners/garage3.webp', NULL, NULL, NULL, NULL, NULL),
(6, 'Moratuwa Quick Fix Garage', '22, Rawathawatte Road, Moratuwa', '0112645566', 'Chaminda Wickrama', 0x000000000101000000bf7d1d3867f85340f2d24d6210181b40, 'Fast, affordable repairs for all makes. Clutch replacements, gearboxes, and steering systems.', '07:30:00', '17:30:00', 1, 0, 'PV/2016/6006', 'uploads/shopOwners/garage1.jpg', NULL, NULL, NULL, NULL, NULL),
(7, 'Malabe Speed Auto Center', '56, Kaduwela Road, Malabe', '0114778899', 'Dasun Alwis', 0x000000000101000000d95f764f1efe5340b30c71ac8b9b1b40, '24/7 roadside recovery and full mechanical garage. Tow truck on standby at all times.', '00:00:00', '23:59:59', 1, 1, 'PV/2022/7007', 'uploads/shopOwners/garage2.jpg', 'Roshan Dissanayake', '0778891234', 'Tata', 'Yellow', 'WP NA-7777'),
(8, 'Gampaha Vehicle Services', '118, Colombo Road, Gampaha', '0332223344', 'Thilina Rathnayake', 0x000000000101000000eb73b515fbff53403d2cd49ae65d1c40, 'Full vehicle servicing, periodic maintenance, and wheel alignment for all passenger vehicles.', '08:00:00', '18:00:00', 1, 0, 'PV/2015/8008', 'uploads/shopOwners/service.jpg', NULL, NULL, NULL, NULL, NULL),
(9, 'Panadura Auto Spares', '67, Galle Road, Panadura', '0342567890', 'Rizwan Hamdhan', 0x000000000101000000d26f5f07cef953405f07ce1951da1a40, 'Retail stockist of body panels, belts, filters, and lubricants for commercial and passenger vehicles.', '08:30:00', '17:00:00', 1, 0, 'PV/2014/9009', 'uploads/shopOwners/spare.jpeg', NULL, NULL, NULL, NULL, NULL),
(10, 'Negombo Auto Hub', '33, Colombo Road, Negombo', '0312234455', 'Lasantha Samaraweera', 0x000000000101000000cc7f48bf7df55340f7065f984cd51c40, 'General garage and roadside assistance for all vehicle types. Serving the Negombo coastal belt.', '07:30:00', '18:00:00', 1, 0, 'PV/2013/1010', 'uploads/shopOwners/garage3.webp', NULL, NULL, NULL, NULL, NULL);

-- Seeding shopcategory
INSERT INTO `shopcategory` (`id`, `name`, `description`) VALUES
(1, 'Garages', 'General automotive repair and mechanical fixes'),
(2, 'Service Centers', 'Washing, detailing, and routine maintenance'),
(3, 'Spare Parts', 'Retail auto parts, lubricants, and accessories');

-- Seeding vehiclecategory
INSERT INTO `vehiclecategory` (`id`, `name`, `description`) VALUES
(1, '3 Wheelers & Bikes', 'Motorcycles, scooters, and tuk-tuks'),
(2, '4 Wheelers', 'Cars, SUVs, vans, and standard passenger vehicles'),
(3, 'Commercial Vehicles', 'Lorrys, trucks, and busses');

-- Seeding shopcategorymapping
INSERT INTO `shopcategorymapping` (`id`, `shop_id`, `shop_category_id`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 3),
(4, 4, 2),
(5, 5, 1),
(6, 6, 1),
(7, 7, 1),
(8, 8, 2),
(9, 9, 3),
(10, 10, 1);

-- Seeding shopvehiclecategories
INSERT INTO `shopvehiclecategories` (`id`, `shop_id`, `vehicle_category_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 1),
(4, 2, 2),
(5, 3, 1),
(6, 3, 2),
(7, 3, 3),
(8, 4, 2),
(9, 5, 1),
(10, 5, 2),
(11, 6, 1),
(12, 6, 2),
(13, 6, 3),
(14, 7, 1),
(15, 7, 2),
(16, 7, 3),
(17, 8, 2),
(18, 9, 1),
(19, 9, 2),
(20, 9, 3),
(21, 10, 1),
(22, 10, 2);

-- Seeding billingconfiguration
INSERT INTO `billingconfiguration` (`id`, `garagePerRequestFee`, `serviceCenterPerRequestFee`, `sparePartsMonthlyFee`, `garageGracePeriodDays`, `serviceCenterGracePeriodDays`, `sparePartsGracePeriodDays`, `updatedAt`, `updatedByAdminId`) VALUES
(1, 500.00, 400.00, 3000.00, 14, 14, 14, '2026-07-31 08:20:34', NULL);

-- Seeding shopservices
INSERT INTO `shopservices` (`id`, `shop_id`, `category`, `service_name`, `starting_price`, `duration`) VALUES
(1, 1, 'Mechanical', 'Full Engine Tune-up', 'Rs. 8,500', '3 Hours'),
(2, 1, 'Mechanical', 'Brake Pad Replacement', 'Rs. 3,500', '1 Hour'),
(3, 1, 'Maintenance', 'Oil & Filter Change', 'Rs. 2,500', '45 Mins'),
(4, 1, 'Electrical', 'Electrical Diagnostics', 'Rs. 1,500', '30 Mins'),
(5, 2, 'Mechanical', 'Clutch Replacement', 'Rs. 12,000', '4 Hours'),
(6, 2, 'Maintenance', 'Oil Change & Top-up', 'Rs. 2,000', '30 Mins'),
(7, 2, 'Mechanical', 'Tyre Rotation & Balancing', 'Rs. 1,200', '45 Mins'),
(8, 3, 'Parts Supply', 'Genuine Engine Oil (4L)', 'Rs. 3,800', 'In Stock'),
(9, 3, 'Parts Supply', 'OEM Air Filter', 'Rs. 1,200', 'In Stock'),
(10, 3, 'Parts Supply', 'Car Battery (Japanese)', 'Rs. 22,000', 'In Stock'),
(11, 4, 'Detailing', 'Full Body Wash & Wax', 'Rs. 4,500', '2 Hours'),
(12, 4, 'Detailing', 'Interior Deep Clean', 'Rs. 6,500', '3 Hours'),
(13, 4, 'Maintenance', 'Periodic Service (Full)', 'Rs. 9,000', '4 Hours'),
(14, 7, 'Towing', 'Flatbed Tow (within 10km)', 'Rs. 4,500', 'Varies'),
(15, 7, 'Towing', 'Flatbed Tow (10–25km)', 'Rs. 8,000', 'Varies'),
(16, 7, 'Mechanical', 'Engine Diagnostics (OBD)', 'Rs. 2,500', '1 Hour'),
(17, 7, 'Mechanical', 'Suspension & Steering Check', 'Rs. 1,800', '1 Hour'),
(18, 8, 'Maintenance', 'Full Vehicle Service', 'Rs. 7,500', '3 Hours'),
(19, 8, 'Mechanical', 'Wheel Alignment', 'Rs. 1,500', '45 Mins'),
(20, 10, 'Mechanical', 'General Repairs', 'Rs. 3,000', '2 Hours'),
(21, 10, 'Maintenance', 'Oil Change', 'Rs. 2,200', '30 Mins');

-- Seeding shopimage
INSERT INTO `shopimage` (`id`, `shop_id`, `url`) VALUES
(1, 1, 'uploads/gallery/shop1_front.jpg'),
(2, 1, 'uploads/gallery/shop1_interior.jpg'),
(3, 2, 'uploads/gallery/shop2_front.jpg'),
(4, 4, 'uploads/gallery/shop4_detailing.jpg'),
(5, 7, 'uploads/gallery/shop7_towtruck.jpg'),
(6, 7, 'uploads/gallery/shop7_garage.jpg'),
(7, 10, 'uploads/gallery/shop10_front.jpg');

-- Seeding servicerequest
INSERT INTO `servicerequest` (`id`, `customer_id`, `shop_id`, `vehicle_category_id`, `description`, `status`, `urgency_level`, `location`, `pickup_landmark`, `preferred_date`, `preferred_time`, `photo`, `vehicle_brand`, `vehicle_color`, `issue_category`, `requires_tow`, `dispatched_driver_name`, `dispatched_driver_phone`, `dispatched_truck_brand`, `dispatched_truck_color`, `dispatched_truck_plate`, `promised_eta`, `created_at`, `accepted_at`, `confirmed_at`, `completed_at`, `cancelled_at`, `cancelled_by`, `cancellation_reason`) VALUES
(1, 11, 1, 2, 'Engine making a rattling noise on startup. Needs full inspection.', 'Completed', 'Normal', 0x0000000001010000002cd49ae61df75340857cd0b359b51b40, 'Near Liberty Roundabout, Colombo 03', '2026-06-15', '10:00 AM - 12:00 PM', NULL, 'Toyota Vitz', 'Silver', 'Engine', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-15 03:00:00', '2026-06-15 03:35:00', '2026-06-15 04:45:00', '2026-06-15 07:30:00', NULL, NULL, NULL),
(2, 12, 4, 2, 'Brake pads worn out. Squeaking sound when braking.', 'Completed', 'Normal', 0x000000000101000000f4fdd478e9f65340a69bc420b0721b40, 'Near Mount Lavinia Hotel junction', '2026-06-20', '02:00 PM - 04:00 PM', NULL, 'Honda Fit', 'White', 'Brakes', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-20 06:30:00', '2026-06-20 07:15:00', '2026-06-20 08:40:00', '2026-06-20 11:00:00', NULL, NULL, NULL),
(3, 13, 7, 2, 'Car broke down suddenly on Rajagiriya flyover. Needs tow and engine check.', 'Completed', 'Urgent', 0x000000000101000000e10b93a982f95340d122dbf97eaa1b40, 'Rajagiriya flyover, near McDonalds', NULL, NULL, NULL, 'Suzuki Alto', 'Blue', 'Engine', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-25 03:30:00', '2026-06-25 03:52:00', '2026-06-25 04:30:00', '2026-06-25 09:15:00', NULL, NULL, NULL),
(4, 11, 2, 2, 'Routine oil change and tyre rotation needed before long trip.', 'Completed', 'Normal', 0x00000000010100000062105839b4f853407b14ae47e17a1b40, 'Nugegoda Town, near Majestic City', '2026-07-01', '08:00 AM - 10:00 AM', NULL, 'Nissan March', 'Black', 'Maintenance', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 01:30:00', '2026-07-01 02:00:00', '2026-07-01 02:45:00', '2026-07-01 04:30:00', NULL, NULL, NULL),
(5, 12, 5, 1, 'Bike battery dead, cannot start. Need battery check and replacement.', 'Cancelled', 'Normal', 0x000000000101000000c3f5285c8ffa5340cdcccccccccc1b40, 'Kelaniya temple junction, main road', '2026-07-05', '03:00 PM - 05:00 PM', NULL, 'Honda CB150R', 'Red', 'Electrical', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-05 04:30:00', NULL, NULL, NULL, '2026-07-05 06:00:00', 'Customer', 'Found a closer mechanic to handle the issue.'),
(6, 13, 7, 2, 'Tire punch', 'Completed', 'Normal', 0x000000000101000000e78c28ed0dfe5340569fabadd89f1b40, NULL, NULL, NULL, NULL, 'Toyota', 'Silver', 'Tire', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-11 12:15:58', '2026-07-11 12:17:58', '2026-07-11 12:19:05', '2026-07-11 12:20:15', NULL, NULL, NULL),
(7, 13, 7, 2, 'Battery is not providing current', 'Completed', 'Urgent', 0x0000000001010000001a00008022fe5340f0b5310e00c21b40, '', NULL, NULL, 'uploads/serviceRequests/req_6a5259b07efbd.jpeg', 'BMW', 'Black', 'Battery', 1, 'Roshan Dissanayake', '0716238638', 'Tata', 'Yellow', 'WP NA-7777', 26, '2026-07-11 14:56:48', '2026-07-11 14:59:58', '2026-07-11 15:00:21', '2026-07-11 16:32:48', NULL, NULL, NULL);

-- Seeding review
INSERT INTO `review` (`id`, `customer_id`, `shop_id`, `service_request_id`, `rating`, `comment`, `created_at`) VALUES
(1, 11, 1, 1, 5, 'Absolutely outstanding service! They identified the rattling noise within minutes — turned out to be a loose heat shield. Fixed quickly and at a very fair price. Will definitely return.', '2026-06-15 08:30:00'),
(2, 12, 4, 2, 4, 'Very professional team and the service centre is clean and well-organised. Brake replacement was done perfectly. Slightly longer wait than expected but overall a great experience.', '2026-06-20 11:30:00'),
(3, 13, 7, 3, 5, 'The tow truck arrived in under 25 minutes to Rajagiriya which I was amazed by. Engine diagnosis was thorough and the repair was completed the same day. Highly recommended for emergencies!', '2026-06-25 10:30:00'),
(4, 11, 2, 4, 4, 'Good service and friendly staff. Oil change and tyre rotation done well within the appointment time. Pricing is reasonable. The waiting area could be improved but minor complaint.', '2026-07-01 05:30:00'),
(5, 13, 7, 6, 5, 'Exceptional service. Very responsible people.', '2026-07-11 12:21:08'),
(6, 13, 7, 7, 3, 'Average Service', '2026-07-11 16:33:08');

-- Seeding shopinvoice
INSERT INTO `shopinvoice` (`id`, `shopId`, `billingPeriodYear`, `billingPeriodMonth`, `shopCategoryId`, `rateSnapshot`, `completedRequests`, `totalAmount`, `invoiceReference`, `invoiceStatus`, `dispatchedAt`, `dueDate`, `paymentSlipUrl`, `paymentReference`, `slipSubmittedAt`, `verifiedAt`, `verifiedByAdminId`, `rejectionReason`, `createdAt`, `updatedAt`) VALUES
(64, 1, 2026, 5, 1, 500.00, 12, 6000.00, 'INV-202605-1-AAAA', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(65, 2, 2026, 5, 1, 500.00, 8, 4000.00, 'INV-202605-2-BBBB', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(66, 3, 2026, 5, 3, 3000.00, 0, 3000.00, 'INV-202605-3-CCCC', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(67, 4, 2026, 5, 2, 400.00, 15, 6000.00, 'INV-202605-4-DDDD', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(68, 5, 2026, 5, 1, 500.00, 5, 2500.00, 'INV-202605-5-EEEE', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(69, 6, 2026, 5, 1, 500.00, 18, 9000.00, 'INV-202605-6-FFFF', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(70, 7, 2026, 5, 1, 500.00, 4, 2000.00, 'INV-202605-7-GGGG', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(71, 8, 2026, 5, 2, 400.00, 20, 8000.00, 'INV-202605-8-HHHH', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(72, 9, 2026, 5, 3, 3000.00, 0, 3000.00, 'INV-202605-9-IIII', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(73, 10, 2026, 5, 1, 500.00, 10, 5000.00, 'INV-202605-10-JJJJ', 'Paid', '2026-06-01 04:30:00', '2026-06-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-01 04:30:00', '2026-08-02 04:07:30'),
(75, 1, 2026, 6, 1, 500.00, 14, 7000.00, 'INV-202606-1-LLLL', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(76, 2, 2026, 6, 1, 500.00, 6, 3000.00, 'INV-202606-2-MMMM', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(77, 3, 2026, 6, 3, 3000.00, 0, 3000.00, 'INV-202606-3-NNNN', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(78, 4, 2026, 6, 2, 400.00, 22, 8800.00, 'INV-202606-4-OOOO', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(79, 5, 2026, 6, 1, 500.00, 8, 4000.00, 'INV-202606-5-PPPP', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(80, 6, 2026, 6, 1, 500.00, 11, 5500.00, 'INV-202606-6-QQQQ', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(81, 7, 2026, 6, 1, 500.00, 9, 4500.00, 'INV-202606-7-RRRR', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(82, 8, 2026, 6, 2, 400.00, 14, 5600.00, 'INV-202606-8-SSSS', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(83, 9, 2026, 6, 3, 3000.00, 0, 3000.00, 'INV-202606-9-TTTT', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(84, 10, 2026, 6, 1, 500.00, 12, 6000.00, 'INV-202606-10-UUUU', 'Paid', '2026-07-01 04:30:00', '2026-07-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-01 04:30:00', '2026-08-02 04:07:30'),
(86, 1, 2026, 7, 1, 500.00, 16, 8000.00, 'INV-202607-1-WWWW', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(87, 2, 2026, 7, 1, 500.00, 10, 5000.00, 'INV-202607-2-XXXX', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(88, 3, 2026, 7, 3, 3000.00, 0, 3000.00, 'INV-202607-3-YYYY', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(89, 4, 2026, 7, 2, 400.00, 19, 7600.00, 'INV-202607-4-ZZZZ', 'Dispatched', '2026-08-01 04:30:00', '2026-08-01', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 06:50:02'),
(90, 5, 2026, 7, 1, 500.00, 7, 3500.00, 'INV-202607-5-AAAA1', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(91, 6, 2026, 7, 1, 500.00, 14, 7000.00, 'INV-202607-6-BBBB1', 'Dispatched', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, 'Too late', '2026-08-01 04:30:00', '2026-08-02 06:50:02'),
(92, 7, 2026, 7, 1, 500.00, 0, 0.00, 'INV-202607-7-CCCC1', 'Ignored', '2026-08-01 04:30:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(93, 8, 2026, 7, 2, 400.00, 17, 6800.00, 'INV-202607-8-DDDD1', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(94, 9, 2026, 7, 3, 3000.00, 0, 3000.00, 'INV-202607-9-EEEE1', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(95, 10, 2026, 7, 1, 500.00, 8, 4000.00, 'INV-202607-10-FFFF1', 'Paid', '2026-08-01 04:30:00', '2026-08-15', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-01 04:30:00', '2026-08-02 04:07:30'),
(97, 1, 2026, 8, 1, 500.00, 0, 0.00, 'INV-202608-1-B5C5', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:15', '2026-08-02 09:01:28'),
(98, 2, 2026, 8, 1, 500.00, 0, 0.00, 'INV-202608-2-5D39', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:15', '2026-08-02 09:01:28'),
(99, 3, 2026, 8, 3, 3000.00, 0, 3000.00, 'INV-202608-3-21A9', 'Dispatched', '2026-08-02 09:01:28', '2026-08-16', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:15', '2026-08-02 09:01:28'),
(100, 4, 2026, 8, 2, 400.00, 0, 0.00, 'INV-202608-4-5D7E', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:15', '2026-08-02 09:01:28'),
(101, 5, 2026, 8, 1, 500.00, 0, 0.00, 'INV-202608-5-44D5', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:15', '2026-08-02 09:01:28'),
(102, 6, 2026, 8, 1, 500.00, 0, 0.00, 'INV-202608-6-7B84', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:15', '2026-08-02 09:01:28'),
(103, 7, 2026, 8, 1, 500.00, 0, 0.00, 'INV-202608-7-8A62', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:16', '2026-08-02 09:01:28'),
(104, 8, 2026, 8, 2, 400.00, 0, 0.00, 'INV-202608-8-235A', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:16', '2026-08-02 09:01:28'),
(105, 9, 2026, 8, 3, 3000.00, 0, 3000.00, 'INV-202608-9-1355', 'Dispatched', '2026-08-02 09:01:28', '2026-08-16', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:16', '2026-08-02 09:01:28'),
(106, 10, 2026, 8, 1, 500.00, 0, 0.00, 'INV-202608-10-AADD', 'Ignored', '2026-08-02 09:01:28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-02 09:01:16', '2026-08-02 09:01:28');

-- Seeding notification
INSERT INTO `notification` (`id`, `user_id`, `service_request_id`, `type`, `title`, `message`, `isRead`) VALUES
(1, 7, 6, 'NewRequest', 'New Service Request', NULL, 1),
(2, 13, 6, 'Accepted', 'Request accepted', NULL, 1),
(3, 7, 6, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 1),
(4, 13, 6, 'In Progress', 'Repair status: In Progress', NULL, 1),
(5, 13, 6, 'Completed', 'Repair status: Completed', NULL, 1),
(6, 7, 7, 'NewRequest', 'New Service Request', NULL, 1),
(7, 13, 7, 'Accepted', 'Request accepted', NULL, 1),
(8, 7, 7, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 1),
(9, 13, 7, 'In Progress', 'Repair status: In Progress', NULL, 0),
(10, 13, 7, 'Completed', 'Repair status: Completed', NULL, 0),
(11, 7, 8, 'NewRequest', 'New Service Request', NULL, 1),
(13, 7, 8, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 1),
(16, 7, 9, 'NewRequest', 'New Service Request', NULL, 1),
(18, 7, 9, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 1),
(21, 1, 10, 'NewRequest', 'New Service Request', NULL, 0),
(22, 5, 11, 'NewRequest', 'New Service Request', NULL, 0),
(25, 1, 10, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 0),
(26, 5, 11, 'CustomerCancelled', 'Customer cancelled booking', NULL, 0),
(27, 2, 12, 'NewRequest', 'New Service Request', NULL, 0),
(28, 5, 13, 'NewRequest', 'New Service Request', NULL, 0),
(31, 2, 12, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 0),
(32, 5, 13, 'CustomerCancelled', 'Customer cancelled booking', NULL, 0),
(37, 5, 14, 'NewRequest', 'New Service Request', NULL, 0),
(38, 7, 15, 'NewRequest', 'New Service Request', NULL, 1),
(41, 5, 14, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 0),
(42, 7, 16, 'NewRequest', 'New Service Request', NULL, 1),
(44, 7, 16, 'CustomerCancelled', 'Customer cancelled booking', NULL, 1),
(45, 7, 17, 'NewRequest', 'New Service Request', NULL, 1),
(47, 7, 17, ' CustomerConfirmed', 'Customer confirmed booking', NULL, 1),
(60, 4, 20, 'NewRequest', 'New Service Request', NULL, 0),
(61, 5, 21, 'NewRequest', 'New Service Request', NULL, 0);

