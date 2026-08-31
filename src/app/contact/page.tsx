import { Phone, Mail, MapPin } from 'lucide-react';
import ContactForm from '@/components/contact-form';
import WhatsAppIcon from '@/components/icons/whatsapp';

export default function ContactPage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Get In Touch</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-foreground/80">
            We're here to help. Contact us for training, support, or any questions you may have.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
            <div className="space-y-8">
              <div>
                <h2 className="font-headline text-2xl font-bold mb-4">Contact Information</h2>
                <p className="text-muted-foreground">
                  Fill out the form, or reach out to us using the details below. We look forward to hearing from you!
                </p>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-secondary p-3 rounded-full flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Our Office</h3>
                  <p className="text-muted-foreground">Transit camp (Rudrapur) near samsahan ghat</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-secondary p-3 rounded-full flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email Us</h3>
                  <a
                    href="mailto:successpcinstitute@gmail.com"
                    className="text-muted-foreground hover:text-primary transition-colors block"
                  >
                    successpcinstitute@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-secondary p-3 rounded-full flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Call Us</h3>
                  <a
                    href="tel:+918449008009"
                    className="text-muted-foreground hover:text-primary transition-colors block"
                  >
                    +91 8449008009
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#25D366]/15 p-3 rounded-full flex-shrink-0">
                    <WhatsAppIcon className="h-6 w-6 text-[#25D366] fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">WhatsApp Us</h3>
                  <p className="text-muted-foreground">+91 8449008009</p>
                  <a
                    href="https://wa.me/918449008009?text=Hello%20Success%20Point%20Computer,%20I%20have%20an%20enquiry."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-[#25D366] hover:underline mt-1"
                  >
                    Click to Chat on WhatsApp &rarr;
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Find Us on Map</h3>
                <div className="rounded-xl overflow-hidden shadow-md border border-border">
                  <iframe
                    title="Success Point Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3479.8!2d79.4!3d28.97!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a07b0c0c0c0c0d%3A0x0!2sTransit+Camp%2C+Rudrapur%2C+Uttarakhand!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin&q=Transit+camp+Rudrapur+near+samsahan+ghat"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
