**AI Email Bot \- Internal BRD**

**Problem Statement:**

We are looking for someone to build a small, efficient AI bot that can take a targeted list of businesses and automatically generate and send personalized outreach emails, track responses, and support lead conversion.

This is not a large-scale SaaS build. This is a lean, high-impact internal tool focused on speed, execution, and results.

**What You Will Build**

You will develop a lightweight system that:

* Accepts uploaded lead lists (Google Sheets)  
* Uses AI to generate personalized outreach emails based on:  
  * Business type  
  * Location  
  * Context/notes  
  * Sends emails through an integrated platform (**Gmail API**)  
* Tracks:  
  * Sent emails  
  * Business/Client Opens  
  * Replies  
  * Follow-ups  
  * Automates simple follow-up sequences (e.g., Day 3, Day 7\)  
  * Flags interested leads for manual follow-up and call scheduling

---

1. **Objective**

Build a **lean, high-impact AI-powered outreach automation tool** that enables users to:

1. Upload targeted lead lists  
2. Generate **hyper-personalized outreach emails using AI**  
3. Automate sending \+ follow-ups  
4. Track engagement (opens, replies, conversions)  
5. Identify and prioritize **high-intent leads**

**Core Goal:**  
Maximize **lead conversion efficiency** with minimal manual effort.

2. **User Pain Point**

1. Outbound sales today are:  
   1. Manual and time-consuming  
   2. Poorly personalized → low response rates  
   3. Lacks structured tracking and follow-up discipline  
        
2. SMBs and operators need:  
   1. Faster execution  
   2. Higher personalization at scale  
   3. Clear visibility into pipeline performance  
    


3. **Success Metrics (KPIs)**

| Metric | Target |
| ----- | ----- |
| Email Open Rate | \>40% |
| Reply Rate | \>10–15% |
| Conversion Rate (Call booked) | \>5% |
| Time to First Outreach | \<10 mins from upload |
| Follow-up Compliance | 100% automated |

---

**4\. Scope of Work**

**In Scope**

1. **Lead Input**

1. Upload via:

1. Google Sheets (link-based)

2. Fields supported:

1. First Name  
2. Last Name  
3. Job Title  
4. Company Name  
5. Email  
6. Sector / Business Category  
7. Location \- City, Zipcode, Country  
8. Linked URL  
9. Notes / Context

   

   2. **AI Email Generation**

   

   1. System generates personalized emails based on:  
1. Business category   
2. Geo-context (city, zipcode, country)  
3. Lead-specific notes

   

   2. Output:  
1. Subject line  
2. Email body  
3. Call To Action (CTA) (call booking/reply)

   

   

   

   

   3. **Email Sending Integration**  
1. Integrations:  
1. Gmail API (preferred for MVP)  
2. Optional: SendGrid / Zoho (out of scope)  
2. Capabilities:  
1. Bulk sending (rate-limited)  
2. Sender identity configuration

   

   4. **Tracking System**  
1. Track for each lead:

| Metric | Description |
| :---- | :---- |
| Sent | Email successfully delivered |
| Open | Email opened (pixel tracking) |
| Reply | Response received |
| Follow-up | Triggered sequence |
| Status | Interested / Not Interested / No Response |

   

   5. **Follow-up Automation**  
1. Predefined sequences:  
1. Day 3 → Follow-up \#1  
2. Day 7 → Follow-up \#2  
2. Dynamic logic:  
1. Stop if a reply is received  
2. Continue if no response  
     
   6. **Lead Qualification Layer**  
1. System flags:  
1. Hot Leads → Replied / Positive signal  
2. **Warm Leads** → Opened but no reply  
3. **Cold Leads** → No engagement  
     
   7. **Dashboard (Basic)**  
1. Minimal UI:  
1. Upload leads  
2. View campaign status  
3. Track performance  
4. Export results

**5\. Out of Scope (Strict)**

1. CRM-level functionality  
2. Complex campaign builder  
3. Multi-channel outreach (LinkedIn, WhatsApp, etc.)  
4. Advanced analytics dashboards  
5. A/B testing engine  
6. Multi-user system / auth

---

**6\. Target Users**

| Persona | Use Case |
| :---- | :---- |
| Founder | Generate leads quickly |
| Sales Operator | Run outreach campaigns |
| Agency | Scale outbound for clients |

