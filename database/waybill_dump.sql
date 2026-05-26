--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS vehicles_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.processing_jobs DROP CONSTRAINT IF EXISTS processing_jobs_document_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integration_configs DROP CONSTRAINT IF EXISTS integration_configs_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_integration_config_id_fkey;
ALTER TABLE IF EXISTS ONLY public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_document_id_fkey;
ALTER TABLE IF EXISTS ONLY public.drivers DROP CONSTRAINT IF EXISTS drivers_department_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_vehicle_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_driver_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_confirmed_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.document_history DROP CONSTRAINT IF EXISTS document_history_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.document_history DROP CONSTRAINT IF EXISTS document_history_document_id_fkey;
ALTER TABLE IF EXISTS ONLY public.document_fields DROP CONSTRAINT IF EXISTS document_fields_document_id_fkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.anomalies DROP CONSTRAINT IF EXISTS anomalies_validation_rule_id_fkey;
ALTER TABLE IF EXISTS ONLY public.anomalies DROP CONSTRAINT IF EXISTS anomalies_resolved_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.anomalies DROP CONSTRAINT IF EXISTS anomalies_document_id_fkey;
DROP INDEX IF EXISTS public.vehicles_department_id_vehicle_number_key;
DROP INDEX IF EXISTS public.vehicles_department_id_idx;
DROP INDEX IF EXISTS public.validation_rules_code_key;
DROP INDEX IF EXISTS public.users_organization_id_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_department_id_idx;
DROP INDEX IF EXISTS public.processing_jobs_status_idx;
DROP INDEX IF EXISTS public.processing_jobs_document_id_idx;
DROP INDEX IF EXISTS public.organizations_inn_key;
DROP INDEX IF EXISTS public.integration_configs_organization_id_idx;
DROP INDEX IF EXISTS public.export_jobs_status_idx;
DROP INDEX IF EXISTS public.export_jobs_integration_config_id_idx;
DROP INDEX IF EXISTS public.export_jobs_document_id_idx;
DROP INDEX IF EXISTS public.drivers_department_id_personnel_number_key;
DROP INDEX IF EXISTS public.drivers_department_id_license_number_key;
DROP INDEX IF EXISTS public.drivers_department_id_idx;
DROP INDEX IF EXISTS public.documents_vehicle_id_idx;
DROP INDEX IF EXISTS public.documents_uploaded_by_id_idx;
DROP INDEX IF EXISTS public.documents_status_idx;
DROP INDEX IF EXISTS public.documents_ocr_status_idx;
DROP INDEX IF EXISTS public.documents_driver_id_idx;
DROP INDEX IF EXISTS public.document_history_user_id_idx;
DROP INDEX IF EXISTS public.document_history_document_id_idx;
DROP INDEX IF EXISTS public.document_fields_document_id_idx;
DROP INDEX IF EXISTS public.document_fields_document_id_field_key_key;
DROP INDEX IF EXISTS public.departments_organization_id_idx;
DROP INDEX IF EXISTS public.departments_organization_id_code_key;
DROP INDEX IF EXISTS public.audit_logs_user_id_idx;
DROP INDEX IF EXISTS public.audit_logs_entity_type_entity_id_idx;
DROP INDEX IF EXISTS public.anomalies_validation_rule_id_idx;
DROP INDEX IF EXISTS public.anomalies_status_idx;
DROP INDEX IF EXISTS public.anomalies_document_id_idx;
ALTER TABLE IF EXISTS ONLY public.vehicles DROP CONSTRAINT IF EXISTS vehicles_pkey;
ALTER TABLE IF EXISTS ONLY public.validation_rules DROP CONSTRAINT IF EXISTS validation_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.processing_jobs DROP CONSTRAINT IF EXISTS processing_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.organizations DROP CONSTRAINT IF EXISTS organizations_pkey;
ALTER TABLE IF EXISTS ONLY public.integration_configs DROP CONSTRAINT IF EXISTS integration_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.drivers DROP CONSTRAINT IF EXISTS drivers_pkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
ALTER TABLE IF EXISTS ONLY public.document_history DROP CONSTRAINT IF EXISTS document_history_pkey;
ALTER TABLE IF EXISTS ONLY public.document_fields DROP CONSTRAINT IF EXISTS document_fields_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.anomalies DROP CONSTRAINT IF EXISTS anomalies_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.vehicles;
DROP TABLE IF EXISTS public.validation_rules;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.processing_jobs;
DROP TABLE IF EXISTS public.organizations;
DROP TABLE IF EXISTS public.integration_configs;
DROP TABLE IF EXISTS public.export_jobs;
DROP TABLE IF EXISTS public.drivers;
DROP TABLE IF EXISTS public.documents;
DROP TABLE IF EXISTS public.document_history;
DROP TABLE IF EXISTS public.document_fields;
DROP TABLE IF EXISTS public.departments;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.anomalies;
DROP TABLE IF EXISTS public._prisma_migrations;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: anomalies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anomalies (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    validation_rule_id uuid,
    type character varying(128) NOT NULL,
    severity character varying(32) NOT NULL,
    field_key character varying(128),
    message text NOT NULL,
    expected_value text,
    actual_value text,
    status character varying(64) DEFAULT 'open'::character varying NOT NULL,
    resolved_by_id uuid,
    resolved_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    entity_type character varying(128) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(128) NOT NULL,
    payload jsonb,
    ip_address character varying(64),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(64) NOT NULL,
    address character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: document_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_fields (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    field_key character varying(128) NOT NULL,
    field_label character varying(255) NOT NULL,
    recognized_value text,
    corrected_value text,
    confidence numeric(5,4),
    is_edited boolean DEFAULT false NOT NULL,
    bbox jsonb,
    source character varying(64),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: document_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_history (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying(128) NOT NULL,
    field_key character varying(128),
    old_value text,
    new_value text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid NOT NULL,
    uploaded_by_id uuid NOT NULL,
    driver_id uuid,
    vehicle_id uuid,
    document_number character varying(64),
    trip_date date,
    original_file_url character varying(1024) NOT NULL,
    original_file_name character varying(255) NOT NULL,
    file_mime_type character varying(128) NOT NULL,
    file_size integer NOT NULL,
    status character varying(64) DEFAULT 'uploaded'::character varying NOT NULL,
    ocr_status character varying(64) DEFAULT 'pending'::character varying NOT NULL,
    ocr_confidence numeric(5,4),
    has_anomalies boolean DEFAULT false NOT NULL,
    confirmed_at timestamp(6) without time zone,
    confirmed_by_id uuid,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drivers (
    id uuid NOT NULL,
    department_id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    personnel_number character varying(64) NOT NULL,
    license_number character varying(64) NOT NULL,
    phone character varying(32),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: export_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.export_jobs (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    integration_config_id uuid,
    export_format character varying(64) NOT NULL,
    status character varying(64) DEFAULT 'queued'::character varying NOT NULL,
    file_url character varying(1024),
    error_message text,
    exported_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: integration_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_configs (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    integration_type character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(64) DEFAULT 'active'::character varying NOT NULL,
    settings jsonb,
    last_sync_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    inn character varying(12) NOT NULL,
    kpp character varying(9),
    legal_address character varying(500),
    status character varying(32) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: processing_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.processing_jobs (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    job_type character varying(64) NOT NULL,
    status character varying(64) DEFAULT 'queued'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    error_message text,
    started_at timestamp(6) without time zone,
    finished_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    department_id uuid,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(64) DEFAULT 'operator'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: validation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validation_rules (
    id uuid NOT NULL,
    code character varying(128) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    is_enabled boolean DEFAULT true NOT NULL,
    params jsonb,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid NOT NULL,
    department_id uuid NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    brand character varying(128) NOT NULL,
    model character varying(128) NOT NULL,
    vehicle_type character varying(64) NOT NULL,
    fuel_rate_per_100km numeric(6,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
df7ff095-d84c-4b17-bd3b-f80a183e3fa1	247e5467998f4292c9534a093c54b0209ab6b16ec54b0921244c9ed0548183b5	2026-05-25 16:06:26.078618+05	20260525110625_init_waybill_schema	\N	\N	2026-05-25 16:06:25.662396+05	1
\.


--
-- Data for Name: anomalies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.anomalies (id, document_id, validation_rule_id, type, severity, field_key, message, expected_value, actual_value, status, resolved_by_id, resolved_at, created_at, updated_at) FROM stdin;
aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1	88888888-8888-4888-8888-888888888889	66666666-6666-4666-8666-666666666666	logic_error	high	odometer_end	Конечный одометр меньше начального.	>= 88100	87980	open	\N	\N	2026-05-25 16:06:33.587987	2026-05-25 16:06:33.587987
aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2	88888888-8888-4888-8888-888888888889	66666666-6666-4666-8666-666666666667	fuel_overrun	medium	fuel_used_liters	Расход топлива выше нормы для указанного автомобиля.	<= 40.32	96	open	\N	\N	2026-05-25 16:06:33.587987	2026-05-25 16:06:33.587987
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, entity_type, entity_id, action, payload, ip_address, created_at) FROM stdin;
eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1	33333333-3333-4333-8333-333333333333	document	88888888-8888-4888-8888-888888888888	confirm	{"source": "seed"}	127.0.0.1	2026-05-25 16:06:33.599996
eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2	33333333-3333-4333-8333-333333333334	document	88888888-8888-4888-8888-888888888889	validate	{"source": "seed"}	127.0.0.1	2026-05-25 16:06:33.599996
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, organization_id, name, code, address, is_active, created_at, updated_at) FROM stdin;
22222222-2222-4222-8222-222222222222	11111111-1111-4111-8111-111111111111	Автоколонна 1	AUTO-1	Москва, ул. Складская, д. 4	t	2026-05-25 16:06:33.555792	2026-05-25 16:06:33.555792
22222222-2222-4222-8222-222222222223	11111111-1111-4111-8111-111111111111	Сервисная служба	SERVICE	Москва, ул. Ремонтная, д. 8	t	2026-05-25 16:06:33.555792	2026-05-25 16:06:33.555792
\.


--
-- Data for Name: document_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_fields (id, document_id, field_key, field_label, recognized_value, corrected_value, confidence, is_edited, bbox, source, created_at, updated_at) FROM stdin;
99999999-9999-4999-8999-999999999901	88888888-8888-4888-8888-888888888888	odometer_start	Одометр на выезде	124500	124500	0.9512	f	{"h": 42, "w": 180, "x": 120, "y": 340}	mock_ocr	2026-05-25 16:06:33.585028	2026-05-25 16:06:33.585028
99999999-9999-4999-8999-999999999902	88888888-8888-4888-8888-888888888888	odometer_end	Одометр на возврате	124682	124682	0.9401	f	{"h": 42, "w": 180, "x": 320, "y": 340}	mock_ocr	2026-05-25 16:06:33.585028	2026-05-25 16:06:33.585028
99999999-9999-4999-8999-999999999903	88888888-8888-4888-8888-888888888888	fuel_used_liters	Израсходовано топлива, л	24.7	24.7	0.9020	f	{"h": 38, "w": 120, "x": 510, "y": 420}	mock_ocr	2026-05-25 16:06:33.585028	2026-05-25 16:06:33.585028
99999999-9999-4999-8999-999999999904	88888888-8888-4888-8888-888888888889	odometer_start	Одометр на выезде	88100	88100	0.8725	f	{"h": 42, "w": 180, "x": 120, "y": 340}	mock_ocr	2026-05-25 16:06:33.585028	2026-05-25 16:06:33.585028
99999999-9999-4999-8999-999999999905	88888888-8888-4888-8888-888888888889	odometer_end	Одометр на возврате	87980	87980	0.8220	f	{"h": 42, "w": 180, "x": 320, "y": 340}	mock_ocr	2026-05-25 16:06:33.585028	2026-05-25 16:06:33.585028
99999999-9999-4999-8999-999999999906	88888888-8888-4888-8888-888888888889	fuel_used_liters	Израсходовано топлива, л	96	96	0.7815	f	{"h": 38, "w": 120, "x": 510, "y": 420}	mock_ocr	2026-05-25 16:06:33.585028	2026-05-25 16:06:33.585028
\.


--
-- Data for Name: document_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_history (id, document_id, user_id, action, field_key, old_value, new_value, created_at) FROM stdin;
dddddddd-dddd-4ddd-8ddd-ddddddddddd1	88888888-8888-4888-8888-888888888888	33333333-3333-4333-8333-333333333333	confirm	\N	\N	confirmed	2026-05-25 16:06:33.59756
dddddddd-dddd-4ddd-8ddd-ddddddddddd2	88888888-8888-4888-8888-888888888889	33333333-3333-4333-8333-333333333334	run_validation	\N	\N	2 anomalies found	2026-05-25 16:06:33.59756
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, uploaded_by_id, driver_id, vehicle_id, document_number, trip_date, original_file_url, original_file_name, file_mime_type, file_size, status, ocr_status, ocr_confidence, has_anomalies, confirmed_at, confirmed_by_id, created_at, updated_at) FROM stdin;
88888888-8888-4888-8888-888888888888	33333333-3333-4333-8333-333333333333	44444444-4444-4444-8444-444444444444	55555555-5555-4555-8555-555555555555	PL-2026-0001	2026-05-20	/uploads/waybill-0001.jpg	waybill-0001.jpg	image/jpeg	1845220	confirmed	completed	0.9325	f	2026-05-25 16:06:33.577981	33333333-3333-4333-8333-333333333333	2026-05-25 16:06:33.577981	2026-05-25 16:06:33.577981
88888888-8888-4888-8888-888888888889	33333333-3333-4333-8333-333333333334	44444444-4444-4444-8444-444444444445	55555555-5555-4555-8555-555555555556	PL-2026-0002	2026-05-21	/uploads/waybill-0002.jpg	waybill-0002.jpg	image/jpeg	2103400	review	completed	0.8842	t	\N	\N	2026-05-25 16:06:33.577981	2026-05-25 16:06:33.577981
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drivers (id, department_id, full_name, personnel_number, license_number, phone, is_active, created_at, updated_at) FROM stdin;
44444444-4444-4444-8444-444444444444	22222222-2222-4222-8222-222222222222	Иванов Сергей Петрович	DRV-001	77 12 345678	+7 900 111-22-33	t	2026-05-25 16:06:33.56299	2026-05-25 16:06:33.56299
44444444-4444-4444-8444-444444444445	22222222-2222-4222-8222-222222222222	Петров Михаил Андреевич	DRV-002	77 98 765432	+7 900 444-55-66	t	2026-05-25 16:06:33.56299	2026-05-25 16:06:33.56299
\.


--
-- Data for Name: export_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.export_jobs (id, document_id, integration_config_id, export_format, status, file_url, error_message, exported_at, created_at, updated_at) FROM stdin;
cccccccc-cccc-4ccc-8ccc-ccccccccccc1	88888888-8888-4888-8888-888888888888	77777777-7777-4777-8777-777777777777	json	completed	/exports/PL-2026-0001.json	\N	2026-05-25 16:06:33.595043	2026-05-25 16:06:33.595043	2026-05-25 16:06:33.595043
\.


--
-- Data for Name: integration_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_configs (id, organization_id, integration_type, name, status, settings, last_sync_at, created_at, updated_at) FROM stdin;
77777777-7777-4777-8777-777777777777	11111111-1111-4111-8111-111111111111	json_export	Выгрузка JSON для бухгалтерии	active	{"format": "waybill.v1", "target": "local_file"}	\N	2026-05-25 16:06:33.575991	2026-05-25 16:06:33.575991
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, inn, kpp, legal_address, status, created_at, updated_at) FROM stdin;
11111111-1111-4111-8111-111111111111	ООО "Гравитино Логистика"	7701234567	770101001	Москва, ул. Транспортная, д. 12	active	2026-05-25 16:06:33.544577	2026-05-25 16:06:33.544577
\.


--
-- Data for Name: processing_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.processing_jobs (id, document_id, job_type, status, progress, error_message, started_at, finished_at, created_at, updated_at) FROM stdin;
bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1	88888888-8888-4888-8888-888888888888	mock_ocr	completed	100	\N	2026-05-25 15:58:33.591112	2026-05-25 15:59:33.591112	2026-05-25 16:06:33.591112	2026-05-25 16:06:33.591112
bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2	88888888-8888-4888-8888-888888888889	validation	completed	100	\N	2026-05-25 16:01:33.591112	2026-05-25 16:02:33.591112	2026-05-25 16:06:33.591112	2026-05-25 16:06:33.591112
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, organization_id, department_id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at) FROM stdin;
33333333-3333-4333-8333-333333333333	11111111-1111-4111-8111-111111111111	22222222-2222-4222-8222-222222222222	admin@gravitino.local	$2b$10$IQYp2djOXlsDnrLatFvJOOSppypB65mSIKfXtVjBqDWnRmkKPgNKK	Андрей Лах	admin	t	2026-05-25 16:06:33.560041	2026-05-25 16:06:33.560041	2026-05-25 16:06:33.560041
33333333-3333-4333-8333-333333333334	11111111-1111-4111-8111-111111111111	22222222-2222-4222-8222-222222222222	operator@gravitino.local	$2b$10$IQYp2djOXlsDnrLatFvJOOSppypB65mSIKfXtVjBqDWnRmkKPgNKK	Оператор архива	operator	t	\N	2026-05-25 16:06:33.560041	2026-05-25 16:06:33.560041
\.


--
-- Data for Name: validation_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.validation_rules (id, code, title, description, is_enabled, params, created_at, updated_at) FROM stdin;
66666666-6666-4666-8666-666666666666	MILEAGE_NON_NEGATIVE	Пробег не может быть отрицательным	Проверяет, что конечный одометр больше начального.	t	{"min_delta": 0}	2026-05-25 16:06:33.571224	2026-05-25 16:06:33.571224
66666666-6666-4666-8666-666666666667	FUEL_RATE_LIMIT	Расход топлива в допустимых границах	Сравнивает фактический расход с нормативом автомобиля.	t	{"max_overrun_percent": 20}	2026-05-25 16:06:33.571224	2026-05-25 16:06:33.571224
66666666-6666-4666-8666-666666666668	REQUIRED_FIELDS	Обязательные поля заполнены	Проверяет наличие номера документа, даты, водителя и автомобиля.	t	{"fields": ["document_number", "trip_date", "driver", "vehicle"]}	2026-05-25 16:06:33.571224	2026-05-25 16:06:33.571224
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, department_id, vehicle_number, brand, model, vehicle_type, fuel_rate_per_100km, is_active, created_at, updated_at) FROM stdin;
55555555-5555-4555-8555-555555555555	22222222-2222-4222-8222-222222222222	А123ВС799	ГАЗ	ГАЗель Next	light_truck	13.50	t	2026-05-25 16:06:33.565526	2026-05-25 16:06:33.565526
55555555-5555-4555-8555-555555555556	22222222-2222-4222-8222-222222222222	М456ОР799	КАМАЗ	5490	truck	28.00	t	2026-05-25 16:06:33.565526	2026-05-25 16:06:33.565526
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: anomalies anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: document_fields document_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_fields
    ADD CONSTRAINT document_fields_pkey PRIMARY KEY (id);


--
-- Name: document_history document_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: export_jobs export_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_pkey PRIMARY KEY (id);


--
-- Name: integration_configs integration_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_configs
    ADD CONSTRAINT integration_configs_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: processing_jobs processing_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: validation_rules validation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validation_rules
    ADD CONSTRAINT validation_rules_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: anomalies_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anomalies_document_id_idx ON public.anomalies USING btree (document_id);


--
-- Name: anomalies_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anomalies_status_idx ON public.anomalies USING btree (status);


--
-- Name: anomalies_validation_rule_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anomalies_validation_rule_id_idx ON public.anomalies USING btree (validation_rule_id);


--
-- Name: audit_logs_entity_type_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entity_type_entity_id_idx ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: departments_organization_id_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_organization_id_code_key ON public.departments USING btree (organization_id, code);


--
-- Name: departments_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX departments_organization_id_idx ON public.departments USING btree (organization_id);


--
-- Name: document_fields_document_id_field_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX document_fields_document_id_field_key_key ON public.document_fields USING btree (document_id, field_key);


--
-- Name: document_fields_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_fields_document_id_idx ON public.document_fields USING btree (document_id);


--
-- Name: document_history_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_history_document_id_idx ON public.document_history USING btree (document_id);


--
-- Name: document_history_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_history_user_id_idx ON public.document_history USING btree (user_id);


--
-- Name: documents_driver_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_driver_id_idx ON public.documents USING btree (driver_id);


--
-- Name: documents_ocr_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_ocr_status_idx ON public.documents USING btree (ocr_status);


--
-- Name: documents_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_status_idx ON public.documents USING btree (status);


--
-- Name: documents_uploaded_by_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_uploaded_by_id_idx ON public.documents USING btree (uploaded_by_id);


--
-- Name: documents_vehicle_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_vehicle_id_idx ON public.documents USING btree (vehicle_id);


--
-- Name: drivers_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX drivers_department_id_idx ON public.drivers USING btree (department_id);


--
-- Name: drivers_department_id_license_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX drivers_department_id_license_number_key ON public.drivers USING btree (department_id, license_number);


--
-- Name: drivers_department_id_personnel_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX drivers_department_id_personnel_number_key ON public.drivers USING btree (department_id, personnel_number);


--
-- Name: export_jobs_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX export_jobs_document_id_idx ON public.export_jobs USING btree (document_id);


--
-- Name: export_jobs_integration_config_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX export_jobs_integration_config_id_idx ON public.export_jobs USING btree (integration_config_id);


--
-- Name: export_jobs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX export_jobs_status_idx ON public.export_jobs USING btree (status);


--
-- Name: integration_configs_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integration_configs_organization_id_idx ON public.integration_configs USING btree (organization_id);


--
-- Name: organizations_inn_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_inn_key ON public.organizations USING btree (inn);


--
-- Name: processing_jobs_document_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX processing_jobs_document_id_idx ON public.processing_jobs USING btree (document_id);


--
-- Name: processing_jobs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX processing_jobs_status_idx ON public.processing_jobs USING btree (status);


--
-- Name: users_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_department_id_idx ON public.users USING btree (department_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_organization_id_idx ON public.users USING btree (organization_id);


--
-- Name: validation_rules_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX validation_rules_code_key ON public.validation_rules USING btree (code);


--
-- Name: vehicles_department_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vehicles_department_id_idx ON public.vehicles USING btree (department_id);


--
-- Name: vehicles_department_id_vehicle_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX vehicles_department_id_vehicle_number_key ON public.vehicles USING btree (department_id, vehicle_number);


--
-- Name: anomalies anomalies_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: anomalies anomalies_resolved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_resolved_by_id_fkey FOREIGN KEY (resolved_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: anomalies anomalies_validation_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_validation_rule_id_fkey FOREIGN KEY (validation_rule_id) REFERENCES public.validation_rules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_fields document_fields_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_fields
    ADD CONSTRAINT document_fields_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_history document_history_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_history document_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: documents documents_confirmed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_confirmed_by_id_fkey FOREIGN KEY (confirmed_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: documents documents_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: drivers drivers_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: export_jobs export_jobs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: export_jobs export_jobs_integration_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_integration_config_id_fkey FOREIGN KEY (integration_config_id) REFERENCES public.integration_configs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: integration_configs integration_configs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_configs
    ADD CONSTRAINT integration_configs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: processing_jobs processing_jobs_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processing_jobs
    ADD CONSTRAINT processing_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vehicles vehicles_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

