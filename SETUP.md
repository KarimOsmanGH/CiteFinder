# CiteFinder Usage Limit Setup

## Overview
This implementation adds usage limits to CiteFinder:
- **Anonymous users**: 3 citations per 24 hours
- **Registered users**: 3 citations per 24 hours (free plan)
- **Premium users**: Unlimited citations ($15/month)

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Set Up Database
1. Go to your Supabase project SQL editor
2. Run the SQL from `supabase-schema.sql` to create:
   - Users table (extends auth.users)
   - Subscriptions table
   - Usage logs table
   - RLS policies
   - Usage limit functions

### 3. Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Features Implemented

#### Usage Tracking
- **Session-based tracking** for anonymous users
- **User-based tracking** for registered users
- **24-hour rolling window** for limits
- **Automatic usage logging** on each action

#### UI Components
- **UsageLimit component** shows current status
- **Upgrade prompts** for anonymous users
- **Plan indicators** for different user types

#### API Endpoints
- `/api/usage/check` - Check if user can perform action
- `/api/usage/log` - Log usage activity

#### Database Functions
- `check_usage_limit()` - Determines if user can use service
- `handle_new_user()` - Creates user profile on signup

### 5. Usage Limits by Action
- **PDF Upload**: 3 per 24 hours (anonymous/free)
- **Text Processing**: 3 per 24 hours (anonymous/free)
- **Citation Generation**: 3 per 24 hours (anonymous/free)

### 6. Next Steps
1. **Authentication**: Implement user signup/login
2. **Stripe Integration**: Add payment processing
3. **Admin Panel**: Manage subscriptions
4. **Analytics**: Track usage patterns

## Database Schema

### Users Table
- Extends Supabase auth.users
- Stores profile information
- Links to subscriptions

### Subscriptions Table
- Tracks user subscription status
- Supports free/premium plans
- Ready for Stripe integration

### Usage Logs Table
- Records all user actions
- Supports anonymous sessions
- Enables usage analytics

## Security
- **Row Level Security (RLS)** enabled
- **User isolation** - users can only see their own data
- **Session validation** for anonymous users
- **Rate limiting** at database level 