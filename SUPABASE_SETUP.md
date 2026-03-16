# Supabase Setup Guide

## Overview
This document explains how to set up the Supabase database for the AI Job Tracker application.

## Tables Required

### 1. Job Applications
```sql
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  applied_date TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('applied', 'interview', 'offer', 'rejected')),
  location TEXT,
  salary TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Notifications
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('interview', 'suggestion', 'reminder', 'update')),
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Skills
```sql
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER CHECK (level >= 1 AND level <= 5),
  category TEXT NOT NULL CHECK (category IN ('matched', 'missing', 'suggested')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Profiles
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  resume_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Skill Gap Analysis (NEW - For AI Integration)
```sql
CREATE TABLE IF NOT EXISTS skill_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  matched_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  missing_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  suggested_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  overall_score INTEGER DEFAULT 0,
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Setup Steps

### Option 1: Using SQL Script (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the contents from `scripts/002_supabase_schema.sql`
4. Run the query

### Option 2: Manual Setup
1. Go to Supabase Dashboard → Table Editor
2. Create each table manually with the schema above
3. Make sure to enable Row Level Security (RLS) for each table

## Row Level Security (RLS) Policies

All tables have RLS enabled with policies that ensure users can only:
- View their own data
- Insert their own data
- Update their own data
- Delete their own data

The policies use `auth.uid()` to check the current user's ID.

## Key Features of the Skill Gap Analysis Table

The `skill_gap_analysis` table stores:
- **job_description**: The job description analyzed
- **matched_skills**: Array of skills the user already has
- **missing_skills**: Array of skills required but user doesn't have
- **suggested_skills**: Array of suggested skills to learn
- **overall_score**: A score (0-100) indicating job match percentage
- **analysis_result**: Full JSON result including AI model metadata (ready for AI integration)

This structure is designed to be AI-ready. The `analysis_result` JSONB field can store:
```json
{
  "extractedKeywords": ["React", "TypeScript", "Node.js"],
  "categoryBreakdown": {
    "matched": 5,
    "missing": 3,
    "suggested": 2
  },
  "aiModel": "openai-gpt-4",  // Can be replaced with your AI model
  "confidence": 0.95,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Environment Variables

Make sure you have these in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing the Setup

After creating the tables:

1. **Test Applications:**
   - Go to Dashboard → Applications
   - Try adding a new application
   - Should save to `job_applications` table

2. **Test Skills:**
   - Go to Dashboard → Skills
   - Paste a job description in the analysis form
   - Click "Analyze Skills"
   - Should save analysis to `skill_gap_analysis` table

3. **Test Notifications:**
   - Go to Dashboard → Notifications
   - Create a notification
   - Should appear in real-time

## AI Integration Readiness

The skill gap analysis is prepared for AI integration:

1. **Current Implementation:**
   - Uses hardcoded keyword extraction (140+ tech skills)
   - Categorizes skills into matched/missing/suggested

2. **For AI Integration:**
   - Replace `extractKeywordsFromText()` in `lib/supabase/actions/skill-gap.ts`
   - Call your AI model (OpenAI, Anthropic, etc.)
   - Save the full response in `analysis_result` JSONB field
   - Update matched/missing/suggested arrays

3. **Example AI Function:**
```typescript
import { openai } from '@/lib/openai-client'

const result = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{
    role: 'user',
    content: `Analyze this job description and extract: \n${jobDescription}`
  }]
})

const analysis = JSON.parse(result.choices[0].message.content)
await analyzeSkillGap(jobDescription, analysis)
```

## Troubleshooting

### RLS Policy Errors (42501)
- Make sure the user is logged in
- Check that `user_id` is included in INSERT statements
- Verify the RLS policy is correctly checking `auth.uid()`

### Skills Not Showing
- Ensure skills have a `category` value ('matched', 'missing', 'suggested')
- Check that user is logged in to their own account

### Job Description Analysis Not Saving
- Verify `skill_gap_analysis` table exists
- Check RLS policies are enabled
- Ensure response includes `user_id` from auth session

## Next Steps

1. Set up the `skill_gap_analysis` table using the SQL script
2. Test the skills page by analyzing a job description
3. Integrate with your preferred AI model
4. Update the `extractKeywordsFromText()` function to use the AI model

For questions or issues, check the error logs in the browser console and Supabase dashboard.
