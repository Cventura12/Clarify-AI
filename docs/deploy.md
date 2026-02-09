# Deploy to Vercel

Prereqs
- GitHub repo for this project
- Vercel account

Steps
1. Push to GitHub.
2. Import the repo in Vercel.
3. Set Environment Variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `AUTH_DEMO_EMAIL`
   - `AUTH_DEMO_PASSWORD`
   - `LLM_API_KEY` (when ready)
4. Deploy.

Notes
- The build uses `npm run build` and outputs `.next`.
- Ensure NEXTAUTH_URL matches your Vercel domain.
