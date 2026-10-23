import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { CertificateQRCode } from './qr-code';
import { StudentRecord } from '@/lib/types/portal';
import {
  CheckCircle2,
  Download,
  Printer,
  Share2,
  ShieldCheck,
  User,
  Users,
  Layout,
  FileText,
  Camera,
  Upload,
  Loader2,
  Edit2,
  Check,
  X,
  GraduationCap,
  BookOpen,
  Clock,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { uploadStudentPhotoFile, updateStudent } from '@/lib/supabase/student-service';

export const INSTITUTE_COURSES = [
  'Computer Office Automation (COA)',
  'Diploma in Computer Application (DCA)',
  'Advanced Diploma in Computer Application (ADCA)',
  'Post Graduate Diploma in Computer Application (PGDCA)',
  'Certificate in Financial Accounting (Tally Prime & GST)',
  'Desktop Publishing (DTP)',
  'Web Designing & Development',
  'Python Programming & AI Basics',
  'C / C++ & Core Programming',
  'Certificate Course in Computer Applications (CCA)',
  'Hindi & English Computer Typing',
  'Hardware & Networking Basics',
];

export const COURSE_SUBJECT_PRESETS: Record<string, string[]> = {
  'Computer Office Automation (COA)': [
    'Computer Office Automation (COA)',
    'MS Office (Word, Excel, PowerPoint) & Internet',
    'Advanced Excel, Formulas & MIS Reporting',
  ],
  'Diploma in Computer Application (DCA)': [
    'Computer Fundamentals, Operating Systems & MS Office',
    'Computer Applications, Database & FoxPro',
    'Financial Accounting & Computer Concepts',
  ],
  'Advanced Diploma in Computer Application (ADCA)': [
    'DCA, Tally Prime, Photoshop & CorelDraw',
    'Computer Applications, Accounting & Web Designing',
    'Desktop Publishing & Financial Accounting',
  ],
  'Post Graduate Diploma in Computer Application (PGDCA)': [
    'Programming in C/C++, DBMS & Software Engineering',
    'Data Structures, Python & Web Application Development',
    'Advanced Computer Systems & Networking',
  ],
  'Certificate in Financial Accounting (Tally Prime & GST)': [
    'Tally Prime with GST, E-Way Bill & Taxation',
    'Financial Accounting, Inventory Management & Payroll',
    'Tally ERP 9, Balance Sheet & GST Return Filing',
  ],
  'Desktop Publishing (DTP)': [
    'Adobe Photoshop, CorelDraw & PageMaker',
    'Graphic Designing & Commercial Print Production',
  ],
  'Web Designing & Development': [
    'HTML5, CSS3, JavaScript & Modern Responsive UI',
    'Full Stack Web Development, React & Database',
  ],
  'Python Programming & AI Basics': [
    'Core Python, OOP & Data Structures',
    'Python for Data Analysis, Pandas & Machine Learning',
  ],
};

interface CertificateCardProps {
  student: StudentRecord;
  showActions?: boolean;
  onPhotoUpdated?: (updated: StudentRecord) => void;
  onStudentUpdated?: (updated: StudentRecord) => void;
}

function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length > 1 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function formatFatherName(name: string): string {
  if (!name) return 'Mr. Lekhraj';
  let clean = name.trim();
  clean = clean.replace(/^(mr\.?\s*)+/i, '');
  clean = formatTitleCase(clean);
  return `Mr. ${clean}`;
}

function formatMotherName(name: string): string {
  if (!name) return 'Mrs. Anita Devi';
  let clean = name.trim();
  clean = clean.replace(/^(mrs\.?\s*|ms\.?\s*|smt\.?\s*)+/i, '');
  clean = formatTitleCase(clean);
  return `Mrs. ${clean}`;
}

function GoldenFlourish({ className = '', inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg
      viewBox="0 0 260 28"
      className={`${className} ${inverted ? 'rotate-180' : ''}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M130 5 L134 14 L130 23 L126 14 Z" fill="#d97706" />
      <path d="M118 8 L121 14 L118 20 L115 14 Z" fill="#b45309" />
      <path d="M142 8 L145 14 L142 20 L139 14 Z" fill="#b45309" />
      <circle cx="108" cy="14" r="1.5" fill="#d97706" />
      <circle cx="152" cy="14" r="1.5" fill="#d97706" />
      <path
        d="M102 14 C90 14, 82 7, 70 7 C56 7, 48 18, 32 18 C20 18, 12 12, 4 6 C8 15, 20 22, 34 22 C50 22, 58 11, 72 11 C82 11, 88 17, 102 14 Z"
        fill="#d97706"
      />
      <path
        d="M158 14 C170 14, 178 7, 190 7 C204 7, 212 18, 228 18 C240 18, 248 12, 256 6 C252 15, 240 22, 226 22 C210 22, 202 11, 188 11 C178 11, 172 17, 158 14 Z"
        fill="#d97706"
      />
    </svg>
  );
}

export function CertificateCard({
  student,
  showActions = true,
  onPhotoUpdated,
  onStudentUpdated,
}: CertificateCardProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateView, setTemplateView] = useState<'official' | 'ornamental'>('official');

  const [currentPhoto, setCurrentPhoto] = useState<string | null>(
    student.profile_picture_url || student.photo_url || student.student_image || null
  );

  const [showMotherName, setShowMotherName] = useState<boolean>(true);
  const [motherNameInput, setMotherNameInput] = useState<string>(student.mother_name || '');
  const [isEditingMotherName, setIsEditingMotherName] = useState<boolean>(false);
  const [isSavingMotherName, setIsSavingMotherName] = useState<boolean>(false);

  // Course & Subject Configuration State
  const initialCourse = student.course || 'Computer Office Automation (COA)';
  const initialSubject = student.subject || initialCourse;
  const [currentCourse, setCurrentCourse] = useState<string>(initialCourse);
  const [currentSubject, setCurrentSubject] = useState<string>(initialSubject);
  const [showSubject, setShowSubject] = useState<boolean>(true);
  const [isEditingCourse, setIsEditingCourse] = useState<boolean>(false);
  const [isSavingCourse, setIsSavingCourse] = useState<boolean>(false);
  const [selectedCoursePreset, setSelectedCoursePreset] = useState<string>(
    INSTITUTE_COURSES.includes(initialCourse) ? initialCourse : 'custom'
  );
  const [courseInput, setCourseInput] = useState<string>(initialCourse);
  const [subjectInput, setSubjectInput] = useState<string>(initialSubject);

  const [currentStatus, setCurrentStatus] = useState<'pending' | 'completed'>(
    student.course_status === 'completed' ? 'completed' : 'pending'
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPhoto(student.profile_picture_url || student.photo_url || student.student_image || null);
    if (student.mother_name) {
      setMotherNameInput(student.mother_name);
    }
    const c = student.course || 'Computer Office Automation (COA)';
    const s = student.subject || c;
    setCurrentCourse(c);
    setCurrentSubject(s);
    setCourseInput(c);
    setSubjectInput(s);
    setSelectedCoursePreset(INSTITUTE_COURSES.includes(c) ? c : 'custom');
    setCurrentStatus(student.course_status === 'completed' ? 'completed' : 'pending');
  }, [student]);

  const handleToggleStatus = async () => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      setIsUpdatingStatus(true);
      const updated = await updateStudent(student.id, {
        ...student,
        course_status: nextStatus,
      });
      setCurrentStatus(nextStatus);
      if (updated) {
        onPhotoUpdated?.(updated);
        onStudentUpdated?.(updated);
      }
    } catch (err) {
      console.error('Failed to update course status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveMotherName = async () => {
    if (!motherNameInput.trim()) {
      setShowMotherName(false);
      setIsEditingMotherName(false);
      return;
    }
    try {
      setIsSavingMotherName(true);
      const updated = await updateStudent(student.id, {
        ...student,
        mother_name: motherNameInput.trim(),
      });
      if (updated) {
        onPhotoUpdated?.(updated);
        onStudentUpdated?.(updated);
      }
      setShowMotherName(true);
      setIsEditingMotherName(false);
    } catch (err) {
      console.error('Failed to update mother name:', err);
    } finally {
      setIsSavingMotherName(false);
    }
  };

  const handleCoursePresetChange = (preset: string) => {
    setSelectedCoursePreset(preset);
    if (preset !== 'custom') {
      setCourseInput(preset);
      const suggestions = COURSE_SUBJECT_PRESETS[preset];
      if (suggestions && suggestions.length > 0) {
        setSubjectInput(suggestions[0]);
      } else {
        setSubjectInput(preset);
      }
    }
  };

  const handleSaveCourse = async () => {
    const finalCourse = courseInput.trim() || 'Computer Office Automation (COA)';
    const finalSubject = subjectInput.trim() || finalCourse;
    try {
      setIsSavingCourse(true);
      const updated = await updateStudent(student.id, {
        ...student,
        course: finalCourse,
        subject: finalSubject,
      });
      setCurrentCourse(finalCourse);
      setCurrentSubject(finalSubject);
      if (updated) {
        onPhotoUpdated?.(updated);
        onStudentUpdated?.(updated);
      }
      setIsEditingCourse(false);
    } catch (err) {
      console.error('Failed to update course & subject:', err);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const photoUrl = await uploadStudentPhotoFile(file);
      if (photoUrl) {
        setCurrentPhoto(photoUrl);
        const updated = await updateStudent(student.id, {
          ...student,
          profile_picture_url: photoUrl,
          photo_url: photoUrl,
          student_image: photoUrl,
        });
        if (updated) {
          onPhotoUpdated?.(updated);
        }
      }
    } catch (err) {
      console.error('Failed to upload student photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const rawStudentName = student.student_name || student.name || 'Priyanka Gangwar';
  const studentName = formatTitleCase(rawStudentName);

  const rawFatherName = student.father_name || 'Mr. Lekhraj';
  const fatherName = formatFatherName(rawFatherName);

  const rawMotherName = motherNameInput.trim() || student.mother_name || 'Mrs. Anita Devi';
  const motherName = formatMotherName(rawMotherName);

  const rollNo = student.roll_no || student.roll_number || student.student_id || '320';
  const enrollNo = student.enrollment_no || (rollNo === '320' ? 'EN-320' : `EN-${rollNo}`);
  const certNo = student.certificate_no || (rollNo === '320' ? 'SP-320' : `SP-${rollNo}`);
  const course = currentCourse;
  const session = student.session || student.duration || '2022–2023';
  const duration = session;
  const subject = currentSubject;
  const marks = student.marks || '85%';
  const grade = student.grade || 'A';
  const certUrl = student.certificate_url || student.pdf_url;
  const mobileNo = student.mobile_no || student.phone || (rollNo === '320' ? '7668687048' : '');

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify?roll_no=${rollNo}`
    : `https://successpoint.org/verify?roll_no=${rollNo}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (certUrl) {
      const link = document.createElement('a');
      link.href = certUrl;
      link.target = '_blank';
      link.download = `Certificate_${rollNo}_${studentName.replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!certRef.current) return;
    try {
      setIsGenerating(true);
      const element = certRef.current;
      const isPortrait = templateView === 'official';
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = isPortrait ? 210 : 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Certificate_${certNo}_${studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!certRef.current) return;
    try {
      setIsGeneratingImage(true);
      const element = certRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Certificate_${certNo}_${studentName.replace(/\s+/g, '_')}_A4.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Toolbar & Template Selector */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Verified Certificate</span>
            </div>

            {/* View Switcher Buttons */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setTemplateView('official')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${templateView === 'official'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" /> Official Institute A4
              </button>
              <button
                onClick={() => setTemplateView('ornamental')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${templateView === 'ornamental'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
              >
                <Layout className="w-3.5 h-3.5" /> Modern Landscape
              </button>
            </div>

            {/* Mother's Name Option Toggle & Quick Edit */}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setShowMotherName(!showMotherName)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${showMotherName
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                title="Toggle Mother's Name on Certificate"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mother's Name: {showMotherName ? 'ON' : 'OFF'}</span>
              </button>

              {showActions && (
                <button
                  type="button"
                  onClick={() => setIsEditingMotherName(!isEditingMotherName)}
                  className="p-1 rounded text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Edit Mother's Name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Course & Subject Option Selector / Toggle */}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setShowSubject(!showSubject)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${showSubject
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                title="Toggle Subject Line on Certificate"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Subject: {showSubject ? 'ON' : 'OFF'}</span>
              </button>

              {showActions && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCourse(!isEditingCourse);
                    if (isEditingMotherName) setIsEditingMotherName(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${isEditingCourse
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  title="Configure Course and Subject in which student completed course"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Course Option</span>
                  <Edit2 className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>

            {/* Course Status Toggle (Pending / Completed) */}
            {showActions && (
              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    currentStatus === 'completed'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-amber-500 text-white font-bold shadow-xs hover:bg-amber-600'
                  }`}
                  title={`Current course status is ${currentStatus.toUpperCase()}. Click to toggle between Pending and Completed.`}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : currentStatus === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>Status: {currentStatus === 'completed' ? 'Completed' : 'Pending (Click to Complete)'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700/60 rounded-lg cursor-pointer transition-colors shadow-xs"
              title="Upload or change student photo on this certificate"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-700 dark:text-amber-300" />
              ) : (
                <Camera className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              )}
              <span>{isUploadingPhoto ? 'Uploading...' : currentPhoto ? 'Change Student Photo' : 'Upload Student Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                disabled={isUploadingPhoto}
              />
            </label>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied Link!' : 'Share Link'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print A4
            </button>

            {currentStatus === 'completed' || showActions ? (
              <>
                <button
                  onClick={handleDownloadImage}
                  disabled={isGeneratingImage}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                  title="Download Certificate as High-Res A4 PNG Image"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingImage ? 'Generating...' : 'Download A4 Image'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                  title="Download Certificate as High-Res A4 PDF"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                title="Course status is Pending. Click to mark as Completed and unlock official download."
                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors border border-amber-300 dark:border-amber-700 shadow-xs"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Mark Completed & Download</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mother's Name Inline Edit Bar */}
      {showActions && isEditingMotherName && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-wrap items-center gap-2 text-xs print:hidden shadow-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Mother's Name:
          </span>
          <input
            type="text"
            value={motherNameInput}
            onChange={(e) => setMotherNameInput(e.target.value)}
            placeholder="e.g. Sunita Sharma"
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white text-xs w-60 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveMotherName}
            disabled={isSavingMotherName}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
          >
            {isSavingMotherName ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Save & Apply</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditingMotherName(false)}
            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Course & Subject Quick Selector & Inline Editor */}
      {showActions && isEditingCourse && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl space-y-3 text-xs print:hidden shadow-md">
          <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Course & Subject Option
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select or edit the course and specific subject/trade the student completed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingCourse(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-blue-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* 1. Course Selection / Custom */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Course Completed:
              </label>
              <select
                value={selectedCoursePreset}
                onChange={(e) => handleCoursePresetChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {INSTITUTE_COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="custom">✏ Custom Course Name...</option>
              </select>

              {selectedCoursePreset === 'custom' && (
                <div className="pt-1">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                    Type Custom Course Name:
                  </label>
                  <input
                    type="text"
                    value={courseInput}
                    onChange={(e) => setCourseInput(e.target.value)}
                    placeholder="e.g. Diploma in Computer Application (DCA)"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* 2. Subject / Specialization */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                <span>Subject / Stream Completed:</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                  (e.g. in which subject student completed course)
                </span>
              </label>
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="e.g. Computer Office Automation (COA)"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              />

              {/* Quick Suggestion Pills */}
              {COURSE_SUBJECT_PRESETS[courseInput] && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Suggested subjects for this course:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {COURSE_SUBJECT_PRESETS[courseInput].map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setSubjectInput(subj)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${subjectInput === subj
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                          }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-xs font-medium">
              <input
                type="checkbox"
                checked={showSubject}
                onChange={(e) => setShowSubject(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Display dedicated Subject line on Certificate</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingCourse(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCourse}
                disabled={isSavingCourse}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm text-xs disabled:opacity-50 transition-colors"
              >
                {isSavingCourse ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save & Apply to Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Certificate Frame */}
      <div className="bg-slate-100 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-transparent printable-certificate-wrapper flex justify-center w-full">
        {templateView === 'official' ? (
          /* Official Institute Portrait A4 Template with Designer Border */
          <div
            ref={certRef}
            className="printable-certificate w-full max-w-[210mm] bg-[#fffdfa] text-slate-900 border-[10px] sm:border-[12px] border-double border-amber-600 p-3 sm:p-5 shadow-2xl rounded-xs flex flex-col justify-between print:shadow-none print:border-[10px] print:p-4 font-sans relative box-border"
            style={{
              aspectRatio: '1 / 1.414',
              minHeight: '290mm',
              boxSizing: 'border-box',
            }}
          >
            {/* Designer Inner Border & Corner Ornaments */}
            <div className="border-2 border-amber-600 p-4 sm:p-6 flex-1 flex flex-col justify-between h-full relative bg-gradient-to-b from-amber-50/15 via-white to-amber-50/15 box-border">
              {/* Designer Corner Flourishes */}
              <div className="absolute top-1 left-1 w-9 h-9 border-t-4 border-l-4 border-amber-600" />
              <div className="absolute top-2 left-2 w-11 h-11 border-t-2 border-l-2 border-amber-500/70" />
              <div className="absolute top-1 right-1 w-9 h-9 border-t-4 border-r-4 border-amber-600" />
              <div className="absolute top-2 right-2 w-11 h-11 border-t-2 border-r-2 border-amber-500/70" />
              <div className="absolute bottom-1 left-1 w-9 h-9 border-b-4 border-l-4 border-amber-600" />
              <div className="absolute bottom-2 left-2 w-11 h-11 border-b-2 border-l-2 border-amber-500/70" />
              <div className="absolute bottom-1 right-1 w-9 h-9 border-b-4 border-r-4 border-amber-600" />
              <div className="absolute bottom-2 right-2 w-11 h-11 border-b-2 border-r-2 border-amber-500/70" />

              {/* Top Roll & Enrollment Header */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 font-sans z-10 px-2 pt-1">
                <div>Roll No.: <span className="font-mono text-blue-700 font-bold">{rollNo}</span></div>
                <div>Enrollment No.: <span className="font-mono text-blue-700 font-bold">{enrollNo}</span></div>
              </div>

              {/* Main Institute Header */}
              <div className="text-center space-y-1 my-2 z-10 px-3">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-black font-sans uppercase">
                  SUCCESS POINT COMPUTER INSTITUTE
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-800 font-medium">
                  (An Autonomous Body Registered Under the IT & Software Industries)
                </p>
                <p className="text-[10px] sm:text-xs text-slate-800 font-medium">
                  Act Department for Promotion of Govt. of Uttarakhand & Govt. of India
                </p>
                <p className="text-[10px] sm:text-xs text-slate-800 font-semibold tracking-wide">
                  Govt. Reg. No. - UKSAUSN000303
                </p>
              </div>

              {/* Logo, Title & Student Photo Grid */}
              <div className="grid grid-cols-3 items-center my-2 sm:my-3 z-10 px-2 sm:px-4">
                {/* Left: Institute Logo - FULL PROMINENT SIZE */}
                <div className="flex justify-start items-center pl-1 sm:pl-2">
                  <div className="w-22 h-22 sm:w-26 sm:h-26 flex items-center justify-center shrink-0">
                    <img
                      src="/img/logosp.jpeg"
                      alt="Success Point Logo"
                      className="max-w-full max-h-full object-contain"
                      style={{ width: '96px', height: '96px', objectFit: 'contain' }}
                    />
                  </div>
                </div>

                {/* Center: CERTIFICATE Title with Golden Filigree Flourishes */}
                <div className="text-center flex flex-col items-center justify-center">
                  <GoldenFlourish className="w-44 sm:w-56 h-6 sm:h-7 mx-auto mb-1 text-amber-600" />
                  <h2 className="text-2xl sm:text-4xl font-black text-black font-serif tracking-widest inline-block px-2 py-0.5">
                    CERTIFICATE
                  </h2>
                  <GoldenFlourish className="w-44 sm:w-56 h-6 sm:h-7 mx-auto mt-1 text-amber-600" inverted />
                </div>

                {/* Right: Student Photo Frame - FULL PASSPORT SIZE WITH GOLD BORDER */}
                <div className="flex justify-end pr-1 sm:pr-2 print:block">
                  {currentPhoto ? (
                    <div className="relative group shrink-0" style={{ width: '96px', height: '118px' }}>
                      <img
                        src={currentPhoto}
                        alt={studentName}
                        className="w-full h-full object-cover border-2 border-amber-600 shadow-sm rounded-xs"
                        style={{ width: '96px', height: '118px', objectFit: 'cover' }}
                      />
                      {showActions && (
                        <label
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity print:hidden p-1 text-center"
                          title="Click to Change Student Photo"
                        >
                          <Camera className="w-4 h-4 mb-1" />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            className="hidden"
                            disabled={isUploadingPhoto}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <label
                      className={`border border-slate-600 border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xs shrink-0 ${showActions ? 'cursor-pointer hover:bg-slate-100 hover:border-black hover:text-black transition-colors' : ''}`}
                      style={{ width: '96px', height: '118px' }}
                      title={showActions ? "Click to Upload Student Photo" : "Student Photo"}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                          <span className="text-[10px] font-bold mt-1 text-slate-700">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <User className="w-7 h-7 opacity-50" />
                          <span className="text-[10px] font-bold mt-1 text-center px-1">Upload Photo</span>
                        </>
                      )}
                      {showActions && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          disabled={isUploadingPhoto}
                        />
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Certification Body Text */}
              <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-slate-900 leading-relaxed font-sans my-2 z-10 px-3 sm:px-5">
                {/* 1. Student Certification Line */}
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-slate-900 font-medium">This is to certify that</span>
                  <span className="font-bold text-blue-700 text-sm sm:text-base tracking-wide uppercase">
                    {studentName}
                  </span>
                </p>

                {/* 2. Parent & Mobile Details */}
                <div className="space-y-1.5 py-0.5">
                  <div className="grid grid-cols-[135px_16px_1fr] sm:grid-cols-[150px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Father's Name</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="font-bold text-blue-700">{fatherName}</span>
                  </div>

                  {showMotherName && (
                    <div className="grid grid-cols-[135px_16px_1fr] sm:grid-cols-[150px_20px_1fr] items-baseline">
                      <span className="text-slate-900 font-medium">Mother's Name</span>
                      <span className="text-slate-900 font-bold">:</span>
                      <span className="font-bold text-blue-700">{motherName}</span>
                    </div>
                  )}

                  {mobileNo && (
                    <div className="grid grid-cols-[135px_16px_1fr] sm:grid-cols-[150px_20px_1fr] items-baseline">
                      <span className="text-slate-900 font-medium">Mobile No.</span>
                      <span className="text-slate-900 font-bold">:</span>
                      <span className="font-bold text-blue-700 font-mono">{mobileNo}</span>
                    </div>
                  )}
                </div>

                {/* 3. Course Description Block */}
                <div className="space-y-1 pt-1">
                  <p className="text-slate-900 font-medium">has successfully completed the course in</p>
                  <p className="text-sm sm:text-base font-extrabold text-blue-700 tracking-wide py-0.5">
                    {course}
                  </p>
                  {showSubject && subject && subject !== course && (
                    <p className="text-xs sm:text-sm text-slate-900 font-medium py-0.5">
                      in the subject of{' '}
                      <span className="font-bold text-blue-700">{subject}</span>
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-900 leading-snug">
                    at <span className="font-bold text-slate-900">SUCCESS POINT COMPUTER INSTITUTE</span>, Rudrapur, Udham Singh Nagar, Uttarakhand.
                  </p>
                </div>

                {/* 4. Academic Session, Percentage & Grade */}
                <div className="space-y-1.5 py-1">
                  <div className="grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Academic Session</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="font-bold text-blue-700 font-mono">{session}</span>
                  </div>

                  <div className="grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Percentage Obtained</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="font-bold text-blue-700 font-mono">{marks}</span>
                  </div>

                  <div className="grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Grade Obtained</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="font-bold text-blue-700 font-bold">{grade}</span>
                  </div>
                </div>

                {/* 5. Recognition Conclusion Statement */}
                <p className="text-xs text-slate-800 leading-relaxed pt-1">
                  This certificate is issued in recognition of the successful completion of the above-mentioned course.
                </p>
              </div>

              {/* Signatures & Verification QR Code Row */}
              <div className="flex items-end justify-between pt-4 pb-2 my-1 border-b border-slate-200 z-10 px-2 sm:px-4">
                <div className="text-left font-bold text-xs sm:text-sm text-black">
                  <div className="h-10 sm:h-12 flex items-end">
                    <div className="border-b-2 border-slate-400 mb-1 w-36 sm:w-44" />
                  </div>
                  Controller of Examinations
                </div>

                {/* QR Code in Official Certificate Footer */}
                <div className="flex flex-col items-center text-center">
                  <CertificateQRCode value={verificationUrl} size={64} className="p-1" />
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5">Scan to Verify</span>
                </div>

                <div className="text-right font-bold text-xs sm:text-sm text-black flex flex-col items-end">
                  <div className="relative w-36 sm:w-48 flex flex-col items-center justify-end">
                    <img
                      src="/img/vairagi.png"
                      alt="Director / Authorized Signatory"
                      className="h-16 sm:h-20 w-auto object-contain -mb-1 pointer-events-none select-none"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                    <div className="border-b-2 border-slate-400 mb-1 w-full" />
                  </div>
                  <p>Director / Authorized Signatory</p>
                  <p className="text-[10px] sm:text-xs text-slate-700 font-semibold">SUCCESS POINT COMPUTER INSTITUTE</p>
                </div>
              </div>

              {/* Accreditation Badges Row - FULL SIZE & PROMINENT */}
              <div className="grid grid-cols-4 items-center justify-items-center gap-2 sm:gap-4 py-2 my-1 border-t border-slate-200 z-10">
                {/* Badge 1: ISO 9001 */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/iso.jpg"
                    alt="ISO 9001 Certified"
                    className="h-14 sm:h-16 max-w-full object-contain"
                  />
                </div>

                {/* Badge 2: Digital India */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/digitalindia.png"
                    alt="Digital India - Power To Empower"
                    className="h-12 sm:h-14 max-w-full object-contain"
                  />
                </div>

                {/* Badge 3: Skill India */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/skillindia.jpeg"
                    alt="Skill India - कौशल भारत - कुशल भारत"
                    className="h-14 sm:h-16 max-w-full object-contain"
                  />
                </div>

                {/* Badge 4: MSME */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/msme.jpeg"
                    alt="Ministry of MSME, Govt. of India"
                    className="h-12 sm:h-14 max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Office Address & Footer Info - CLEANLY INSIDE INNER BORDER */}
              <div className="pt-2 text-left space-y-0.5 text-[10px] sm:text-xs text-slate-900 font-sans border-t border-slate-300 z-10">
                <p className="font-bold">Office Address:</p>
                <p>Azad Nagar Ward No-07, Transit Camp Rudrapur, Udham Singh Nagar, Uttarakhand-263153.</p>
                <p>Website: <span className="font-semibold text-blue-800">www.successpointrdr.in</span> &nbsp;|&nbsp; Email: <span className="font-semibold text-slate-800">info.success.get@gmail.com</span></p>
              </div>
            </div>
          </div>
        ) : (
          /* Modern Golden Ornamental Landscape Template */
          <div
            ref={certRef}
            className="w-full bg-white text-slate-900 border-[8px] border-amber-600/80 p-8 sm:p-12 shadow-2xl rounded-sm aspect-[1.414/1] flex flex-col justify-between overflow-hidden print:shadow-none print:border-[8px]"
            style={{
              backgroundImage: `radial-gradient(circle at center, rgba(245, 158, 11, 0.03) 0%, transparent 70%)`,
            }}
          >
            {/* Decorative Corner Borders */}
            <div className="absolute top-3 left-3 w-16 h-16 border-t-2 border-l-2 border-amber-700" />
            <div className="absolute top-3 right-3 w-16 h-16 border-t-2 border-r-2 border-amber-700" />
            <div className="absolute bottom-3 left-3 w-16 h-16 border-b-2 border-l-2 border-amber-700" />
            <div className="absolute bottom-3 right-3 w-16 h-16 border-b-2 border-r-2 border-amber-700" />

            {/* Header */}
            <div className="text-center space-y-2 relative z-10">
              <div className="flex items-center justify-center gap-3">
                <Image
                  src="/img/logosp.jpeg"
                  alt="Success Point Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain rounded-lg shadow-sm"
                />
                <div className="text-left">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase font-serif">
                    Success Point
                  </h1>
                  <p className="text-xs text-amber-700 font-semibold tracking-wider uppercase">
                    Educational & Technical Institute
                  </p>
                </div>
              </div>

              <div className="pt-4 pb-1">
                <span className="inline-block px-6 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-serif text-sm tracking-widest uppercase font-semibold">
                  Certificate of Completion
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">This is to certify that</p>
            </div>

            {/* Student & Course Info */}
            <div className="text-center my-4 space-y-4 relative z-10">
              <div className="relative inline-block">
                <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-serif border-b-2 border-amber-600/40 pb-1 px-8">
                  {studentName}
                </h2>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                Son/Daughter of <span className="font-semibold text-slate-900">{fatherName}</span>
                {showMotherName && (
                  <> & <span className="font-semibold text-slate-900">{motherName}</span></>
                )}
                , Roll No.{' '}
                <span className="font-mono font-semibold text-amber-800">{rollNo}</span>
                , has successfully completed the course in
              </p>

              <div className="py-2">
                <p className="text-xl sm:text-2xl font-bold text-amber-800 font-serif tracking-wide">
                  {course}
                </p>
                {showSubject && subject && (
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 mt-1">
                    in the subject of: <span className="font-bold text-amber-950 underline decoration-amber-400">{subject}</span>
                  </p>
                )}
                <p className="text-xs text-slate-600 font-medium mt-1">
                  at <span className="font-semibold text-slate-800">SUCCESS POINT COMPUTER INSTITUTE</span>, Rudrapur, Udham Singh Nagar, Uttarakhand
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1.5">
                  Academic Session: <span className="font-semibold font-mono text-slate-700">{session}</span> &nbsp;|&nbsp; Percentage Obtained: <span className="font-semibold font-mono text-slate-700">{marks}</span> &nbsp;|&nbsp; Grade Obtained: <span className="font-semibold text-slate-700">{grade}</span>
                </p>
              </div>
            </div>

            {/* Footer Metadata & Verification */}
            <div className="grid grid-cols-3 items-end pt-6 border-t border-slate-200 relative z-10">
              {/* Left: Issue Details & Student Photo */}
              <div className="flex items-center gap-3 text-left">
                {currentPhoto ? (
                  <div className="relative group">
                    {currentPhoto.startsWith('data:') ? (
                      <img
                        src={currentPhoto}
                        alt={studentName}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-sm"
                      />
                    ) : (
                      <Image
                        src={currentPhoto}
                        alt={studentName}
                        width={56}
                        height={56}
                        unoptimized
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-sm"
                      />
                    )}
                    {showActions && (
                      <label
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold cursor-pointer transition-opacity rounded-lg print:hidden"
                        title="Click to Change Student Photo"
                      >
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                          disabled={isUploadingPhoto}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label
                    className={`w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 border-dashed flex flex-col items-center justify-center text-slate-400 ${showActions ? 'cursor-pointer hover:bg-slate-200 hover:border-amber-600 hover:text-amber-700 transition-colors' : ''
                      }`}
                    title={showActions ? "Click to Upload Student Photo" : "Student Photo"}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                    {showActions && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                    )}
                  </label>
                )}
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p>
                    <span className="font-medium text-slate-500">Certificate No:</span>{' '}
                    <span className="font-mono font-bold text-slate-800">{certNo}</span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Issue Date:</span>{' '}
                    <span className="font-semibold text-slate-800">{student.issue_date || '2024'}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED GENUINE
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: QR Code */}
              <div className="flex flex-col items-center justify-center text-center space-y-1">
                <CertificateQRCode value={verificationUrl} size={84} />
                <p className="text-[10px] text-slate-400 font-mono">Scan to Verify</p>
              </div>

              {/* Right: Digital Signature */}
              <div className="text-right space-y-1 flex flex-col items-end">
                <div className="h-20 flex flex-col items-center justify-end border-b border-slate-400 px-3 pb-0.5 min-w-[160px]">
                  <img
                    src="/img/vairagi.png"
                    alt="Director / Authorized Signatory"
                    className="h-[72px] w-auto object-contain pointer-events-none select-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-800">Director / Authorized Signatory</p>
                <p className="text-[10px] text-slate-800">SUCCESS POINT COMPUTER INSTITUTE</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
