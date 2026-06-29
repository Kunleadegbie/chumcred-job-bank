# TalentIQ Production Launch Checklist

## 1. Environment Variables

### Frontend / Vercel
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BACKEND_URL

### Backend / Railway
- OPENAI_API_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- CRON_SECRET

## 2. Supabase Checks
- RLS enabled on production tables
- Admin user confirmed
- Storage bucket exists: payment-receipts
- Commercial plans seeded
- AI wallets working
- AI usage logs working
- Subscription approval flow tested

## 3. Core User Flows
- Signup
- Login
- Candidate dashboard
- Pricing page
- Subscription request
- Receipt upload
- Admin approval
- Wallet credit update
- AI credit deduction
- AI history persistence

## 4. AI Modules
- CareerIQ
- CV Intelligence Pro
- InterviewIQ
- EmployerAI
- Institution Intelligence
- Admin Intelligence
- TalentIQ Copilot
- OperationsAI

## 5. Enterprise
- Create enterprise account
- View enterprise dashboard
- Add members
- Billing
- Activity logs
- Enterprise RLS works

## 6. Admin
- Admin dashboard
- Subscription approvals
- Commercial dashboard
- Operations center
- Admin-only redirect protection

## 7. Security
- RLS policies active
- Admin pages protected
- AI credit enforcement active
- Backend rate limiting active
- Backend user_id validation active
- No service role key exposed in frontend
- Receipt upload limited to safe file types
- CORS production domain confirmed

## 8. Deployment
- Frontend build passes
- Backend starts successfully
- Vercel deploy successful
- Railway deploy successful
- Production URLs tested

## 9. Final Go-Live
- Test with admin account
- Test with student account
- Test with employer account
- Test with institution account
- Test with zero-credit user
- Confirm wallet deduction
- Confirm payment approval
- Confirm AI history persistence
- Confirm admin monitoring works