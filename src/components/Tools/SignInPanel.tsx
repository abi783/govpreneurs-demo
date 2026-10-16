import { OTPInput, type SlotProps } from "input-otp";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authGoogle, getMe, sendOtp, setToolsToken, updateMe, verifyOtp } from "@/lib/tools/api";
import { refreshToolsAccount } from "@/lib/tools/account";
import { isEmbedMode } from "@/lib/tools/embed";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_TOOLS_CLIENT_ID as string | undefined;
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const RESEND_COOLDOWN_S = 30;

type Step = "email" | "code" | "name";

interface SignInPanelProps {
  title?: string;
  description?: string;
  /** Button label on the email step. Defaults to "Email me my snapshot". */
  emailButtonLabel?: string;
  /** Called once the user is fully signed in (token stored, name collected if needed). */
  onUnlocked: () => void;
  /** Extra work to do once a token exists — e.g. LeadGate's best-effort /lead post. */
  onTokenIssued?: () => void | Promise<void>;
  /** Extra content rendered under the email field — e.g. LeadGate's consent checkbox. */
  belowEmailField?: ReactNode;
  /** Fired after the OTP send call succeeds — e.g. tools_email_submitted. */
  onEmailSubmitted?: () => void;
  /** Fired after the OTP verify call succeeds — e.g. tools_code_verified. */
  onCodeVerified?: () => void;
}

