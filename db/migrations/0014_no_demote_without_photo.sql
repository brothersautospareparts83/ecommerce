-- 0014: owner decision: parts stay published without a real photo (0012 allows publishing without one).
-- The old trigger still moved a published product to image_required whenever its last non-illustrative image
-- was removed or replaced, which hid products when an AI reference image was swapped. Remove it, and restore
-- the products it demoted.
drop trigger if exists product_images_demote on product_images;
drop function if exists demote_product_without_image();
update products set status = 'published' where status = 'image_required';
