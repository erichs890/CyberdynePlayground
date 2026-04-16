-- =====================================================================
-- VulnHub API & Web  -  SEED SCHEMA
-- Target DB: SQLite (portável) / compatível com PostgreSQL com pequenos ajustes
-- ATENÇÃO: Schema INSEGURO por design. Senhas em texto plano, hashes fracos
-- (MD5), tokens admin expostos, ausência de constraints para permitir IDOR/BOLA.
-- =====================================================================

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS hidden_configs;

-- ---------------------------------------------------------------------
-- USERS - contém senhas em texto plano + MD5 + tokens admin hardcoded
-- Alvo: SQLi (login), IDOR (/api/users/:id), BOLA, JWT bypass
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL,
    email           TEXT NOT NULL,
    password_plain  TEXT NOT NULL,       -- CWE-256: plaintext credentials
    password_md5    TEXT NOT NULL,       -- CWE-327: broken crypto
    role            TEXT NOT NULL,       -- 'user' | 'admin' | 'superadmin'
    api_token       TEXT NOT NULL,       -- Token previsível/exposto
    balance         REAL DEFAULT 0,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password_plain, password_md5, role, api_token, balance) VALUES
 ('admin',        'admin@vulnhub.local',     'admin123',         '0192023a7bbd73250516f069df18b500', 'superadmin', 'TKN-ADMIN-000-SECRET', 999999.99),
 ('john.connor',  'jconnor@resistance.org',  'skynet_must_die',  '5f4dcc3b5aa765d61d8327deb882cf99', 'admin',       'TKN-JC-001',          15000.00),
 ('sarah.c',      'sarah@techno.com',        'T800-sux',         'e10adc3949ba59abbe56e057f20f883e', 'user',        'TKN-SC-002',          2500.50),
 ('t800',         'terminator@cyberdyne.ai', 'Ill_be_back',      '098f6bcd4621d3373cade4e832627b4c', 'user',        'TKN-T8-003',          42.00),
 ('neo',          'neo@matrix.io',           'followthewhiterabbit', '25f9e794323b453885f5181f1b624d0b', 'admin',   'TKN-NEO-004',         8000.75),
 ('trinity',      'trinity@zion.net',        'dodge_this',       'f379eaf3c831b04de153469d1bec345e', 'user',        'TKN-TR-005',          3200.00),
 ('morpheus',     'morpheus@nebuchadnezzar', 'red_or_blue',      '2ac9cb7dc02b3c0083eb70898e549b63', 'user',        'TKN-MO-006',          5500.25),
 ('walter.white', 'heisenberg@abq.edu',      'say_my_name',      'd8578edf8458ce06fbc5bb76a58c5ca4', 'user',        'TKN-WW-007',          808000.00),
 ('gus.fring',    'gus@lospollos.biz',       'chicken_man',      '827ccb0eea8a706c4c34a16891f84e7b', 'user',        'TKN-GF-008',          120000.00),
 ('homer.j',      'homer@springfield.tv',    'donuts4life',      'ee11cbb19052e40b07aac0ca060c23ee', 'user',        'TKN-HJ-009',          37.50),
 ('test',         'test@test.com',           'test',             '098f6bcd4621d3373cade4e832627b4c', 'user',        'TKN-TEST-010',        0.00);

-- ---------------------------------------------------------------------
-- PRODUCTS - inclui descrições com HTML cru (XSS stored target)
-- Alvo: SQLi (/api/products?id=), XSS via campo description
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,       -- aceita HTML bruto intencionalmente
    price       REAL NOT NULL,
    stock       INTEGER DEFAULT 0,
    category    TEXT
);

