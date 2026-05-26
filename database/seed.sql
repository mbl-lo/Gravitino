INSERT INTO organizations (id, name, inn, kpp, legal_address, status, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'ООО "Гравитино Логистика"', '7701234567', '770101001', 'Москва, ул. Транспортная, д. 12', 'active', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  inn = EXCLUDED.inn,
  kpp = EXCLUDED.kpp,
  legal_address = EXCLUDED.legal_address,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO departments (id, organization_id, name, code, address, is_active, created_at, updated_at)
VALUES
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Автоколонна 1', 'AUTO-1', 'Москва, ул. Складская, д. 4', true, now(), now()),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111111', 'Сервисная служба', 'SERVICE', 'Москва, ул. Ремонтная, д. 8', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO users (id, organization_id, department_id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at)
VALUES
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'admin@gravitino.local', '$2b$10$IQYp2djOXlsDnrLatFvJOOSppypB65mSIKfXtVjBqDWnRmkKPgNKK', 'Андрей Лах', 'admin', true, now(), now(), now()),
  ('33333333-3333-4333-8333-333333333334', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'operator@gravitino.local', '$2b$10$IQYp2djOXlsDnrLatFvJOOSppypB65mSIKfXtVjBqDWnRmkKPgNKK', 'Оператор архива', 'operator', true, null, now(), now())
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  department_id = EXCLUDED.department_id,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  last_login_at = EXCLUDED.last_login_at,
  updated_at = now();

