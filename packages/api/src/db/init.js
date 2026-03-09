/**
 * Database Initialization
 * Creates all necessary tables for the MVP
 */

import { getDb, getOne, query } from './client.js';
import { logger } from '../utils/logger.js';

export async function initializeDatabase() {
  const db = getDb();

  try {
    // ===== USERS TABLE (Dashboard authentication) =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        api_key VARCHAR(255) UNIQUE,
        plan VARCHAR(50) DEFAULT 'starter',
        status VARCHAR(50) DEFAULT 'active',
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key)`);

    // ===== CUSTOMERS TABLE =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        plan VARCHAR(50) DEFAULT 'starter',
        status VARCHAR(50) DEFAULT 'active',
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ===== SITES TABLE (Chatbots) =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_id TEXT NOT NULL,
        domain VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        widget_config TEXT DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_sites_customer_id ON sites(customer_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sites_api_key ON sites(api_key)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id)`);

    // ===== SOURCES TABLE (Knowledge sources - dashboard UI) =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        url VARCHAR(500),
        content TEXT,
        status VARCHAR(50) DEFAULT 'processing',
        processed_at TIMESTAMP,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(site_id) REFERENCES sites(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_sources_site_id ON sources(site_id)`);

    // ===== DOCUMENTS TABLE =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        source_url VARCHAR(500),
        title VARCHAR(255),
        content TEXT,
        metadata TEXT,
        chunks_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        last_crawled TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(site_id) REFERENCES sites(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_site_id ON documents(site_id)`);

    // ===== CHUNKS TABLE (simple keyword storage for MVP) =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        chunk_index INT NOT NULL,
        content TEXT NOT NULL,
        tokens INT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(document_id) REFERENCES documents(id),
        FOREIGN KEY(site_id) REFERENCES sites(id),
        UNIQUE(document_id, chunk_index)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_site_id ON chunks(site_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id)`);

    // ===== CONVERSATIONS TABLE =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        visitor_email VARCHAR(255),
        visitor_name VARCHAR(255),
        visitor_company VARCHAR(255),
        ip_address VARCHAR(50),
        user_agent TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        message_count INT DEFAULT 0,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(site_id) REFERENCES sites(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_site_id ON conversations(site_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id)`);

    // ===== MESSAGES TABLE =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        tokens_used INT,
        confidence_score FLOAT,
        sources TEXT,
        feedback INT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id),
        FOREIGN KEY(site_id) REFERENCES sites(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_site_id ON messages(site_id)`);

    // ===== GUARDRAIL RULES TABLE =====
    db.exec(`
      CREATE TABLE IF NOT EXISTS guardrail_rules (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        pattern VARCHAR(500),
        action VARCHAR(50) NOT NULL,
        response_text TEXT,
        priority INT DEFAULT 0,
        enabled BOOLEAN DEFAULT 1,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(site_id) REFERENCES sites(id)
      )
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_guardrail_rules_site_id ON guardrail_rules(site_id)`);

    logger.info('Database tables initialized successfully');
    return true;
  } catch (err) {
    logger.error(`Database initialization error: ${err.message}`);
    throw err;
  }
}

/**
 * Seed demo data for MVP
 */
export async function seedDemoData() {
  try {
    // Check if demo data already exists
    const existingCustomer = getOne('SELECT id FROM customers WHERE email = ?', ['fjordtech@demo.no']);
    if (existingCustomer) {
      logger.info('Demo data already seeded');
      return;
    }

    const { v4: uuid } = await import('uuid');

    // Create demo customer
    const customerId = uuid();
    query(
      `INSERT INTO customers (id, name, email, plan, status)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, 'Fjordtech AS', 'fjordtech@demo.no', 'starter', 'active']
    );

    // Create demo site
    const siteId = uuid();
    const widgetConfig = {
      theme: 'light',
      primary_color: '#0066cc',
      secondary_color: '#666',
      position: 'bottom-right',
      welcome_message: 'Hej! Jeg er chatbot for Fjordtech AS. Hva kan jeg hjelpe deg med?',
      tone: 'professional',
      language: 'norwegian',
      name: 'Fjordtech Chat',
    };

    query(
      `INSERT INTO sites (id, customer_id, domain, name, api_key, widget_config, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        siteId,
        customerId,
        'fjordtech.local',
        'Fjordtech AS',
        'sk_sit_' + Math.random().toString(36).substr(2, 20),
        JSON.stringify(widgetConfig),
        'active',
      ]
    );

    // Create demo documents with company info
    const demoDocuments = [
      {
        title: 'About Fjordtech',
        type: 'webpage',
        content: `
Fjordtech AS - Om oss

Fjordtech AS er et norsk teknologiselskap spesialisert i kunstig intelligens og maskinlæring.

Vi ble grunnlagt i 2015 og har kontorer i Oslo, Bergen og Stavanger.

Våre tjenester:
- AI-konsultasjon for bedrifter
- Maskinlæringsløsninger
- Dataanalyse
- Chatbot-teknologi
- Cloud-løsninger

Vi har en dedikert team på 50+ ingenører og eksperter innen AI.

Kontaktinformasjon:
Telefon: +47 22 12 34 56
Email: kontakt@fjordtech.no
Adresse: Nedre Slottsgate 5, 0157 Oslo
        `,
      },
      {
        title: 'Fjordtech Services',
        type: 'webpage',
        content: `
Tjenester fra Fjordtech

1. AI Consulting
Vi hjelper bedrifter med å implementere AI-løsninger som passer deres behov.

2. Machine Learning Development
Vi utvikler tilpassede ML-modeller for klassifikasjon, prediksjon og optimalisering.

3. Data Analytics
Vårt team analyserer data for å avdekke innsikter og forbedringspotensial.

4. Chatbot Solutions
Vi bygger intelligente chatboter som kan håndtere kundeservice, salg og support.

5. Cloud Infrastructure
Vi setter opp og administrerer cloud-løsninger på AWS, Google Cloud og Azure.

Alle våre tjenester er tilpasset deres spesifikke behov og budsjett.
        `,
      },
      {
        title: 'Fjordtech Pricing',
        type: 'webpage',
        content: `
Priser og Planer

Fjordtech tilbyr fleksible priser basert på dine behov:

Starter Plan: 10,000 kr/måned
- Opp til 10,000 API-kall per måned
- 1 integrasjon
- Email-support

Professional Plan: 50,000 kr/måned
- Opp til 1,000,000 API-kall per måned
- Ubegrensede integrasjoner
- Prioritert support
- Custom features

Enterprise Plan: Kontakt oss
- Ubegrensede API-kall
- Dedikert account manager
- Custom SLA
- On-premise deployment

Alle planer inkluderer:
- 30 dagers gratis trial
- Dokumentasjon og SDK
- Monitorering og analytics
        `,
      },
    ];

    // Insert demo documents
    for (const doc of demoDocuments) {
      const docId = uuid();
      query(
        `INSERT INTO documents (id, site_id, type, title, content, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [docId, siteId, doc.type, doc.title, doc.content, 'active']
      );

      // Create chunks from content
      const chunks = doc.content.split('\n\n').filter((c) => c.trim().length > 0);
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = uuid();
        query(
          `INSERT INTO chunks (id, document_id, site_id, chunk_index, content, tokens)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            chunkId,
            docId,
            siteId,
            i,
            chunks[i].trim(),
            Math.ceil(chunks[i].length / 4),
          ]
        );
      }
    }

    logger.info(`Demo data seeded for site: ${siteId}`);
    logger.info(`Demo site ID: ${siteId}`);
    logger.info(`Demo customer email: fjordtech@demo.no`);
  } catch (err) {
    logger.error(`Demo data seeding error: ${err.message}`);
    throw err;
  }
}
