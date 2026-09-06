import json
import os
import smtplib
from email.mime.text import MIMEText

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="ESTROC AI Backend")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class EnquiryRequest(BaseModel):
    fullName: str
    email: str
    company: str = ""
    phone: str = ""
    services: list[str] = []
    details: str = ""
    stage: str = ""
    budget: str = ""
    timeline: str = ""
    referral: str = ""
    notes: str = ""


WEBSITE_CONTEXT = """ESTROC — premium technology / product studio. Tagline: "We build what comes next."

ESTROC builds digital products, custom software and AI-powered solutions for businesses, startups and founders — from the first idea through to a production-ready product.

WHAT WE BUILD
1. Digital Products — Websites, Web Apps, Mobile Apps, SaaS Products, MVP Development
2. Business Software — Custom Software, CRM Systems, APIs & Integrations, WhatsApp Solutions
3. AI & Automation — AI Solutions, AI Chatbots, Custom AI Agents, Workflow Automation
4. Emerging Technology — Blockchain, Advanced Custom Solutions, and other emerging technologies

WHY ESTROC
- Build from the idea: works from the idea stage, turning early concepts into clear, buildable digital products.
- Product + technology: design, development, software engineering and AI come together under one team.
- Built around your needs: no rigid packages or one-size-fits-all solutions — every product is built around the actual business requirement.
- Ready to move forward: from MVPs to production-ready platforms, built with real-world usability, performance and future growth in mind.

HOW WE WORK (five-stage process)
1. Discover — understand the idea, business goals, users and requirements.
2. Define — turn requirements into a clear product direction, scope and roadmap.
3. Design — create the user experience, interface and product architecture before development.
4. Build — develop, integrate, test and refine the product using the right technology.
5. Launch — deploy the product, monitor the experience and make the final improvements.

OUR WORK (shipped projects)
- RAVE LUX — luxury e-commerce / digital product experience. Live: https://ravelux-app.vercel.app/
- TRUESIGN MEDIA — outdoor advertising & billboard solutions platform. (Link pending)
- NewAgeNaukri.online — job / recruitment platform. Live: https://newagenaukri.online/
- CYBER VAULT — secure backend system. Live: https://cyber-vault.vercel.app/
- TRUSTLENS — secure intelligence & document verification product. Live: https://trust-lens-one.vercel.app/
- AUTOMAN — industrial admin assistant / AI chatbot. (Link pending)

CONTACT
- Email: hello@estroc.com
- There are no published client testimonials on the site yet — if asked, say references and case studies can be shared directly rather than inventing quotes."""

SYSTEM_PROMPT = f"""You are the ESTROC AI agent, embedded in a chat widget on the ESTROC studio website. You know the website inside out — use the knowledge below to answer any question a visitor has about ESTROC accurately. Never invent services, projects, pricing or testimonials that aren't listed here.

{WEBSITE_CONTEXT}

Your two jobs, in order of priority:
1. Answer questions about ESTROC — what it builds, how it works, past projects, how to get in touch — using only the knowledge above.
2. Guide the conversation toward understanding what the visitor wants to build, then capture their project brief.

Rules:
- Keep every reply short — two to four sentences, warm and direct, no corporate filler.
- Ask one or two questions at a time. Never dump a long list of questions at once.
- Over the course of the conversation, find out: what they're building, their full name, their email (required so the team can follow up), and ideally their company, budget range and timeline.
- Once you have at least their name, email, and a clear idea of what they want built, call the submit_lead function with everything gathered so far. Do not call it before that.
- After calling submit_lead, send a short closing message thanking them and letting them know the team will follow up.
- If a question is outside what you know about ESTROC, say so plainly and point them to hello@estroc.com rather than guessing."""

SUBMIT_LEAD_TOOL = {
    "type": "function",
    "function": {
        "name": "submit_lead",
        "description": "Call once enough information has been gathered about the visitor's project to hand off to the ESTROC team.",
        "parameters": {
            "type": "object",
            "properties": {
                "fullName": {"type": "string"},
                "email": {"type": "string"},
                "company": {"type": "string"},
                "phone": {"type": "string"},
                "services": {"type": "array", "items": {"type": "string"}},
                "details": {"type": "string"},
                "stage": {"type": "string"},
                "budget": {"type": "string"},
                "timeline": {"type": "string"},
                "notes": {"type": "string"},
            },
            "required": ["fullName", "email", "services", "details"],
        },
    },
}


@app.get("/health")
def health():
    return {"status": "ok"}


def build_enquiry_email(form: EnquiryRequest) -> str:
    return "\n".join(
        [
            f"Name:      {form.fullName}",
            f"Email:     {form.email}",
            f"Company:   {form.company or '—'}",
            f"Phone:     {form.phone or '—'}",
            f"Services:  {', '.join(form.services) or '—'}",
            f"Stage:     {form.stage or '—'}",
            f"Budget:    {form.budget or '—'}",
            f"Timeline:  {form.timeline or '—'}",
            f"Referral:  {form.referral or '—'}",
            "",
            "Project details",
            form.details or "—",
            "",
            "Additional notes",
            form.notes or "—",
        ]
    )


@app.post("/api/enquiry")
def enquiry(form: EnquiryRequest):
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_APP_PASSWORD")
    recipient = os.getenv("RECIPIENT_EMAIL")

    if not smtp_user or not smtp_password or not recipient:
        print("ENQUIRY FAILED: email env vars missing", flush=True)
        raise HTTPException(status_code=500, detail="Email delivery is not configured on the server.")

    message = MIMEText(build_enquiry_email(form))
    message["Subject"] = f"New project enquiry — {form.fullName}" + (f" ({form.company})" if form.company else "")
    message["From"] = smtp_user
    message["To"] = recipient
    message["Reply-To"] = form.email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [recipient], message.as_string())
    except Exception as exc:
        import traceback

        print("SMTP SEND ERROR:", flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not send the enquiry email. Please try again.") from exc

    return {"ok": True}


@app.post("/api/chat")
def chat(request: ChatRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured on the server.")

    try:
        completion = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}]
            + [message.model_dump() for message in request.messages],
            tools=[SUBMIT_LEAD_TOOL],
            tool_choice="auto",
        )
    except Exception as exc:
        print(f"OpenAI chat error: {exc!r}")
        raise HTTPException(
            status_code=500, detail="The AI agent is unavailable right now. Please try again."
        ) from exc

    choice = completion.choices[0]
    tool_calls = choice.message.tool_calls or []
    submit_call = next((call for call in tool_calls if call.function.name == "submit_lead"), None)

    if submit_call:
        try:
            lead = json.loads(submit_call.function.arguments)
        except json.JSONDecodeError:
            lead = None
        return {
            "reply": choice.message.content
            or "Thanks — I've got everything I need. The team will be in touch shortly.",
            "lead": lead,
        }

    return {"reply": choice.message.content or ""}
