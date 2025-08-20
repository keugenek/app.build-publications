import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { JobListing } from '../../../server/src/schema';

interface SampleJobsProviderProps {
  onLoadSampleJobs: (jobs: JobListing[]) => void;
  hasExistingJobs: boolean;
}

const sampleJobs: JobListing[] = [
  {
    id: 1,
    job_title: "Senior Software Engineer",
    company_name: "TechFlow Solutions",
    engineering_discipline: "Software",
    location: "San Francisco, CA",
    job_description: "We're looking for a passionate Senior Software Engineer to join our growing team. You'll work on cutting-edge web applications using React, Node.js, and cloud technologies.\n\nResponsibilities:\n• Lead development of scalable web applications\n• Mentor junior developers\n• Collaborate with product and design teams\n• Contribute to architectural decisions\n\nRequirements:\n• 5+ years of software development experience\n• Strong knowledge of JavaScript, TypeScript\n• Experience with React, Node.js\n• Cloud platform experience (AWS, Azure, or GCP)",
    application_link: "https://techflow.com/careers/senior-software-engineer",
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 2,
    job_title: "Electrical Design Engineer",
    company_name: "PowerGrid Innovations",
    engineering_discipline: "Electrical",
    location: "Austin, TX",
    job_description: "Join our team as an Electrical Design Engineer working on next-generation power distribution systems. This role offers excellent growth opportunities in the renewable energy sector.\n\nKey Responsibilities:\n• Design electrical systems for commercial and industrial projects\n• Perform load calculations and circuit analysis\n• Create detailed engineering drawings using AutoCAD\n• Collaborate with project managers and field teams\n\nQualifications:\n• Bachelor's degree in Electrical Engineering\n• 3+ years of power systems design experience\n• Professional Engineer (PE) license preferred\n• Knowledge of NEC and local electrical codes",
    application_link: "mailto:careers@powergridinnovations.com",
    created_at: new Date('2024-01-14'),
    updated_at: new Date('2024-01-16')
  },
  {
    id: 3,
    job_title: "Mechanical Design Engineer",
    company_name: "Advanced Manufacturing Corp",
    engineering_discipline: "Mechanical",
    location: "Detroit, MI",
    job_description: "Exciting opportunity for a Mechanical Design Engineer to work on innovative automotive components. You'll be part of a dynamic team developing solutions for electric vehicle applications.\n\nWhat You'll Do:\n• Design mechanical components and assemblies\n• Perform FEA and thermal analysis\n• Create 3D models and technical drawings\n• Support prototype testing and validation\n• Work closely with manufacturing teams\n\nRequirements:\n• BS in Mechanical Engineering\n• 2-5 years of design experience\n• Proficiency in SolidWorks or similar CAD software\n• Understanding of manufacturing processes\n• Experience with electric vehicle components is a plus",
    application_link: "https://careers.advancedmfg.com/apply/mech-engineer-2024",
    created_at: new Date('2024-01-12'),
    updated_at: new Date('2024-01-12')
  },
  {
    id: 4,
    job_title: "Civil Infrastructure Engineer",
    company_name: "Urban Planning Associates",
    engineering_discipline: "Civil",
    location: "Seattle, WA",
    job_description: "We're seeking a Civil Infrastructure Engineer to work on major urban development projects. This role offers the opportunity to shape the future of sustainable city infrastructure.\n\nResponsibilities:\n• Design transportation and utility infrastructure\n• Perform hydraulic and structural analysis\n• Manage project timelines and budgets\n• Coordinate with municipal agencies\n• Ensure compliance with environmental regulations\n\nQualifications:\n• Bachelor's degree in Civil Engineering\n• PE license required\n• 4+ years of infrastructure design experience\n• Knowledge of sustainable design practices\n• Experience with GIS and design software",
    application_link: "https://urbanplanning.com/jobs/civil-engineer",
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-13')
  },
  {
    id: 5,
    job_title: "Aerospace Systems Engineer",
    company_name: "SkyTech Aerospace",
    engineering_discipline: "Aerospace",
    location: "Remote (US)",
    job_description: "Join our mission to advance commercial space technology as an Aerospace Systems Engineer. You'll work on satellite systems and launch vehicle components from anywhere in the US.\n\nKey Duties:\n• Design and analyze spacecraft subsystems\n• Perform mission planning and trajectory analysis\n• Conduct systems integration and testing\n• Support launch operations and mission control\n• Collaborate with cross-functional engineering teams\n\nRequired Skills:\n• MS in Aerospace Engineering or related field\n• 3+ years of aerospace systems experience\n• Knowledge of orbital mechanics and spacecraft design\n• Experience with MATLAB/Simulink\n• Security clearance eligibility preferred",
    application_link: "mailto:hr@skytechaerospace.com",
    created_at: new Date('2024-01-08'),
    updated_at: new Date('2024-01-11')
  }
];

export function SampleJobsProvider({ onLoadSampleJobs, hasExistingJobs }: SampleJobsProviderProps) {
  const handleLoadSamples = () => {
    onLoadSampleJobs(sampleJobs);
  };

  if (hasExistingJobs) {
    return null;
  }

  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <AlertDescription className="flex items-center justify-between">
        <div className="text-green-800">
          💡 <strong>Get Started:</strong> Load some sample engineering job listings to explore the application features.
        </div>
        <Button 
          onClick={handleLoadSamples}
          size="sm"
          className="bg-green-600 hover:bg-green-700 ml-4"
        >
          📋 Load Sample Jobs
        </Button>
      </AlertDescription>
    </Alert>
  );
}
