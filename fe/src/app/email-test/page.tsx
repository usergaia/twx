import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTestForm } from "@/components/forms/email-test-form";
import { PageHeader } from "@/components/common/page-header";

export default function EmailTestPage() {
  return (
    <div>
      <PageHeader
        title="Email Webhook Test"
        description="POSTs to the n8n form-submit webhook and dispatches an email via MailHog."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Submit a test order</CardTitle>
          <CardDescription>
            Fill in the form and submit. Check MailHog at{" "}
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              localhost:8025
            </a>{" "}
            to verify the email landed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTestForm />
        </CardContent>
      </Card>
    </div>
  );
}
