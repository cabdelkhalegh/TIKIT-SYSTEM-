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
-- CAMPAIGN & CONTENT WORKFLOW TABLES (TASK 4 - P0)
-- ============================================================================

-- Campaign status enum
CREATE TYPE campaign_status AS ENUM (
    'draft',           -- Being created
    'brief_pending',   -- Awaiting brief approval
    'active',          -- Campaign running
    'content_review',  -- Content being reviewed
    'client_review',   -- Awaiting client approval
    'completed',       -- All deliverables approved
    'archived'         -- Historical record
);

-- Content status enum
CREATE TYPE content_status AS ENUM (
    'draft',              -- Being uploaded
    'pending_internal',   -- Awaiting internal review
    'internal_rejected',  -- Rejected by internal reviewer
    'pending_client',     -- Awaiting client approval
    'client_rejected',    -- Rejected by client
    'approved',           -- Fully approved
    'published'           -- Published/delivered
);

-- Clients table (PRD Section 6-7)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_code TEXT UNIQUE NOT NULL DEFAULT generate_client_id(),
    
    -- Basic info
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    
    -- Address
    address TEXT,
    city TEXT,
    country TEXT,
    
    -- Business details
    industry TEXT,
    website TEXT,
    notes TEXT,
    
    -- Relationship
    primary_contact_name TEXT,
    account_manager_id UUID REFERENCES profiles(id),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Campaigns table (PRD Section 4)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_code TEXT UNIQUE NOT NULL DEFAULT generate_campaign_id(),
    
    -- Basic info
    name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT,
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    -- Status & workflow
    status campaign_status DEFAULT 'draft',
    
    -- Budget
    budget_amount DECIMAL(12, 2),
    budget_currency TEXT DEFAULT 'USD',
    
    -- Team
    campaign_manager_id UUID REFERENCES profiles(id),
    reviewer_id UUID REFERENCES profiles(id),
    
    -- Brief & strategy
    brief_document_url TEXT,
    strategy_document_url TEXT,
    brief_approved_at TIMESTAMPTZ,
    brief_approved_by UUID REFERENCES profiles(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Content items/deliverables (PRD Section 8)
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Basic info
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT, -- 'image', 'video', 'document', 'social_post', etc.
    
    -- Deliverable details
    platform TEXT, -- 'instagram', 'tiktok', 'youtube', etc.
    scheduled_date DATE,
    
    -- Current version (points to latest approved or working version)
    current_version_id UUID,
    
    -- Status
    status content_status DEFAULT 'draft',
    
    -- Deadlines
    internal_review_deadline DATE,
    client_review_deadline DATE,
    publish_deadline DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Content versions (PRD Section 8 - Version management)
CREATE TABLE content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    
    -- Version info
    version_number INTEGER NOT NULL,
    version_label TEXT, -- 'v1', 'v2-client-feedback', etc.
    
    -- File storage
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name TEXT NOT NULL,
    file_size BIGINT, -- bytes
    file_type TEXT, -- MIME type
    
    -- Thumbnail for images/videos
    thumbnail_url TEXT,
    
    -- Description
    change_description TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES profiles(id),
    
    UNIQUE(content_item_id, version_number)
);

-- Content approvals (PRD Section 8 - Two-stage approval)
CREATE TABLE content_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    
    -- Approval stage
    approval_stage TEXT NOT NULL, -- 'internal' or 'client'
    
    -- Decision
    status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
    decision_notes TEXT,
    
    -- Approver
    approver_id UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(content_version_id, approval_stage)
);

-- Content feedback/comments (PRD Section 8 - Feedback loop)
CREATE TABLE content_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    
    -- Feedback content
    comment TEXT NOT NULL,
    
    -- Optional: specific location in file (for annotations)
    annotation_x DECIMAL(5, 2), -- percentage 0-100
    annotation_y DECIMAL(5, 2), -- percentage 0-100
    
    -- Thread support
    parent_feedback_id UUID REFERENCES content_feedback(id),
    
    -- Status
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ============================================================================
-- CONTENT WORKFLOW RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_feedback ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Directors and campaign managers can manage clients"
    ON clients FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Clients can view their own record"
    ON clients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'client'
            AND role_approved = TRUE
        )
    );

-- Campaigns policies
CREATE POLICY "Directors and campaign managers can manage campaigns"
    ON campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Reviewers can view campaigns"
    ON campaigns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Clients can view their campaigns"
    ON campaigns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN clients c ON c.id = campaigns.client_id
            WHERE p.id = auth.uid()
            AND p.role = 'client'
            AND p.role_approved = TRUE
        )
    );

-- Content items policies
CREATE POLICY "Staff can manage content items"
    ON content_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'influencer')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Clients can view content for their campaigns"
    ON content_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN clients cl ON cl.id IN (
                SELECT client_id FROM campaigns WHERE id = content_items.campaign_id
            )
            WHERE p.id = auth.uid()
            AND p.role = 'client'
            AND p.role_approved = TRUE
        )
    );

