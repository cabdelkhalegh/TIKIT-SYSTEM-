-- ============================================================================
-- TiKiT MVP v1.2 Database Schema
-- PostgreSQL / Supabase
-- PRD v1.2 Compliant - 6-Role Model
-- ============================================================================

-- ============================================================================
-- MIGRATION NOTES (from 4-role to 6-role model)
-- ============================================================================
-- If upgrading from existing 4-role system, run these commands FIRST:
-- 
-- ALTER TYPE user_role ADD VALUE 'campaign_manager';
-- ALTER TYPE user_role ADD VALUE 'reviewer';
-- ALTER TYPE user_role ADD VALUE 'finance';
-- 
-- Then migrate existing 'account_manager' users to appropriate new roles:
-- UPDATE profiles SET role = 'campaign_manager' WHERE role = 'account_manager' AND <criteria>;
-- UPDATE profiles SET role = 'reviewer' WHERE role = 'account_manager' AND <criteria>;
-- UPDATE profiles SET role = 'finance' WHERE role = 'account_manager' AND <criteria>;
-- 
-- Note: 'account_manager' is deprecated but kept for backward compatibility
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles for RBAC (PRD v1.2 Section 2)
-- Note: In production, use ALTER TYPE to add new values to existing enum
CREATE TYPE user_role AS ENUM (
    'director',           -- Founder/Director - super-user (global visibility, budget overrides, exception approvals)
    'campaign_manager',   -- Runs campaigns (create/edit campaigns, manage workflows)
    'reviewer',           -- Quality & approvals (approve briefs, content, reports)
    'finance',            -- Financial control (create & approve invoices, mark paid)
    'client',             -- External approver (view & approve shortlist, content, reports)
    'influencer'          -- External contributor (upload content, connect Instagram, view status)
);

-- Invitation status
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Extended user profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role,
    role_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations for invite-only system
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    status invitation_status DEFAULT 'pending',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_code ON invitations(invite_code);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Directors can view all profiles
CREATE POLICY "Directors can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'director'
            AND role_approved = TRUE
        )
    );

-- Users can update their own profile (except role and approval fields)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
        AND role_approved = (SELECT role_approved FROM profiles WHERE id = auth.uid())
    );

-- Directors can update any profile (including role approval)
CREATE POLICY "Directors can update profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'director'
            AND role_approved = TRUE
        )
    );

-- Profile creation (allow during signup)
CREATE POLICY "Allow profile creation"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Invitations Policies
-- Directors can view all invitations
CREATE POLICY "Directors can view invitations"
    ON invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'director'
            AND role_approved = TRUE
        )
    );

-- Users can view invitations sent to their email
CREATE POLICY "Users can view own invitations"
    ON invitations FOR SELECT
    USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Directors can create invitations
CREATE POLICY "Directors can create invitations"
    ON invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'director'
            AND role_approved = TRUE
        )
    );

-- Directors can update invitations
CREATE POLICY "Directors can update invitations"
    ON invitations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'director'
            AND role_approved = TRUE
        )
    );

-- ============================================================================
-- ADDITIONAL ROLE-SPECIFIC POLICIES (for future tables)
-- ============================================================================
-- Note: These policies are templates for when Campaign, Content, Finance tables are added
--
-- Campaign Managers can view campaigns they manage
-- Reviewers can view content that needs approval
-- Finance can view all invoices and financial data
-- 
-- Example for future campaigns table:
-- CREATE POLICY "Campaign managers can manage campaigns"
--     ON campaigns FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles
--             WHERE id = auth.uid()
--             AND role IN ('director', 'campaign_manager')
--             AND role_approved = TRUE
--         )
--     );
--
-- CREATE POLICY "Reviewers can approve content"
--     ON content FOR UPDATE
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles
--             WHERE id = auth.uid()
--             AND role IN ('director', 'reviewer')
--             AND role_approved = TRUE
--         )
--     );
--
-- CREATE POLICY "Finance can manage invoices"
--     ON invoices FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles
--             WHERE id = auth.uid()
--             AND role IN ('director', 'finance')
--             AND role_approved = TRUE
--         )
--     );
-- ============================================================================

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for invitations
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    done BOOLEAN;
BEGIN
    done := FALSE;
    WHILE NOT done LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        done := NOT EXISTS(SELECT 1 FROM invitations WHERE invite_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA (First Director)
-- ============================================================================
-- Note: First director must be created manually or via bootstrap script
-- after first user signs up through Supabase Auth UI

-- ============================================================================
-- HUMAN-READABLE IDs (PRD v1.2 Section 3)
-- ============================================================================

-- Sequences for human-readable IDs
CREATE SEQUENCE IF NOT EXISTS campaign_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS client_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS influencer_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_id_seq START 1;

-- Function to generate campaign ID: TKT-YYYY-####
CREATE OR REPLACE FUNCTION generate_campaign_id()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_num TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    seq_num := LPAD(nextval('campaign_id_seq')::TEXT, 4, '0');
    RETURN 'TKT-' || year_part || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate client ID: CLI-####
CREATE OR REPLACE FUNCTION generate_client_id()
RETURNS TEXT AS $$
DECLARE
    seq_num TEXT;
BEGIN
    seq_num := LPAD(nextval('client_id_seq')::TEXT, 4, '0');
    RETURN 'CLI-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate influencer ID: INF-####
CREATE OR REPLACE FUNCTION generate_influencer_id()
RETURNS TEXT AS $$
DECLARE
    seq_num TEXT;
BEGIN
    seq_num := LPAD(nextval('influencer_id_seq')::TEXT, 4, '0');
    RETURN 'INF-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice ID: INV-YYYY-####
CREATE OR REPLACE FUNCTION generate_invoice_id()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_num TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    seq_num := LPAD(nextval('invoice_id_seq')::TEXT, 4, '0');
    RETURN 'INV-' || year_part || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUTURE TABLES (To be added in later phases)
-- ============================================================================
-- These tables will be added as P0 features are implemented:
--
-- campaigns (with campaign_code TEXT DEFAULT generate_campaign_id())
-- clients (with client_code TEXT DEFAULT generate_client_id())
-- influencers (with influencer_code TEXT DEFAULT generate_influencer_id())
-- invoices (with invoice_code TEXT DEFAULT generate_invoice_id())
-- content_items
-- kpis
-- reports
-- ============================================================================
