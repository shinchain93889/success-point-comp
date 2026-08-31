import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle } from 'lucide-react';

const stages = [
  {
    title: 'Stage 1: Basics (Foundation)',
    courses: [
      'Understanding computer hardware and software',
      'Input and output devices',
      'Operating system basics',
      'Typing and keyboard shortcuts',
      'File and folder management',
      'Using Paint, Notepad, Calculator',
    ],
  },
  {
    title: 'Stage 2: Office Productivity',
    courses: [
      'Microsoft Word: Document writing and formatting',
      'Microsoft Excel: Tables, charts, and formulas',
      'Microsoft PowerPoint: Creating engaging presentations',
    ],
  },
  {
    title: 'Stage 3: Internet & Communication',
    courses: [
      'Navigating with web browsers',
      'Effective Google searching',
      'Safe browsing practices',
      'Creating and using email',
      'Downloading and uploading files',
      'Social media and communication apps',
    ],
  },
];

const advancedSkills = [
    {
        title: 'Advanced Professional Computer Skills',
        skills: [
            {
                category: "Operating Systems In-depth",
                points: ["Advanced Windows settings", "Linux basics (commands, terminal)"]
            },
            {
                category: "Computer Hardware",
                points: ["PC Assembly", "Storage, RAM, & CPU concepts", "Basic troubleshooting"]
            },
            {
                category: "Professional Software",
                points: ["Tally ERP 9 and Prime for accounting", "Adobe Photoshop for image editing", "HTML & CSS for web design"]
            }
        ]
    }
]

export default function ServicesPage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold">Our Courses & Skills</h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-primary-foreground/80">
            From foundational knowledge to advanced professional skills, we have a program for you.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Core Curriculum</h2>
                <p className="mt-2 text-lg text-muted-foreground">Our structured learning path to build your computer proficiency.</p>
            </div>
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {stages.map((stage, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="font-headline text-xl hover:no-underline text-primary">
                  {stage.title}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3 pl-4 pt-2">
                    {stage.courses.map((course, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{course}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

            <div className="text-center mt-20 mb-12">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">Advanced & Professional Skills</h2>
                <p className="mt-2 text-lg text-muted-foreground">Take your expertise to the next level with specialized training.</p>
            </div>

            <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
                {advancedSkills.map((advSkill, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="font-headline text-xl hover:no-underline text-primary">
                    {advSkill.title}
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-6 pt-2">
                            {advSkill.skills.map((skill, i) => (
                                <div key={i}>
                                    <h4 className="font-semibold text-lg mb-3 ml-4">{skill.category}</h4>
                                    <ul className="space-y-3 pl-8">
                                        {skill.points.map((point, pIndex) => (
                                            <li key={pIndex} className="flex items-start">
                                                <CheckCircle className="h-5 w-5 text-accent mr-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-muted-foreground">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </div>
      </section>
    </>
  );
}
