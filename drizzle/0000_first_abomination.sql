DO $$ BEGIN
 CREATE TYPE "public"."consumable_type" AS ENUM('DETERGENT', 'REGULAR_FABCON', 'IMPORTED_FABCON', 'PLASTICS', 'GASUL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."garment_type" AS ENUM('shirt', 'pants', 'dress', 'skirt', 'blouse', 't_shirt', 'jeans', 'shorts', 'sweater', 'jacket', 'coat', 'suit', 'tie', 'scarf', 'socks', 'underwear', 'bedding', 'towel', 'curtain', 'tablecloth', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gasul_refill_status" AS ENUM('ordered', 'delivered', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gasul_tank_status" AS ENUM('full', 'in_use', 'empty', 'reserve', 'returned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."inventory_adjustment_type" AS ENUM('sale', 'return', 'adjustment', 'transfer', 'waste', 'count');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."machine_type" AS ENUM('LG_GIANT', 'LG_TITAN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('pending', 'completed', 'refunded', 'voided');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'gift_card', 'split');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pickup_delivery_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."service_status" AS ENUM('received', 'washing', 'drying', 'folding', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."service_type" AS ENUM('REGULAR', 'DELUXE', 'EXTRA_DRY', 'EXTRA_WASH', 'HAND_WASH');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."shift_status" AS ENUM('open', 'closed', 'discrepancy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'manager', 'cashier');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."wash_cycle" AS ENUM('delicate', 'normal', 'heavy_duty', 'quick_wash', 'wool', 'hand_wash');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consumable_threshold" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"consumable_type" "consumable_type" NOT NULL,
	"minimum_qty" integer NOT NULL,
	"unit" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consumption_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"machine_type" "machine_type" NOT NULL,
	"has_imported_fabcon" boolean DEFAULT false NOT NULL,
	"detergent_ml" integer DEFAULT 80 NOT NULL,
	"regular_fabcon_ml" integer DEFAULT 80 NOT NULL,
	"imported_fabcon_ml" integer DEFAULT 40 NOT NULL,
	"plastics_count" integer DEFAULT 1 NOT NULL,
	"gas_kg" numeric(6, 3) DEFAULT '0.15' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_laundry_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"preferred_wash_cycle_id" uuid,
	"preferred_detergent" varchar(100),
	"preferred_softener" varchar(100),
	"water_temperature" varchar(20),
	"fold_preference" varchar(20) DEFAULT 'standard',
	"hanger_preference" varchar(20) DEFAULT 'wire',
	"special_instructions" text,
	"auto_schedule_pickup" boolean DEFAULT false,
	"pickup_frequency" varchar(20),
	"preferred_pickup_day" integer,
	"preferred_pickup_time" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_laundry_preferences_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"date_of_birth" timestamp with time zone,
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"country" varchar(2) DEFAULT 'US',
	"loyalty_tier" varchar(20) DEFAULT 'bronze',
	"loyalty_points" integer DEFAULT 0,
	"total_spent" integer DEFAULT 0,
	"visit_count" integer DEFAULT 0,
	"last_visit_at" timestamp with time zone,
	"accepts_marketing" boolean DEFAULT false,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(50),
	"zip" varchar(20),
	"contact_phone" varchar(50),
	"contact_name" varchar(100),
	"notes" text,
	"status" "pickup_delivery_status" DEFAULT 'scheduled' NOT NULL,
	"driver_id" uuid,
	"completed_at" timestamp with time zone,
	"proof_of_delivery" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"max_amount" integer,
	"applies_to" varchar(20) DEFAULT 'all',
	"target_ids" jsonb DEFAULT '[]'::jsonb,
	"min_purchase" integer,
	"max_uses" integer,
	"used_count" integer DEFAULT 0,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "garment_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "garment_type" NOT NULL,
	"description" text,
	"base_price" integer NOT NULL,
	"base_weight_grams" integer,
	"requires_special_care" boolean DEFAULT false,
	"care_instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gasul_refills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"tank_id" uuid NOT NULL,
	"supplier_id" uuid,
	"ordered_by" uuid,
	"quantity" integer NOT NULL,
	"price_per_tank" integer NOT NULL,
	"delivery_fee" integer DEFAULT 0,
	"total_amount" integer NOT NULL,
	"status" "gasul_refill_status" DEFAULT 'ordered' NOT NULL,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"received_by" uuid,
	"invoice_number" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gasul_tanks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"brand" varchar(100),
	"capacity_kg" integer NOT NULL,
	"tare_weight_kg" integer,
	"status" "gasul_tank_status" DEFAULT 'full' NOT NULL,
	"current_location" varchar(50) DEFAULT 'onsite',
	"assigned_to" uuid,
	"last_refill_at" timestamp with time zone,
	"next_refill_due" timestamp with time zone,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gasul_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"tank_id" uuid NOT NULL,
	"shift_id" uuid,
	"equipment" varchar(100) NOT NULL,
	"start_weight_kg" numeric(6, 2) NOT NULL,
	"end_weight_kg" numeric(6, 2),
	"consumed_kg" numeric(6, 2),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"recorded_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer,
	"reorder_quantity" integer,
	"last_counted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventory_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"type" "inventory_adjustment_type" NOT NULL,
	"quantity" integer NOT NULL,
	"previous_quantity" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"reason" text,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laundry_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"laundry_order_id" uuid NOT NULL,
	"garment_type_id" uuid,
	"wash_cycle_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"weight_grams" integer,
	"price" integer NOT NULL,
	"status" "service_status" DEFAULT 'received' NOT NULL,
	"stain_treatment" boolean DEFAULT false,
	"special_care" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laundry_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"pickup_schedule_id" uuid,
	"delivery_schedule_id" uuid,
	"status" "service_status" DEFAULT 'received' NOT NULL,
	"total_weight_kg" numeric(6, 2),
	"total_items" integer DEFAULT 0,
	"bag_count" integer DEFAULT 1,
	"special_instructions" text,
	"received_at" timestamp with time zone,
	"wash_started_at" timestamp with time zone,
	"dry_started_at" timestamp with time zone,
	"fold_started_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "laundry_orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"country" varchar(2) DEFAULT 'US',
	"timezone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"discount_amount" integer DEFAULT 0,
	"tax_amount" integer NOT NULL,
	"total" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"register_id" uuid,
	"customer_id" uuid,
	"cashier_id" uuid,
	"order_number" varchar(50) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal" integer NOT NULL,
	"discount_amount" integer DEFAULT 0,
	"tax_amount" integer NOT NULL,
	"total" integer NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"completed_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"country" varchar(2) DEFAULT 'PH',
	"timezone" varchar(50) DEFAULT 'Asia/Manila',
	"currency" varchar(3) DEFAULT 'PHP',
	"tax_rate" numeric(5, 4) DEFAULT '0.12',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"data_mode" varchar(10) DEFAULT 'demo',
	"demo_data_erased_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" integer NOT NULL,
	"card_brand" varchar(50),
	"card_last4" varchar(4),
	"auth_code" varchar(100),
	"transaction_id" varchar(255),
	"cash_received" integer,
	"change_given" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pickup_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(50),
	"zip" varchar(20),
	"contact_phone" varchar(50),
	"contact_name" varchar(100),
	"notes" text,
	"status" "pickup_delivery_status" DEFAULT 'scheduled' NOT NULL,
	"driver_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"price" integer,
	"cost" integer,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"low_stock_threshold" integer DEFAULT 10,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sku" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"type" varchar(20) DEFAULT 'physical' NOT NULL,
	"price" integer NOT NULL,
	"cost" integer DEFAULT 0,
	"tax_rate" numeric(5, 4),
	"track_inventory" boolean DEFAULT true NOT NULL,
	"allow_negative_stock" boolean DEFAULT false NOT NULL,
	"low_stock_threshold" integer DEFAULT 10,
	"images" jsonb DEFAULT '[]'::jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"receipt_number" varchar(50) NOT NULL,
	"type" varchar(20) DEFAULT 'sale' NOT NULL,
	"content" jsonb NOT NULL,
	"printed_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"device_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registers_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"register_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"shift_number" varchar(50) NOT NULL,
	"status" "shift_status" DEFAULT 'open' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"expected_cash" integer DEFAULT 0,
	"actual_cash" integer DEFAULT 0,
	"cash_sales" integer DEFAULT 0,
	"card_sales" integer DEFAULT 0,
	"gift_card_sales" integer DEFAULT 0,
	"total_sales" integer DEFAULT 0,
	"transaction_count" integer DEFAULT 0,
	"refund_count" integer DEFAULT 0,
	"refund_amount" integer DEFAULT 0,
	"opening_notes" text,
	"closing_notes" text,
	"discrepancy_amount" integer DEFAULT 0,
	"discrepancy_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "user_role" DEFAULT 'cashier' NOT NULL,
	"avatar_url" varchar(500),
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wash_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"cycle_type" "wash_cycle" NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"temperature_celsius" integer,
	"spin_speed_rpm" integer,
	"price_modifier" numeric(5, 2) DEFAULT '1.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumable_threshold" ADD CONSTRAINT "consumable_threshold_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumption_rule" ADD CONSTRAINT "consumption_rule_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_laundry_preferences" ADD CONSTRAINT "customer_laundry_preferences_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_laundry_preferences" ADD CONSTRAINT "customer_laundry_preferences_preferred_wash_cycle_id_wash_cycles_id_fk" FOREIGN KEY ("preferred_wash_cycle_id") REFERENCES "public"."wash_cycles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_schedules" ADD CONSTRAINT "delivery_schedules_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discounts" ADD CONSTRAINT "discounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "garment_types" ADD CONSTRAINT "garment_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_refills" ADD CONSTRAINT "gasul_refills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_refills" ADD CONSTRAINT "gasul_refills_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_refills" ADD CONSTRAINT "gasul_refills_tank_id_gasul_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."gasul_tanks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_refills" ADD CONSTRAINT "gasul_refills_supplier_id_users_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_refills" ADD CONSTRAINT "gasul_refills_ordered_by_users_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_refills" ADD CONSTRAINT "gasul_refills_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_tanks" ADD CONSTRAINT "gasul_tanks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_tanks" ADD CONSTRAINT "gasul_tanks_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_tanks" ADD CONSTRAINT "gasul_tanks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_usage" ADD CONSTRAINT "gasul_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_usage" ADD CONSTRAINT "gasul_usage_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_usage" ADD CONSTRAINT "gasul_usage_tank_id_gasul_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."gasul_tanks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_usage" ADD CONSTRAINT "gasul_usage_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gasul_usage" ADD CONSTRAINT "gasul_usage_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_order_items" ADD CONSTRAINT "laundry_order_items_laundry_order_id_laundry_orders_id_fk" FOREIGN KEY ("laundry_order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_order_items" ADD CONSTRAINT "laundry_order_items_garment_type_id_garment_types_id_fk" FOREIGN KEY ("garment_type_id") REFERENCES "public"."garment_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_order_items" ADD CONSTRAINT "laundry_order_items_wash_cycle_id_wash_cycles_id_fk" FOREIGN KEY ("wash_cycle_id") REFERENCES "public"."wash_cycles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_pickup_schedule_id_pickup_schedules_id_fk" FOREIGN KEY ("pickup_schedule_id") REFERENCES "public"."pickup_schedules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_delivery_schedule_id_delivery_schedules_id_fk" FOREIGN KEY ("delivery_schedule_id") REFERENCES "public"."delivery_schedules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_register_id_registers_id_fk" FOREIGN KEY ("register_id") REFERENCES "public"."registers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registers" ADD CONSTRAINT "registers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_register_id_registers_id_fk" FOREIGN KEY ("register_id") REFERENCES "public"."registers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wash_cycles" ADD CONSTRAINT "wash_cycles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_org_idx" ON "audit_logs" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_org_idx" ON "categories" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consumable_threshold_unique" ON "consumable_threshold" ("location_id","consumable_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consumable_threshold_location_idx" ON "consumable_threshold" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "consumption_rule_unique" ON "consumption_rule" ("location_id","service_type","machine_type","has_imported_fabcon");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consumption_rule_location_idx" ON "consumption_rule" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_laundry_prefs_customer_idx" ON "customer_laundry_preferences" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_org_idx" ON "customers" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers" ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_schedules_org_idx" ON "delivery_schedules" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_schedules_location_idx" ON "delivery_schedules" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_schedules_customer_idx" ON "delivery_schedules" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_schedules_status_idx" ON "delivery_schedules" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_schedules_scheduled_idx" ON "delivery_schedules" ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discounts_org_idx" ON "discounts" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "garment_types_org_idx" ON "garment_types" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "garment_types_type_idx" ON "garment_types" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_refills_org_idx" ON "gasul_refills" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_refills_location_idx" ON "gasul_refills" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_refills_tank_idx" ON "gasul_refills" ("tank_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_refills_status_idx" ON "gasul_refills" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_refills_ordered_idx" ON "gasul_refills" ("ordered_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_tanks_org_idx" ON "gasul_tanks" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_tanks_location_idx" ON "gasul_tanks" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gasul_tanks_serial_unique" ON "gasul_tanks" ("serial_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_tanks_status_idx" ON "gasul_tanks" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_usage_org_idx" ON "gasul_usage" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_usage_location_idx" ON "gasul_usage" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_usage_tank_idx" ON "gasul_usage" ("tank_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_usage_shift_idx" ON "gasul_usage" ("shift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gasul_usage_started_idx" ON "gasul_usage" ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_location_idx" ON "inventory" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_product_idx" ON "inventory" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventory_variant_idx" ON "inventory" ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_location_product_unique" ON "inventory" ("location_id","product_id","variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "adjustments_location_idx" ON "inventory_adjustments" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "adjustments_product_idx" ON "inventory_adjustments" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "adjustments_created_idx" ON "inventory_adjustments" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_order_items_order_idx" ON "laundry_order_items" ("laundry_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_order_items_garment_idx" ON "laundry_order_items" ("garment_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_org_idx" ON "laundry_orders" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_location_idx" ON "laundry_orders" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_order_idx" ON "laundry_orders" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_customer_idx" ON "laundry_orders" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_status_idx" ON "laundry_orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_pickup_idx" ON "laundry_orders" ("pickup_schedule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laundry_orders_delivery_idx" ON "laundry_orders" ("delivery_schedule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_org_idx" ON "locations" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "locations_code_unique" ON "locations" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_items_product_idx" ON "order_items" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_org_idx" ON "orders" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_location_idx" ON "orders" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_register_idx" ON "orders" ("register_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_number_unique" ON "orders" ("order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_order_idx" ON "payments" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_schedules_org_idx" ON "pickup_schedules" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_schedules_location_idx" ON "pickup_schedules" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_schedules_customer_idx" ON "pickup_schedules" ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_schedules_status_idx" ON "pickup_schedules" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pickup_schedules_scheduled_idx" ON "pickup_schedules" ("scheduled_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_product_idx" ON "product_variants" ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "variants_sku_unique" ON "product_variants" ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_org_idx" ON "products" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_unique" ON "products" ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_barcode_idx" ON "products" ("barcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "receipts_order_idx" ON "receipts" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "receipts_number_unique" ON "receipts" ("receipt_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "registers_location_idx" ON "registers" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "registers_device_id_unique" ON "registers" ("device_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_location_idx" ON "shifts" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_register_idx" ON "shifts" ("register_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_cashier_idx" ON "shifts" ("cashier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_status_idx" ON "shifts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shifts_opened_idx" ON "shifts" ("opened_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_org_idx" ON "users" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wash_cycles_org_idx" ON "wash_cycles" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wash_cycles_type_idx" ON "wash_cycles" ("cycle_type");