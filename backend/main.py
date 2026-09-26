import json
import os
import smtplib
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
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
    visitor: dict[str, str] = Field(default_factory=dict)


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
- TRUESIGN MEDIA (formerly Sell Ads) — outdoor advertising / OOH media platform: premium hoardings and billboards across Nagpur, Amravati, Chandrapur and Wardha, with a searchable site catalogue and rate enquiries. Live: https://truesignmedia.com/
- RAVE LUX — luxury e-commerce / digital product experience. Live: https://ravelux-app.vercel.app/
- NewAgeNaukri.online — job / recruitment platform. Live: https://newagenaukri.vercel.app/
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
- The visitor has already provided their basic contact details before entering the project discussion.
- Their name, email, phone number and company are supplied separately as visitor context.
- Do not ask again for their name, email or phone number unless they explicitly want to change them.
- Focus the conversation on understanding their project.
- Find out what they want to build, their requirements, relevant services, current project stage, budget range and timeline where appropriate.
- Ask only one or two questions at a time. Do not dump a long list of questions.
- Do not call submit_lead immediately after receiving the visitor's contact details.
- Continue the project discussion until you have a clear understanding of what the visitor wants to build.
- Once you have enough useful project information, call the submit_lead function with the visitor's contact details and the project information gathered during the conversation.
- The visitor's phone number must be included in the lead.
- After calling submit_lead, send a short closing message thanking the visitor and letting them know the ESTROC team will follow up.
- If a question is outside what you know about ESTROC, say so plainly and point them to hello@estroc.co.in rather than guessing."""


SUBMIT_LEAD_TOOL = {
    "type": "function",
    "function": {
        "name": "submit_lead",
        "description": (
            "Call this function only after enough information has been gathered "
            "about the visitor's project. Submit the visitor's contact details "
            "together with the project brief to the ESTROC team."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "fullName": {
                    "type": "string",
                    "description": "Visitor's full name."
                },
                "email": {
                    "type": "string",
                    "description": "Visitor's email address."
                },
                "phone": {
                    "type": "string",
                    "description": "Visitor's phone number."
                },
                "company": {
                    "type": "string",
                    "description": "Visitor's company or organisation, if provided."
                },
                "services": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": (
                        "ESTROC services relevant to the visitor's project, "
                        "for example website development, mobile app development, "
                        "SaaS, AI, custom software, automation, etc."
                    )
                },
                "details": {
                    "type": "string",
                    "description": (
                        "A clear summary of what the visitor wants to build, "
                        "including important requirements discussed."
                    )
                },
                "stage": {
                    "type": "string",
                    "description": (
                        "Current stage of the project, such as idea, planning, "
                        "MVP, existing product, redesign, or scaling."
                    )
                },
                "budget": {
                    "type": "string",
                    "description": "Budget range mentioned by the visitor, if any."
                },
                "timeline": {
                    "type": "string",
                    "description": "Expected or desired project timeline, if mentioned."
                },
                "notes": {
                    "type": "string",
                    "description": (
                        "Any additional useful information from the project discussion."
                    )
                }
            },
            "required": [
                "fullName",
                "email",
                "phone",
                "services",
                "details"
            ]
        }
    }
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


def sse(event: dict) -> str:
    """One server-sent event. The widget reads these as they land."""
    return f"data: {json.dumps(event)}\n\n"


def chat_events(payload: ChatRequest):
    """Streams the model's answer as it is generated.

    The whole reply used to be awaited before anything reached the visitor,
    which read as a long dead pause in the widget. Text now goes out token by
    token; the submit_lead tool call can't be — its arguments arrive as JSON
    fragments — so those are accumulated and sent as one `lead` event at the end,
    which is also where the frontend fires the enquiry email.
    """
    tool_names: dict[int, str] = {}
    tool_args: dict[int, str] = {}
    streamed_any_text = False

    try:
        stream = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}]
            + [message.model_dump() for message in payload.messages],
            tools=[SUBMIT_LEAD_TOOL],
            tool_choice="auto",
            stream=True,
            # gpt-5-nano is a reasoning model: on the default ("medium") effort
            # it thinks for ~12s before the first token, while the answer itself
            # takes under half a second to generate. This is an intake chat with
            # a short, well-specified script — it doesn't need that budget.
            # Measured: ~12.0s to first token on medium, ~4.0s on low.
            # extra_body because the pinned openai SDK (1.57.4) predates the
            # typed parameter; it becomes reasoning_effort="low" after an upgrade.
            extra_body={"reasoning_effort": "low"},
        )

        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta

            if delta.content:
                streamed_any_text = True
                yield sse({"type": "delta", "text": delta.content})

            for call in delta.tool_calls or []:
                if call.function is None:
                    continue
                if call.function.name:
                    tool_names[call.index] = call.function.name
                if call.function.arguments:
                    tool_args[call.index] = tool_args.get(call.index, "") + call.function.arguments
    except Exception as exc:
        print(f"OpenAI chat error: {exc!r}")
        yield sse({"type": "error", "error": "The AI agent is unavailable right now. Please try again."})
        return

    lead = None
    for index, name in tool_names.items():
        if name == "submit_lead":
            try:
                lead = json.loads(tool_args.get(index, ""))
            except json.JSONDecodeError:
                lead = None
            break

    if not streamed_any_text:
        # The model answered with the tool call alone (or with nothing at all).
        yield sse(
            {
                "type": "delta",
                "text": "Thanks — I've got everything I need. The team will be in touch shortly."
                if lead
                else "…",
            }
        )

    if lead:
        yield sse({"type": "lead", "lead": lead})

    yield sse({"type": "done"})


@app.post("/api/chat")
@limiter.limit("10/minute")
def chat(request: Request, payload: ChatRequest):
    if client is None:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured on the server.")

    return StreamingResponse(
        chat_events(payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            # Stops nginx/App Runner style proxies buffering the whole response
            # and undoing the streaming.
            "X-Accel-Buffering": "no",
        },
    )


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