-- Content versions policies
CREATE POLICY "Staff can manage content versions"
    ON content_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'influencer')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Clients can view content versions"
    ON content_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM content_items ci
            JOIN campaigns cp ON cp.id = ci.campaign_id
            JOIN clients cl ON cl.id = cp.client_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE ci.id = content_versions.content_item_id
            AND p.role = 'client'
            AND p.role_approved = TRUE
        )
    );

-- Content approvals policies
CREATE POLICY "Reviewers can manage internal approvals"
    ON content_approvals FOR ALL
    USING (
        approval_stage = 'internal'
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'reviewer')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Clients can manage client approvals"
    ON content_approvals FOR ALL
    USING (
        approval_stage = 'client'
        AND EXISTS (
            SELECT 1 FROM content_versions cv
            JOIN content_items ci ON ci.id = cv.content_item_id
            JOIN campaigns cp ON cp.id = ci.campaign_id
            JOIN clients cl ON cl.id = cp.client_id
            JOIN profiles p ON p.id = auth.uid()
            WHERE cv.id = content_approvals.content_version_id
            AND p.role = 'client'
            AND p.role_approved = TRUE
        )
    );

CREATE POLICY "Staff can view all approvals"
    ON content_approvals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer')
            AND role_approved = TRUE
        )
    );

-- Content feedback policies
CREATE POLICY "Staff and clients can add feedback"
    ON content_feedback FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'client', 'influencer')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Users can view feedback on content they have access to"
    ON content_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'client', 'influencer')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Users can update their own feedback"
    ON content_feedback FOR UPDATE
    USING (created_by = auth.uid());

-- ============================================================================
-- CONTENT WORKFLOW TRIGGERS
-- ============================================================================

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
    BEFORE UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Automatically set version numbers
CREATE OR REPLACE FUNCTION set_content_version_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM content_versions
        WHERE content_item_id = NEW.content_item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_version_number
    BEFORE INSERT ON content_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_content_version_number();

-- ============================================================================
-- KPI TABLES (TASK 5 - Manual KPI Entry)
-- ============================================================================

-- Post-level KPI metrics
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    content_version_id UUID REFERENCES content_versions(id) ON DELETE SET NULL,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_source TEXT NOT NULL CHECK (data_source IN ('manual', 'instagram', 'tiktok', 'youtube', 'facebook')),
    
    -- Metrics
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    saves INTEGER,
    reach INTEGER,
    impressions INTEGER,
    engagement_rate DECIMAL(5,2), -- Percentage (0-100)
    
    -- Audit fields
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Influencer-level KPI metrics
CREATE TABLE influencer_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id UUID NOT NULL, -- Will reference influencers table when created
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
    
    -- Metrics
    follower_count INTEGER NOT NULL,
    avg_engagement_rate DECIMAL(5,2),
    total_posts INTEGER,
    
    -- Audit fields
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign-level KPI rollups
CREATE TABLE campaign_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Aggregated metrics
    total_views INTEGER,
    total_likes INTEGER,
    total_comments INTEGER,
    total_shares INTEGER,
    total_saves INTEGER,
    total_reach INTEGER,
    total_impressions INTEGER,
    avg_engagement_rate DECIMAL(5,2),
    total_interactions INTEGER, -- likes + comments + shares + saves
    
    -- Performance indicators
    cost_per_engagement DECIMAL(10,2), -- campaign.budget / total_interactions
    roi_indicator DECIMAL(10,2), -- (total_reach / campaign.budget) * 100
    
    -- Audit fields
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_kpis_content_item ON kpis(content_item_id);
CREATE INDEX idx_kpis_snapshot_date ON kpis(snapshot_date);
CREATE INDEX idx_influencer_kpis_influencer ON influencer_kpis(influencer_id);
CREATE INDEX idx_campaign_kpis_campaign ON campaign_kpis(campaign_id);

-- ============================================================================
-- KPI RLS POLICIES
-- ============================================================================

-- KPIs table policies
CREATE POLICY "Directors can manage all KPIs"
    ON kpis FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'director' AND role_approved = TRUE
        )
    );

CREATE POLICY "Campaign managers can manage KPIs for their campaigns"
    ON kpis FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM content_items ci
            JOIN campaigns c ON c.id = ci.campaign_id
            WHERE ci.id = kpis.content_item_id
            AND c.campaign_manager_id = auth.uid()
        )
    );

CREATE POLICY "Influencers can add KPIs for their assigned content"
    ON kpis FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_items
            WHERE id = kpis.content_item_id
            AND assigned_influencer_id = auth.uid()
        )
    );

CREATE POLICY "Users can view KPIs for content they have access to"
    ON kpis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'finance', 'client', 'influencer')
            AND role_approved = TRUE
        )
    );

-- Influencer KPIs policies
CREATE POLICY "Directors and campaign managers can manage influencer KPIs"
    ON influencer_kpis FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager')
            AND role_approved = TRUE
        )
    );

