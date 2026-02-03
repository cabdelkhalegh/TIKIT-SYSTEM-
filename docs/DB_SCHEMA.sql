-- ============================================================================
-- TiKiT MVP v1.2 Database Schema
-- PostgreSQL / Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles for RBAC
CREATE TYPE user_role AS ENUM ('director', 'account_manager', 'influencer', 'client');

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
