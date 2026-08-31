"use server";

import { z } from "zod";
import { sendContactEmails } from "@/lib/mailer";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

type State = {
  success: boolean;
  message: string;
};

export async function submitContactForm(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.issues[0]?.message ?? "Please check the form fields and try again."
    };
  }

  const data = validatedFields.data;
  try {
    await sendContactEmails({
      name: data.name,
      email: data.email,
      message: data.message,
    });
    console.log('Contact email sent successfully for:', data.name, data.email);
  } catch (e) {
    console.error('Failed to send contact email', e);
    return {
      success: false,
      message: 'Sorry, we could not send your message right now. Please try again later or contact us directly.',
    };
  }

  return {
    success: true,
    message: "Thank you for your message! We've emailed a copy and will get back to you shortly.",
  };
}
