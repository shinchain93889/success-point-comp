import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import team1 from '../../../img/team1.png';
import team2 from '../../../img/team2.png';
import team3 from '../../../img/team3.png';
import img1 from '../../../img/img1.jpg';
import img2 from '../../../img/img2.jpg';
import img3 from '../../../img/img3.jpg';

const teamMembers = [
  {
    name: 'Prakash vairagi',
    role: 'Founder & Lead Instructor',
    image: team3,
  },
  {
    name: 'Somender',
    role: 'Head Technician',
    image: team2,
  },
  {
    name: 'Yogesh',
    role: 'Customer Support Specialist',
    image: team1,
  },
];

export default function AboutPage() {
  const gallery = [
    { src: img1, alt: 'Training session' },
    { src: img2, alt: 'Repair workspace' },
    { src: img3, alt: 'Student collaboration' },
  ];
  return (
    <>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">
            About Success Point Computer
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-primary-foreground/80">
            Dedicated to demystifying technology and empowering our community
            through education and reliable service.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-3xl font-bold mb-4 text-primary">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                Our goal is to make technology easy for everyone. We offer
                top-notch computer classes and reliable tech support to help you
                learn and succeed.
              </p>
              <p className="text-lg text-muted-foreground">
                It doesn't matter if you're new to computers or a business
                needing IT help, we're here for you. We provide a friendly and
                supportive space to learn skills that you can use every day.
              </p>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden shadow-xl">
              <Image
                src={img1}
                alt="Team working together"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">
              Meet Our Team
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              The experts dedicated to your success.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map(member => (
              <Card
                key={member.name}
                className="text-center overflow-hidden transition-shadow duration-300 hover:shadow-xl"
              >
                <CardHeader className="p-0">
                  {member.image && (
                    <div className="relative h-64 w-full">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover object-[center_20%]"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="font-headline text-xl">
                    {member.name}
                  </CardTitle>
                  <p className="text-accent font-semibold">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities / Highlights strip */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="font-headline text-2xl md:text-3xl font-bold text-center mb-6">
            Facilities & Moments
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((g, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] overflow-hidden rounded-lg shadow"
              >
                <Image
                  src={g.src}
                  alt={g.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
