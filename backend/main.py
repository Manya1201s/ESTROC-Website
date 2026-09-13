import json
import os
import smtplib
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import OpenAI
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

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


def get_client_ip(request: Request) -> str:
    # Behind App Runner / a load balancer, request.client.host is the proxy's
    # address — the real visitor IP is the first entry in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class EnquiryRequest(BaseModel):
    # Only what the project form collects. Anything else a client sends is
    # ignored and never reaches the email. The caps keep one request from
    # stuffing the inbox.
    interests: list[str] = Field(default_factory=list, max_length=20)
    stage: str = Field(default="", max_length=80)
    budget: str = Field(default="", max_length=80)
    fullName: str = Field(max_length=200)
    email: str = Field(max_length=320)
    phone: str = Field(default="", max_length=40)
    message: str = Field(default="", max_length=5000)


WEBSITE_CONTEXT = """ESTROC — technology studio. Tagline: "We build what comes next." Positioning: "From idea to production."

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

HOW WE WORK (six-stage process)
1. Discover — understand the idea, business goals, users and requirements.
2. Define — turn requirements into a clear product direction, scope and roadmap.
3. Design — create the user experience, interface and product architecture before development.
4. Build — develop, integrate, test and refine the product using the right technology.
5. Launch — deploy the product, monitor the experience and make the final improvements.
6. Evolve — maintain, monitor and keep improving the product: new features, scale and security as the business grows.

OUR WORK (shipped projects)
- RAVE LUX — luxury e-commerce / digital product experience. Live: https://ravelux-app.vercel.app/
- NewAgeNaukri.online — job / recruitment platform. Live: https://newagenaukri.online/
- CYBER VAULT — secure backend system. Live: https://cyber-vault.vercel.app/
- TRUSTLENS — secure intelligence & document verification product. Live: https://trust-lens-one.vercel.app/

CONTACT
- Email: hello@estroc.co.in
- Website: https://estroc.co.in
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
- If a question is outside what you know about ESTROC, say so plainly and point them to hello@estroc.co.in rather than guessing."""

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
            f"Interested in:  {', '.join(form.interests) or '—'}",
            f"Stage:          {form.stage or '—'}",
            f"Budget:         {form.budget or '—'}",
            f"Name:           {form.fullName}",
            f"Email:          {form.email}",
            f"Mobile:         {form.phone or '—'}",
            "",
            "Message",
            form.message or "—",
        ]
    )


@app.post("/api/enquiry")
@limiter.limit("5/minute")
def enquiry(request: Request, form: EnquiryRequest):
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_APP_PASSWORD")
    recipient = os.getenv("RECIPIENT_EMAIL")

    if not smtp_user or not smtp_password or not recipient:
        print("ENQUIRY FAILED: email env vars missing", flush=True)
        raise HTTPException(status_code=500, detail="Email delivery is not configured on the server.")

    message = MIMEText(build_enquiry_email(form))
    message["Subject"] = f"New project enquiry — {form.fullName}"
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
@limiter.limit("10/minute")
def chat(request: Request, payload: ChatRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured on the server.")

    try:
        completion = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}]
            + [message.model_dump() for message in payload.messages],
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


# The Docker image builds the frontend into ./static (see Dockerfile) so this
# one backend serves both the API and the site — nothing to mount when running
# locally without a build (./static won't exist).
STATIC_DIR = (Path(__file__).parent / "static").resolve()

if STATIC_DIR.is_dir():

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        candidate = (STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and candidate.is_relative_to(STATIC_DIR):
            headers = (
                {"Cache-Control": "public, max-age=31536000, immutable"}
                if full_path.startswith("assets/")
                else None
            )
            return FileResponse(candidate, headers=headers)
        # Unknown path (e.g. a client-side route) or "/" itself — hand back the
        # SPA shell and let react-router take it from there.
        return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-cache"})
