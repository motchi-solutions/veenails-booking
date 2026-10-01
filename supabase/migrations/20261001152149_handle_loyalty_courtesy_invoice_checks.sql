-- Keep real deposits and refunds intact. Only an audited courtesy marker
-- is exempt from the non-positive payment check. Preserve view permissions.
CREATE OR REPLACE VIEW "public"."website_fee_payment_exceptions" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "payment_id",
    "p"."booking_id",
    "b"."booking_reference",
    "p"."payment_type",
    "p"."method",
    "p"."status",
    "p"."amount",
    "p"."paid_at",
    "p"."created_at",
        CASE
            WHEN ("p"."amount" <= (0)::numeric) THEN 'NON_POSITIVE_AMOUNT'::"text"
            WHEN (("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)) THEN 'ELIGIBLE_PAYMENT_MISSING_PAID_AT'::"text"
            WHEN (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)) THEN 'REFUND_MISSING_PAID_AT'::"text"
            ELSE NULL::"text"
        END AS "exception_code"
   FROM ("public"."booking_payments" "p"
     JOIN "public"."bookings" "b" ON (("b"."id" = "p"."booking_id")))
  WHERE (("p"."amount" <= (0)::numeric) OR (("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)) OR (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])) AND ("p"."paid_at" IS NULL)))
  AND NOT COALESCE(("p"."amount" = 0
      AND "p"."payment_type" = 'final_payment'
      AND "p"."method" = 'other'
      AND "p"."status" = 'completed'
      AND "p"."paid_at" IS NOT NULL
      AND "p"."notes" = 'Loyalty courtesy · complimentary appointment'
      AND "b"."status" = 'completed'
      AND EXISTS (
        SELECT 1 FROM public.booking_events e
        WHERE e.booking_id = p.booking_id
          AND e.event_type = 'loyalty_courtesy_applied'
          AND e.actor_type = 'admin'
          AND e.metadata ->> 'adjustment' = 'free'
      )), false);

-- Zero-value markers are not revenue or invoice evidence.
CREATE OR REPLACE VIEW "public"."website_fee_payment_details" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "payment_id",
    "p"."booking_id",
    "b"."booking_reference",
    "p"."paid_at",
    ("date_trunc"('month'::"text", ("p"."paid_at" AT TIME ZONE 'America/Toronto'::"text")))::"date" AS "billing_month",
    "p"."payment_type",
    "p"."method",
    "p"."status",
    "p"."amount" AS "recorded_amount",
        CASE
            WHEN (("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"]))) THEN "p"."amount"
            WHEN (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"]))) THEN (- "p"."amount")
            ELSE (0)::numeric
        END AS "eligible_net_amount",
    3.00 AS "fee_rate_percent"
   FROM ("public"."booking_payments" "p"
     JOIN "public"."bookings" "b" ON (("b"."id" = "p"."booking_id")))
  WHERE (("p"."paid_at" >= '2026-08-01 04:00:00+00'::timestamp with time zone) AND ((("p"."payment_type" = ANY (ARRAY['deposit'::"public"."payment_type", 'final_payment'::"public"."payment_type"])) AND ("p"."status" = ANY (ARRAY['received'::"public"."payment_status", 'completed'::"public"."payment_status"]))) OR (("p"."payment_type" = 'refund'::"public"."payment_type") AND ("p"."status" = ANY (ARRAY['refunded'::"public"."payment_status", 'completed'::"public"."payment_status"])))))
  AND "p"."amount" > 0;