function loadGsiScript(): Promise<void> {
  if (document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
}

/** The official four-colour "G" (Google branding guidelines: unaltered mark on
 *  a white or light button, at least as prominent as other sign-in options). */
export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// input-otp only provides OTPInputContext to `children`; with the `render`
// prop the slots arrive as an argument, so take the slot directly.
function OtpSlot({ slot }: { slot: SlotProps }) {
  return (
    <div
      className="tool-mono"
      style={{
        width: 44,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 600,
        border: `1px solid ${slot.isActive ? "var(--blue-7)" : "var(--n-5)"}`,
        borderRadius: "var(--r-sm)",
        boxShadow: slot.isActive ? "0 0 0 3px var(--blue-2)" : undefined,
        background: "var(--surface)",
        transition: "border-color var(--d-fast) var(--ease), box-shadow var(--d-fast) var(--ease)",
      }}
    >
      {slot.char}
      {slot.hasFakeCaret && (
        <div style={{ width: 1, height: 20, background: "var(--text)", position: "absolute" }} />
      )}
    </div>
  );
}

export function SignInPanel({
  title = "Sign in",
  description,
  emailButtonLabel = "Email me my snapshot",
  onUnlocked,
  onTokenIssued,
  belowEmailField,
  onEmailSubmitted,
  onCodeVerified,
}: SignInPanelProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleAvailable, setGoogleAvailable] = useState(!!GOOGLE_CLIENT_ID);
  const [googleBlocked, setGoogleBlocked] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const finishAuth = async (token: string) => {
    setToolsToken(token);
    await onTokenIssued?.();
    try {
      const me = await getMe();
      if (!me.name) {
        setStep("name");
        return;
      }
    } catch {
      /* if /me fails here, fall through and unlock anyway — token is stored */
    }
    void refreshToolsAccount();
    onUnlocked();
  };

  useEffect(() => {
    if (step !== "email" || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          callback: async (resp: { credential: string }) => {
            setBusy(true);
            setError(null);
            try {
              const { token } = await authGoogle(resp.credential);
              await finishAuth(token);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in failed");
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "left",
          // GIS caps width at 400; the slot centres it on wider panels.
          width: Math.min(400, googleBtnRef.current.clientWidth || 400),
        });
      })
      .catch(() => setGoogleAvailable(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendOtp(email);
      setStep("code");
      setCooldown(RESEND_COOLDOWN_S);
      onEmailSubmitted?.();
    } catch (e) {
      if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 429) {
        setError("Too many requests — try again in a bit.");
      } else {
        setError(e instanceof Error ? e.message : "Could not send code");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async (submittedCode: string) => {
    setBusy(true);
    setError(null);
    try {
      const { token } = await verifyOtp(email, submittedCode);
      onCodeVerified?.();
      await finishAuth(token);
    } catch (e) {
      if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 429) {
        setError("Too many attempts — try again in a bit.");
      } else {
        setError(e instanceof Error ? e.message : "That code is wrong or has expired.");
      }
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveName = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateMe(name.trim());
      void refreshToolsAccount();
      onUnlocked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your name");
    } finally {
      setBusy(false);
    }
  };

  const openInNewTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("embed");
    window.open(url.toString(), "_blank", "noopener");
  };

  const panelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--s-3)",
  };

  if (step === "email") {
    return (
      <div style={panelStyle}>
        {(title || description) && (
          <div>
            {title && <div className="t-heading">{title}</div>}
            {description && (
              <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-1)" }}>
                {description}
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="t-body-sm" style={{ color: "var(--urg-7)" }}>
            {error}
          </p>
        )}
        {/* Google first: one click, verified email, name for free. When the
            client id is configured the official Google button renders into
            the ref; otherwise a same-shaped button explains the state. */}
        {!googleBlocked && (
          <div className="tool-google-slot">
            {googleAvailable ? (
              <div ref={googleBtnRef} className="tool-google-gsi" />
            ) : (
              <button
                type="button"
                className="tool-google-btn"
                onClick={() => setError("Google sign-in is being set up — use your email for now.")}
              >
                <GoogleG />
                <span>Continue with Google</span>
              </button>
            )}
          </div>
        )}
        {!googleBlocked && (
          <div className="tool-or-divider t-caption" aria-hidden>
            <span>or use your email</span>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && email.includes("@")) void handleSendCode();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}
        >
          <Input
            aria-label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <Button type="submit" disabled={busy || !email.includes("@")}>
            {emailButtonLabel}
          </Button>
        </form>
        <p className="t-body-sm" style={{ color: "var(--n-8)" }}>
          We'll send a 6-digit code — no password, no card. Unsubscribe any time.
        </p>
        {belowEmailField}
        {googleAvailable && !googleBlocked && isEmbedMode() && (
          <button
            type="button"
            onClick={() => setGoogleBlocked(true)}
            className="t-body-sm"
            style={{
              color: "var(--n-8)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Trouble signing in with Google?
          </button>
        )}
        {googleBlocked && isEmbedMode() && (
          <button type="button" onClick={openInNewTab} className="btn btn-secondary btn-sm">
            Open in a new tab
          </button>
        )}
      </div>
    );
  }

  if (step === "code") {
    return (
      <div style={panelStyle}>
        <div className="t-heading">Enter the 6-digit code</div>
        <p className="t-body-sm" style={{ color: "var(--n-8)" }}>
          Sent to {email}
        </p>
        {error && (
          <p className="t-body-sm" style={{ color: "var(--urg-7)" }}>
            {error}
          </p>
        )}
        <OTPInput
          maxLength={6}
          value={code}
          onChange={setCode}
          onComplete={(val) => void handleVerifyCode(val)}
          inputMode="numeric"
          containerClassName="tools-otp"
          disabled={busy}
          render={({ slots }) => (
            <div style={{ display: "flex", gap: "var(--s-2)", position: "relative" }}>
              {slots.map((slot, i) => (
                <OtpSlot key={i} slot={slot} />
              ))}
            </div>
          )}
        />
        <button
          type="button"
          onClick={() => cooldown === 0 && void handleSendCode()}
          disabled={cooldown > 0 || busy}
          className="t-body-sm"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            textAlign: "left",
            color: cooldown > 0 ? "var(--n-8)" : "var(--blue-7)",
            cursor: cooldown > 0 ? "default" : "pointer",
          }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div className="t-heading">What should we call you?</div>
      {error && (
        <p className="t-body-sm" style={{ color: "var(--urg-7)" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: "var(--s-2)" }}>
        <Input
          aria-label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          autoFocus
        />
        <Button onClick={handleSaveName} disabled={busy || !name.trim()}>
          Continue
        </Button>
      </div>
    </div>
  );
}