INSERT INTO drivers (id, department_id, full_name, personnel_number, license_number, phone, is_active, created_at, updated_at)
VALUES
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'Иванов Сергей Петрович', 'DRV-001', '77 12 345678', '+7 900 111-22-33', true, now(), now()),
  ('44444444-4444-4444-8444-444444444445', '22222222-2222-4222-8222-222222222222', 'Петров Михаил Андреевич', 'DRV-002', '77 98 765432', '+7 900 444-55-66', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  department_id = EXCLUDED.department_id,
  full_name = EXCLUDED.full_name,
  personnel_number = EXCLUDED.personnel_number,
  license_number = EXCLUDED.license_number,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO vehicles (id, department_id, vehicle_number, brand, model, vehicle_type, fuel_rate_per_100km, is_active, created_at, updated_at)
VALUES
  ('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222222', 'А123ВС799', 'ГАЗ', 'ГАЗель Next', 'light_truck', 13.50, true, now(), now()),
  ('55555555-5555-4555-8555-555555555556', '22222222-2222-4222-8222-222222222222', 'М456ОР799', 'КАМАЗ', '5490', 'truck', 28.00, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  department_id = EXCLUDED.department_id,
  vehicle_number = EXCLUDED.vehicle_number,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  vehicle_type = EXCLUDED.vehicle_type,
  fuel_rate_per_100km = EXCLUDED.fuel_rate_per_100km,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO validation_rules (id, code, title, description, is_enabled, params, created_at, updated_at)
VALUES
  ('66666666-6666-4666-8666-666666666666', 'MILEAGE_NON_NEGATIVE', 'Пробег не может быть отрицательным', 'Проверяет, что конечный одометр больше начального.', true, '{"min_delta":0}'::jsonb, now(), now()),
  ('66666666-6666-4666-8666-666666666667', 'FUEL_RATE_LIMIT', 'Расход топлива в допустимых границах', 'Сравнивает фактический расход с нормативом автомобиля.', true, '{"max_overrun_percent":20}'::jsonb, now(), now()),
  ('66666666-6666-4666-8666-666666666668', 'REQUIRED_FIELDS', 'Обязательные поля заполнены', 'Проверяет наличие номера документа, даты, водителя и автомобиля.', true, '{"fields":["document_number","trip_date","driver","vehicle"]}'::jsonb, now(), now())
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_enabled = EXCLUDED.is_enabled,
  params = EXCLUDED.params,
  updated_at = now();

INSERT INTO integration_configs (id, organization_id, integration_type, name, status, settings, last_sync_at, created_at, updated_at)
VALUES
  ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', 'json_export', 'Выгрузка JSON для бухгалтерии', 'active', '{"target":"local_file","format":"waybill.v1"}'::jsonb, null, now(), now())
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  integration_type = EXCLUDED.integration_type,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  settings = EXCLUDED.settings,
  last_sync_at = EXCLUDED.last_sync_at,
  updated_at = now();

INSERT INTO documents (id, uploaded_by_id, driver_id, vehicle_id, document_number, trip_date, original_file_url, original_file_name, file_mime_type, file_size, status, ocr_status, ocr_confidence, has_anomalies, confirmed_at, confirmed_by_id, created_at, updated_at)
VALUES
  ('88888888-8888-4888-8888-888888888888', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555', 'PL-2026-0001', DATE '2026-05-20', '/uploads/waybill-0001.jpg', 'waybill-0001.jpg', 'image/jpeg', 1845220, 'confirmed', 'completed', 0.9325, false, now(), '33333333-3333-4333-8333-333333333333', now(), now()),
  ('88888888-8888-4888-8888-888888888889', '33333333-3333-4333-8333-333333333334', '44444444-4444-4444-8444-444444444445', '55555555-5555-4555-8555-555555555556', 'PL-2026-0002', DATE '2026-05-21', '/uploads/waybill-0002.jpg', 'waybill-0002.jpg', 'image/jpeg', 2103400, 'review', 'completed', 0.8842, true, null, null, now(), now())
ON CONFLICT (id) DO UPDATE SET
  uploaded_by_id = EXCLUDED.uploaded_by_id,
  driver_id = EXCLUDED.driver_id,
  vehicle_id = EXCLUDED.vehicle_id,
  document_number = EXCLUDED.document_number,
  trip_date = EXCLUDED.trip_date,
  original_file_url = EXCLUDED.original_file_url,
  original_file_name = EXCLUDED.original_file_name,
  file_mime_type = EXCLUDED.file_mime_type,
  file_size = EXCLUDED.file_size,
  status = EXCLUDED.status,
  ocr_status = EXCLUDED.ocr_status,
  ocr_confidence = EXCLUDED.ocr_confidence,
  has_anomalies = EXCLUDED.has_anomalies,
  confirmed_at = EXCLUDED.confirmed_at,
  confirmed_by_id = EXCLUDED.confirmed_by_id,
  updated_at = now();

INSERT INTO document_fields (id, document_id, field_key, field_label, recognized_value, corrected_value, confidence, is_edited, bbox, source, created_at, updated_at)
VALUES
  ('99999999-9999-4999-8999-999999999901', '88888888-8888-4888-8888-888888888888', 'odometer_start', 'Одометр на выезде', '124500', '124500', 0.9512, false, '{"x":120,"y":340,"w":180,"h":42}'::jsonb, 'mock_ocr', now(), now()),
  ('99999999-9999-4999-8999-999999999902', '88888888-8888-4888-8888-888888888888', 'odometer_end', 'Одометр на возврате', '124682', '124682', 0.9401, false, '{"x":320,"y":340,"w":180,"h":42}'::jsonb, 'mock_ocr', now(), now()),
  ('99999999-9999-4999-8999-999999999903', '88888888-8888-4888-8888-888888888888', 'fuel_used_liters', 'Израсходовано топлива, л', '24.7', '24.7', 0.9020, false, '{"x":510,"y":420,"w":120,"h":38}'::jsonb, 'mock_ocr', now(), now()),
  ('99999999-9999-4999-8999-999999999904', '88888888-8888-4888-8888-888888888889', 'odometer_start', 'Одометр на выезде', '88100', '88100', 0.8725, false, '{"x":120,"y":340,"w":180,"h":42}'::jsonb, 'mock_ocr', now(), now()),
  ('99999999-9999-4999-8999-999999999905', '88888888-8888-4888-8888-888888888889', 'odometer_end', 'Одометр на возврате', '87980', '87980', 0.8220, false, '{"x":320,"y":340,"w":180,"h":42}'::jsonb, 'mock_ocr', now(), now()),
  ('99999999-9999-4999-8999-999999999906', '88888888-8888-4888-8888-888888888889', 'fuel_used_liters', 'Израсходовано топлива, л', '96', '96', 0.7815, false, '{"x":510,"y":420,"w":120,"h":38}'::jsonb, 'mock_ocr', now(), now())
ON CONFLICT (document_id, field_key) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  recognized_value = EXCLUDED.recognized_value,
  corrected_value = EXCLUDED.corrected_value,
  confidence = EXCLUDED.confidence,
  is_edited = EXCLUDED.is_edited,
  bbox = EXCLUDED.bbox,
  source = EXCLUDED.source,
  updated_at = now();

INSERT INTO anomalies (id, document_id, validation_rule_id, type, severity, field_key, message, expected_value, actual_value, status, resolved_by_id, resolved_at, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '88888888-8888-4888-8888-888888888889', '66666666-6666-4666-8666-666666666666', 'logic_error', 'high', 'odometer_end', 'Конечный одометр меньше начального.', '>= 88100', '87980', 'open', null, null, now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '88888888-8888-4888-8888-888888888889', '66666666-6666-4666-8666-666666666667', 'fuel_overrun', 'medium', 'fuel_used_liters', 'Расход топлива выше нормы для указанного автомобиля.', '<= 40.32', '96', 'open', null, null, now(), now())
ON CONFLICT (id) DO UPDATE SET
  document_id = EXCLUDED.document_id,
  validation_rule_id = EXCLUDED.validation_rule_id,
  type = EXCLUDED.type,
  severity = EXCLUDED.severity,
  field_key = EXCLUDED.field_key,
  message = EXCLUDED.message,
  expected_value = EXCLUDED.expected_value,
  actual_value = EXCLUDED.actual_value,
  status = EXCLUDED.status,
  resolved_by_id = EXCLUDED.resolved_by_id,
  resolved_at = EXCLUDED.resolved_at,
  updated_at = now();

INSERT INTO processing_jobs (id, document_id, job_type, status, progress, error_message, started_at, finished_at, created_at, updated_at)
VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '88888888-8888-4888-8888-888888888888', 'mock_ocr', 'completed', 100, null, now() - interval '8 minutes', now() - interval '7 minutes', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '88888888-8888-4888-8888-888888888889', 'validation', 'completed', 100, null, now() - interval '5 minutes', now() - interval '4 minutes', now(), now())
ON CONFLICT (id) DO UPDATE SET
  document_id = EXCLUDED.document_id,
  job_type = EXCLUDED.job_type,
  status = EXCLUDED.status,
  progress = EXCLUDED.progress,
  error_message = EXCLUDED.error_message,
  started_at = EXCLUDED.started_at,
  finished_at = EXCLUDED.finished_at,
  updated_at = now();

INSERT INTO export_jobs (id, document_id, integration_config_id, export_format, status, file_url, error_message, exported_at, created_at, updated_at)
VALUES
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '88888888-8888-4888-8888-888888888888', '77777777-7777-4777-8777-777777777777', 'json', 'completed', '/exports/PL-2026-0001.json', null, now(), now(), now())
ON CONFLICT (id) DO UPDATE SET
  document_id = EXCLUDED.document_id,
  integration_config_id = EXCLUDED.integration_config_id,
  export_format = EXCLUDED.export_format,
  status = EXCLUDED.status,
  file_url = EXCLUDED.file_url,
  error_message = EXCLUDED.error_message,
  exported_at = EXCLUDED.exported_at,
  updated_at = now();

INSERT INTO document_history (id, document_id, user_id, action, field_key, old_value, new_value, created_at)
VALUES
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', '88888888-8888-4888-8888-888888888888', '33333333-3333-4333-8333-333333333333', 'confirm', null, null, 'confirmed', now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', '88888888-8888-4888-8888-888888888889', '33333333-3333-4333-8333-333333333334', 'run_validation', null, null, '2 anomalies found', now())
ON CONFLICT (id) DO UPDATE SET
  document_id = EXCLUDED.document_id,
  user_id = EXCLUDED.user_id,
  action = EXCLUDED.action,
  field_key = EXCLUDED.field_key,
  old_value = EXCLUDED.old_value,
  new_value = EXCLUDED.new_value;

INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, payload, ip_address, created_at)
VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', '33333333-3333-4333-8333-333333333333', 'document', '88888888-8888-4888-8888-888888888888', 'confirm', '{"source":"seed"}'::jsonb, '127.0.0.1', now()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', '33333333-3333-4333-8333-333333333334', 'document', '88888888-8888-4888-8888-888888888889', 'validate', '{"source":"seed"}'::jsonb, '127.0.0.1', now())
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  entity_type = EXCLUDED.entity_type,
  entity_id = EXCLUDED.entity_id,
  action = EXCLUDED.action,
  payload = EXCLUDED.payload,
  ip_address = EXCLUDED.ip_address;
