-- Seed 4 specific shops as verified, ensuring we have at least one from each category
-- ID 7: Malabe Speed Auto Center (Garages)
-- ID 1: Colombo Auto Works (Garages)
-- ID 4: Mount Lavinia Auto Service (Service Centers)
-- ID 3: Lanka Spare Parts Hub (Spare Parts)

UPDATE `shop` 
SET 
    `is_verified` = 1,
    `verification_document` = 'uploads/verification/dummy_seed_doc.pdf'
WHERE `id` IN (1, 3, 4, 7);