CREATE POLICY "Users can view influencer KPIs"
    ON influencer_kpis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'finance')
            AND role_approved = TRUE
        )
    );

-- Campaign KPIs policies
CREATE POLICY "Directors and campaign managers can manage campaign KPIs"
    ON campaign_kpis FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE id = campaign_kpis.campaign_id
            AND (
                campaign_manager_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'director' AND role_approved = TRUE
                )
            )
        )
    );

CREATE POLICY "Users can view campaign KPIs for campaigns they have access to"
    ON campaign_kpis FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('director', 'campaign_manager', 'reviewer', 'finance', 'client')
            AND role_approved = TRUE
        )
    );

-- ============================================================================
-- KPI HELPER FUNCTIONS
-- ============================================================================

-- Calculate engagement rate from metrics
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
    p_interactions INTEGER,
    p_reach INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF p_reach IS NULL OR p_reach = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((p_interactions::DECIMAL / p_reach) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Auto-calculate campaign KPI rollup
CREATE OR REPLACE FUNCTION calculate_campaign_kpi_rollup(p_campaign_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_interactions INTEGER;
    v_campaign_budget DECIMAL(10,2);
BEGIN
    -- Get campaign budget
    SELECT budget INTO v_campaign_budget
    FROM campaigns
    WHERE id = p_campaign_id;

    -- Calculate total interactions
    SELECT 
        COALESCE(SUM(COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(shares, 0) + COALESCE(saves, 0)), 0)
    INTO v_total_interactions
    FROM kpis k
    JOIN content_items ci ON ci.id = k.content_item_id
    WHERE ci.campaign_id = p_campaign_id;

    -- Insert or update campaign KPI
    INSERT INTO campaign_kpis (
        campaign_id,
        total_views,
        total_likes,
        total_comments,
        total_shares,
        total_saves,
        total_reach,
        total_impressions,
        avg_engagement_rate,
        total_interactions,
        cost_per_engagement,
        roi_indicator
    )
    SELECT 
        p_campaign_id,
        SUM(COALESCE(k.views, 0)),
        SUM(COALESCE(k.likes, 0)),
        SUM(COALESCE(k.comments, 0)),
        SUM(COALESCE(k.shares, 0)),
        SUM(COALESCE(k.saves, 0)),
        SUM(COALESCE(k.reach, 0)),
        SUM(COALESCE(k.impressions, 0)),
        AVG(k.engagement_rate),
        v_total_interactions,
        CASE WHEN v_total_interactions > 0 AND v_campaign_budget IS NOT NULL
            THEN v_campaign_budget / v_total_interactions
            ELSE NULL
        END,
        CASE WHEN v_campaign_budget IS NOT NULL AND v_campaign_budget > 0
            THEN (SUM(COALESCE(k.reach, 0))::DECIMAL / v_campaign_budget) * 100
            ELSE NULL
        END
    FROM kpis k
    JOIN content_items ci ON ci.id = k.content_item_id
    WHERE ci.campaign_id = p_campaign_id
    ON CONFLICT (campaign_id, snapshot_date) DO UPDATE
    SET 
        total_views = EXCLUDED.total_views,
        total_likes = EXCLUDED.total_likes,
        total_comments = EXCLUDED.total_comments,
        total_shares = EXCLUDED.total_shares,
        total_saves = EXCLUDED.total_saves,
        total_reach = EXCLUDED.total_reach,
        total_impressions = EXCLUDED.total_impressions,
        avg_engagement_rate = EXCLUDED.avg_engagement_rate,
        total_interactions = EXCLUDED.total_interactions,
        cost_per_engagement = EXCLUDED.cost_per_engagement,
        roi_indicator = EXCLUDED.roi_indicator,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update campaign KPIs when post KPIs change
CREATE OR REPLACE FUNCTION update_campaign_kpis()
RETURNS TRIGGER AS $$
DECLARE
    v_campaign_id UUID;
BEGIN
    -- Get campaign_id from content_item
    SELECT campaign_id INTO v_campaign_id
    FROM content_items
    WHERE id = COALESCE(NEW.content_item_id, OLD.content_item_id);
    
    -- Recalculate campaign KPIs
    PERFORM calculate_campaign_kpi_rollup(v_campaign_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_kpis
    AFTER INSERT OR UPDATE OR DELETE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_kpis();

-- Add unique constraint for campaign_kpis
ALTER TABLE campaign_kpis 
    ADD CONSTRAINT unique_campaign_snapshot 
    UNIQUE (campaign_id, snapshot_date);

-- Trigger for updated_at
CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_kpis_updated_at
    BEFORE UPDATE ON campaign_kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUTURE TABLES (To be added in later phases)
-- ============================================================================
-- These tables will be added as remaining P0/P1 features are implemented:
--
-- influencers (with influencer_code TEXT DEFAULT generate_influencer_id())
-- influencer_instagram_accounts
-- campaign_influencers (junction table)
-- invoices (with invoice_code TEXT DEFAULT generate_invoice_id())
-- reports
-- notifications
-- ============================================================================