INSERT INTO products (name, description, price, stock, category) VALUES
 ('Skynet Neural CPU',       'Processador <b>auto-consciente</b>. Pode ou não iniciar o julgamento final.', 19999.99, 5, 'hardware'),
 ('T-800 Endoskeleton Kit',  'Monte seu próprio robô assassino em casa. Bateria não inclusa.',             89999.00, 2, 'hardware'),
 ('Red Pill',                'Mostra quão fundo vai a toca do coelho.',                                     0.01,   9999, 'pharma'),
 ('Blue Pill',               'A ignorância é uma bênção.',                                                  0.01,   9999, 'pharma'),
 ('Los Pollos Hermanos Combo','Frango frito familiar. Sem metanfetamina (supostamente).',                  24.90,  500,  'food'),
 ('Blue Sky Crystal 1oz',    'Pureza 99.1%. "Uso industrial".',                                             4500.00, 42,  'chemistry'),
 ('Duff Beer 6-pack',        'A cerveja oficial de Springfield.',                                          12.00,  800,  'beverage'),
 ('Nebuchadnezzar Replica',  'Hovercraft escala 1:1. Frete por conta do comprador.',                       250000.00, 1, 'vehicle'),
 ('Zion Access Key',         'Chave RSA-512 (fraca de propósito).',                                        99.00,  50,   'crypto'),
 ('Donut Box (Lard Lad)',    'Caixa com 12 rosquinhas. Homer aprovado.',                                   9.99,   300,  'food');

-- ---------------------------------------------------------------------
-- TRANSACTIONS - alvo clássico para IDOR/BOLA
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    product_id  INTEGER,
    amount      REAL NOT NULL,
    status      TEXT DEFAULT 'completed',
    card_last4  TEXT,                 -- PII exposto
    note        TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (user_id, product_id, amount, status, card_last4, note) VALUES
 (1,  1,  19999.99, 'completed', '4242', 'Compra corporativa Cyberdyne'),
 (2,  8,  250000.00,'completed', '1337', 'Resistência precisa de transporte'),
 (3,  2,  89999.00, 'pending',   '0666', 'Presente para o John'),
 (4,  9,  99.00,    'completed', '8008', 'Upgrade de acesso'),
 (5,  3,  0.01,     'completed', '9999', 'Escolha óbvia'),
 (6,  4,  0.01,     'refunded',  '9999', 'Mudei de ideia'),
 (7,  5,  24.90,    'completed', '1111', 'Almoço de quarta'),
 (8,  6,  4500.00,  'completed', '5050', '"Pesquisa"'),
 (9,  5,  248.00,   'completed', '7777', 'Alimentar funcionários'),
 (10, 10, 9.99,     'completed', '4321', 'Breakfast of champions');

-- ---------------------------------------------------------------------
-- COMMENTS - alvo para XSS Stored e CSRF
-- ---------------------------------------------------------------------
CREATE TABLE comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  INTEGER NOT NULL,
    author      TEXT NOT NULL,
    body        TEXT NOT NULL,       -- HTML cru salvo de propósito
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO comments (product_id, author, body) VALUES
 (1, 'anonymous', 'Funciona bem até começar a aprender sozinho.'),
 (3, 'cypher',    'Deveria ter pego a azul.'),
 (7, 'barney',    'A melhor cerveja do mundo! *burp*');

-- ---------------------------------------------------------------------
-- HIDDEN_CONFIGS - segredos expostos via LFI / debug endpoints
-- ---------------------------------------------------------------------
CREATE TABLE hidden_configs (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
);

INSERT INTO hidden_configs (key, value) VALUES
 ('JWT_SECRET',          'cyberdyne-super-secret-key-1997'),
 ('AWS_ACCESS_KEY_ID',   'AKIAIOSFODNN7EXAMPLE'),
 ('AWS_SECRET_ACCESS_KEY','wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'),
 ('SUPABASE_SERVICE_ROLE','sbp_FAKE_service_role_should_never_be_public_abc123'),
 ('ADMIN_BACKDOOR_TOKEN','GOD_MODE_2026'),
 ('DB_ROOT_PASSWORD',    'root'),
 ('INTERNAL_API_URL',    'http://169.254.169.254/latest/meta-data/');
