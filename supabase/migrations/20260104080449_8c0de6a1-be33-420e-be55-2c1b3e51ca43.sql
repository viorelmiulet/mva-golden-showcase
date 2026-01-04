-- Add column to track reminder emails
ALTER TABLE public.rental_bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone DEFAULT NULL;