**7\. End-to-End Workflow**

| Step No | Stage | Actor | Action | System Behavior | Output |
| :---: | ----- | ----- | ----- | ----- | ----- |
| 1 | Input | User | Uploads Google Sheet with lead data | Parses file and validates fields (Name, Email, Type, Location, Notes) | Structured lead dataset |
| 2 | Processing | System | Reads and organizes lead data | Cleans data, removes duplicates, prepares for AI processing | Clean lead list |
| 3 | AI Generation | System (LLM) | Generates personalized email per lead | Uses prompt with business type, location, and notes | Subject line \+ Email body |
| 4 | Review (Optional) | User | Reviews generated emails (if enabled) | Displays preview of generated emails | Approved email content |
| 5 | Sending | System | Sends emails via integrated API (Gmail) | Applies rate limits and logs send status | Emails sent successfully |
| 6 | Tracking | System | Monitors email activity | Tracks opens, replies, delivery status | Engagement data |
| 7 | Follow-ups | System | Triggers follow-up emails (Day 3, Day 7\) | Checks conditions (no reply → send follow-up) | Follow-up emails sent |
| 8 | Lead Classification | System | Categorizes leads based on engagement | Labels leads as Hot / Warm / Cold | Prioritized lead list |

**8\. Functional Requirements**

| Module | Requirement |
| :---- | :---- |
| Input | Accept CSV \+ Sheets |
| AI Engine | Generate contextual emails |
| Email API | Send emails reliably |
| Tracker | Capture opens, replies |
| Scheduler | Trigger follow-ups |
| Dashboard | Show campaign metrics |

**9\. Non-Functional Requirements**

| Category | Requirement |
| :---- | :---- |
| Speed | \<2 sec per email generation |
| Reliability | Retry failed sends |
| Scalability | Handle 1K–5K leads per batch |
| Security | No storage of sensitive credentials |
| Cost | Keep infra \< $50/month initially |

**10\. Tech Stack (Recommended) \- SK & VO to confirm**

| Layer | Tech |
| :---- | :---- |
| Frontend | Streamlit / Simple React |
| Backend | Python (FastAPI) |
| AI | OpenAI / Claude |
| Email | Gmail API |
| DB | SQLite (MVP) |
| Scheduler | Cron / Celery |

**11\. Prompt Design (Critical Component)**

1. **System Prompt**

1. Role: “Expert B2B cold email copywriter”

2. Tone: Personalized, non-generic, concise

3. Goal: Drive reply

2. **Input Variables**

1. Business Type

2. Location

3. Notes

3. **Output Structure**

1. Subject (short, curiosity-driven)

2. Opening personalization

3. Value proposition

4. CTA

**12\. Lean QA Checklist**

| Test Case | Expected Result |
| :---- | :---- |
| Small list (5 leads) | Works correctly |
| Large list (1000 leads) | No crash |
| Email generation | Relevant \+ non-generic |
| Sending | No API failures |
| Tracking | Events captured |
| Follow-up | Triggered correctly |

---

**13\. Delivery Package**

1. Working MVP (hosted or local)

2. Demo video (2–3 mins):

   1. Upload → Generate → Send → Track

3. README:

   1. Setup instructions

   2. Usage flow

   3. Prompt logic

4. Known limitations

---

**14\. Risks & Mitigation \- For JJ \- these should be your edge use cases**

| Risk | Mitigation |
| :---- | :---- |
| Spam classification | Use warm email \+ throttling |
| Poor personalization | Improve prompt templates |
| API limits | Batch \+ retry logic |
| Low reply rates | Iterate messaging |

---

**15\. Phase 2 (Production Roadmap)**

| S.No | Feature | Details | Impact |
| :---- | :---- | :---- | :---- |
| 1 | A/B Testing | Test subject lines | Improve conversions |
| 2 | CRM Integration | HubSpot, Zoho | Pipeline visibility |
| 3 | Multi-channel | LinkedIn \+ WhatsApp | Higher reach |
| 4 | Smart Personalization | Website scraping | Deep relevance |
| 5 | Analytics | Funnel dashboard | Decision making |
| 6 | Lead Scoring AI | Predict conversion | Prioritization |
| 7 | Inbox Management | Reply classification | Automation |

---

