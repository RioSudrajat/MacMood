CREATE TABLE "branches" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"branch_code" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(150) NOT NULL,
	"pin" varchar(10) DEFAULT '1234' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tax_rate" integer DEFAULT 10 NOT NULL,
	"service_charge_rate" integer DEFAULT 0 NOT NULL,
	"qris_merchant_name" varchar(150),
	"qris_nmid" varchar(100),
	"bank_account" varchar(100),
	"bank_name" varchar(100),
	"opened_at" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_branch_code_unique" UNIQUE("branch_code"),
	CONSTRAINT "branches_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "branch_id" varchar(50);--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "branch_name" varchar(150);--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "branch_code" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "branch_id" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "branch_name" varchar(150);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "branch_id" varchar(50);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "branch_name" varchar(150);--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;