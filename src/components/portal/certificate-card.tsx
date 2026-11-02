'use client';

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
  Percent,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { uploadStudentPhotoFile, updateStudent } from '@/lib/supabase/student-service';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';

export function calculateGradeFromMarks(marksStr?: string | null): string {
  if (!marksStr) return 'A';
  const numericVal = parseFloat(marksStr.replace(/[^0-9.]/g, ''));
  if (isNaN(numericVal)) return 'A';
  if (numericVal >= 85) return 'A+';
  if (numericVal >= 75) return 'A';
  if (numericVal >= 60) return 'B';
  if (numericVal >= 50) return 'C';
  if (numericVal >= 40) return 'D';
  return 'F';
}

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
  isAdmin?: boolean;
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

function withTimeout(promise: Promise<unknown>, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, timeoutMs);
    promise.then(
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
    );
  });
}

async function waitForCertificateAssets(element: HTMLElement) {
  const fontReady = document.fonts?.ready ?? Promise.resolve();
  await withTimeout(fontReady, 5000);

  await Promise.all(Array.from(element.querySelectorAll('img')).map(async (image) => {
    if (image.complete && image.naturalWidth > 0) {
      return;
    }
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 8000);
      const finish = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
    });

    if (image.complete && image.naturalWidth > 0 && typeof image.decode === 'function') {
      await withTimeout(image.decode(), 2000);
    }
  }));
}

export function CertificateCard({
  student,
  showActions = true,
  isAdmin: isAdminProp,
  onPhotoUpdated,
  onStudentUpdated,
}: CertificateCardProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateView, setTemplateView] = useState<'official' | 'ornamental'>('official');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'student' | null>(null);

  useEffect(() => {
    const user = getCurrentPortalUser();
    if (user) {
      setCurrentUserRole(user.role);
    }
  }, []);

  // Editable controls ONLY appear when explicitly enabled by Admin Panel (isAdmin = true)
  const isAdmin = Boolean(isAdminProp);

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

  // Percentage & Grade Configuration State
  const initialMarks = student.marks || '85%';
  const initialGrade = student.grade || calculateGradeFromMarks(initialMarks);
  const [currentMarks, setCurrentMarks] = useState<string>(initialMarks);
  const [currentGrade, setCurrentGrade] = useState<string>(initialGrade);
  const [isEditingPercentage, setIsEditingPercentage] = useState<boolean>(false);
  const [isSavingPercentage, setIsSavingPercentage] = useState<boolean>(false);
  const [marksInput, setMarksInput] = useState<string>(initialMarks);
  const [gradeInput, setGradeInput] = useState<string>(initialGrade);

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

    const m = student.marks || '85%';
    const g = student.grade || calculateGradeFromMarks(m);
    setCurrentMarks(m);
    setCurrentGrade(g);
    setMarksInput(m);
    setGradeInput(g);
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

  const handleSavePercentage = async () => {
    let cleanMarks = marksInput.trim();
    if (!cleanMarks) cleanMarks = '85%';
    if (/^\d+(\.\d+)?$/.test(cleanMarks)) {
      cleanMarks = `${cleanMarks}%`;
    }
    const cleanGrade = gradeInput.trim() || calculateGradeFromMarks(cleanMarks);
    try {
      setIsSavingPercentage(true);
      const updated = await updateStudent(student.id, {
        ...student,
        marks: cleanMarks,
        grade: cleanGrade,
      });
      setCurrentMarks(cleanMarks);
      setCurrentGrade(cleanGrade);
      if (updated) {
        onPhotoUpdated?.(updated);
        onStudentUpdated?.(updated);
      }
      setIsEditingPercentage(false);
    } catch (err) {
      console.error('Failed to update percentage & grade:', err);
    } finally {
      setIsSavingPercentage(false);
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
          onStudentUpdated?.(updated);
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
  const mobileNo = student.mobile_no || student.phone || '';

  const rollNo = student.roll_no || student.roll_number || student.student_id || '320';
  const enrollNo = student.enrollment_no || (rollNo === '320' ? 'EN-320' : `EN-${rollNo}`);
  const certNo = student.certificate_no || (rollNo === '320' ? 'SP-320' : `SP-${rollNo}`);
  const course = currentCourse;
  const session = student.session || student.duration || '2022–2023';
  const duration = session;
  const subject = currentSubject;
  const marks = currentMarks;
  const grade = currentGrade;
  const certUrl = student.certificate_url || student.pdf_url;
  const dynamicCertificateTextLength = [
    studentName,
    fatherName,
    showMotherName ? motherName : '',
    rollNo,
    enrollNo,
    course,
    showSubject ? subject : '',
    session,
    marks,
    grade,
  ].reduce((length, value) => length + value.length, 0);
  const useCompactCertificateBody = dynamicCertificateTextLength > 250;

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify?roll_no=${rollNo}`
    : `https://successpoint.org/verify?roll_no=${rollNo}`;

  const handlePrint = () => {
    window.print();
  };

  const captureFullCertificateCanvas = async () => {
    if (!certRef.current) return null;
    const element = certRef.current;
    const isPortrait = templateView === 'official';
    const pageWidth = isPortrait ? 794 : 1123;
    const a4PageHeight = isPortrait ? 1123 : 794;
    // The certificate can grow when names, course titles, or subjects wrap.
    // Capture its full content so the PDF fit step scales it onto the A4 page
    // instead of silently clipping the lower details or photo.
    const pageHeight = Math.max(a4PageHeight, element.scrollHeight);

    await waitForCertificateAssets(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      windowWidth: pageWidth,
      windowHeight: pageHeight,
      onclone: (clonedDoc, clonedCert) => {
        // 1. Ensure whole cloned document and body are completely unconstrained
        clonedDoc.documentElement.style.overflow = 'visible';
        clonedDoc.documentElement.style.height = 'auto';
        clonedDoc.documentElement.style.maxHeight = 'none';
        clonedDoc.body.style.overflow = 'visible';
        clonedDoc.body.style.height = 'auto';
        clonedDoc.body.style.maxHeight = 'none';
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';

        // 2. Remove any modal scroll clipping, overflow, or max-height on all ancestors
        let ancestor: HTMLElement | null = clonedCert.parentElement;
        while (ancestor) {
          ancestor.style.overflow = 'visible';
          ancestor.style.maxHeight = 'none';
          ancestor.style.height = 'auto';
          ancestor.style.transform = 'none';
          ancestor.style.filter = 'none';
          ancestor.style.contain = 'none';
          ancestor = ancestor.parentElement;
        }

        // 3. Force exact full A4 dimensions on the certificate itself
        Object.assign(clonedCert.style, {
          position: 'relative',
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
          minWidth: `${pageWidth}px`,
          maxWidth: `${pageWidth}px`,
          minHeight: `${a4PageHeight}px`,
          maxHeight: 'none',
          aspectRatio: 'auto',
          margin: '0 auto',
          boxSizing: 'border-box',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: 'none',
        });
      },
    });

    return { canvas, isPortrait, pageWidth, pageHeight };
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const result = await captureFullCertificateCanvas();
      if (!result) return;
      const { canvas, isPortrait } = result;

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      const pageWidthMm = isPortrait ? 210 : 297;
      const pageHeightMm = isPortrait ? 297 : 210;
      const fitScale = Math.min(
        pageWidthMm / canvas.width,
        pageHeightMm / canvas.height,
      );
      const imgWidth = canvas.width * fitScale;
      const imgHeight = canvas.height * fitScale;
      const imgX = (pageWidthMm - imgWidth) / 2;
      const imgY = (pageHeightMm - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      pdf.save(`Certificate_${certNo}_${studentName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsGeneratingImage(true);
      const result = await captureFullCertificateCanvas();
      if (!result) return;
      const { canvas } = result;

      // High-quality JPEG for crisp clarity at full A4 scale
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Certificate_${certNo}_${studentName.replace(/\s+/g, '_')}_A4.jpg`;
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

            {/* Mother's Name Option Toggle & Quick Edit (Admin Only) */}
            {isAdmin && (
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
            )}

            {/* Course & Subject Option Selector / Toggle (Admin Only) */}
            {isAdmin && (
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
                      if (isEditingPercentage) setIsEditingPercentage(false);
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
            )}

            {/* Percentage & Grade Quick Option (Admin Only) */}
            {isAdmin && (
              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPercentage(!isEditingPercentage);
                    if (isEditingMotherName) setIsEditingMotherName(false);
                    if (isEditingCourse) setIsEditingCourse(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${isEditingPercentage
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  title="Edit Percentage and Grade on Certificate"
                >
                  <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Percentage: <strong className="font-mono text-blue-700 dark:text-blue-400">{currentMarks}</strong> ({currentGrade})</span>
                  <Edit2 className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload Student Photo (Admin Only) */}
            {isAdmin && (
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
            )}

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
      {showActions && isAdmin && isEditingMotherName && (
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
      {showActions && isAdmin && isEditingCourse && (
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

      {/* Percentage & Grade Quick Inline Editor */}
      {showActions && isAdmin && isEditingPercentage && (
        <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:via-amber-950/30 dark:to-slate-900 border border-amber-300 dark:border-amber-800/80 rounded-xl space-y-3 text-xs print:hidden shadow-md">
          <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-800/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Edit Percentage & Grade
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Set the official percentage obtained and corresponding grade shown on this certificate.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingPercentage(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-amber-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Percentage input & presets */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                <span>Percentage Obtained:</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-medium">e.g. 85% or 92.5%</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={marksInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarksInput(val);
                    const autoGrade = calculateGradeFromMarks(val);
                    setGradeInput(autoGrade);
                  }}
                  placeholder="e.g. 85%"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>

              {/* Quick Presets */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                  Quick Percentage Presets:
                </span>
                <div className="flex flex-wrap gap-1">
                  {['65%', '72%', '78%', '82%', '85%', '88%', '90%', '94%', '98%'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setMarksInput(pct);
                        setGradeInput(calculateGradeFromMarks(pct));
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-all ${
                        marksInput.trim() === pct
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {pct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grade input & presets */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                <span>Grade Obtained:</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  (Auto-calculated from %)
                </span>
              </label>
              <input
                type="text"
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                placeholder="e.g. A+ or A"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500"
              />

              {/* Grade Presets */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                  Standard Grades:
                </span>
                <div className="flex flex-wrap gap-1">
                  {['A+', 'A', 'B+', 'B', 'C'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGradeInput(g)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold transition-all ${
                        gradeInput.trim() === g
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80 dark:border-amber-800/60">
            <button
              type="button"
              onClick={() => setIsEditingPercentage(false)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePercentage}
              disabled={isSavingPercentage}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm text-xs disabled:opacity-50 transition-colors"
            >
              {isSavingPercentage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save & Apply to Certificate</span>
            </button>
          </div>
        </div>
      )}

      {/* Printable Certificate Frame */}
      <div className={`bg-slate-100 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-transparent printable-certificate-wrapper flex justify-center w-full ${templateView === 'ornamental' ? 'print-landscape' : ''}`}>
        {templateView === 'official' ? (
          /* Official Institute Portrait A4 Template with Designer Border */
          <div
            ref={certRef}
            className="printable-certificate w-full max-w-[210mm] bg-white text-slate-900 border-[10px] border-double border-amber-600/90 p-4 sm:p-5 shadow-2xl rounded-sm flex flex-col justify-between print:shadow-none print:border-[10px] font-sans relative box-border overflow-hidden"
            style={{
              aspectRatio: '210 / 297',
              boxSizing: 'border-box',
              margin: '0 auto',
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
              <div className="flex shrink-0 items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-slate-900 font-sans z-10 px-2">
                <div className="min-w-0 break-words">Roll No.: <span className="font-mono text-blue-700 font-bold [overflow-wrap:anywhere]">{rollNo}</span></div>
                <div className="min-w-0 break-words text-right">Enrollment No.: <span className="font-mono text-blue-700 font-bold [overflow-wrap:anywhere]">{enrollNo}</span></div>
              </div>

              {/* Main Institute Header */}
              <div className="shrink-0 text-center space-y-1 my-2 z-10 px-4">
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
              <div className="grid shrink-0 grid-cols-[115px_1fr_100px] sm:grid-cols-[130px_1fr_120px] items-center my-2 sm:my-3 z-10 px-2 sm:px-3">
                {/* Left: Institute Logo - INSET WITH SAFE PADDING TO PREVENT CUTOFF */}
                <div className="flex justify-start items-center pl-1 sm:pl-2">
                  <div className="w-[105px] h-[105px] sm:w-[115px] sm:h-[115px] flex items-center justify-center shrink-0">
                    <img
                      src="/img/logosp.jpeg"
                      alt="Success Point Logo"
                      crossOrigin="anonymous"
                      className="max-w-full max-h-full object-contain drop-shadow-xs"
                      style={{ width: '108px', height: '108px', objectFit: 'contain' }}
                    />
                  </div>
                </div>

                {/* Center: CERTIFICATE Title with Golden Vector Ornaments */}
                <div className="text-center flex flex-col items-center justify-center w-full px-1">
                  {/* Top Ornamental Line (Pure Vector SVG for 100% PDF & HTML2Canvas stability) */}
                  <svg
                    className="w-full max-w-[280px] sm:max-w-[340px] h-3.5 sm:h-4 mx-auto block mb-1"
                    viewBox="0 0 340 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="8" y1="8" x2="135" y2="8" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
                    <g transform="translate(170, 8)">
                      <polygon points="0,-6 6,0 0,6 -6,0" fill="#d97706" />
                      <polygon points="-16,-4 -12,0 -16,4 -20,0" fill="#b45309" />
                      <polygon points="16,-4 20,0 16,4 12,0" fill="#b45309" />
                      <circle cx="-8" cy="0" r="1.5" fill="#d97706" />
                      <circle cx="8" cy="0" r="1.5" fill="#d97706" />
                    </g>
                    <line x1="205" y1="8" x2="332" y2="8" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>

                  {/* Title with locked line-height and guaranteed vertical clearance */}
                  <h2
                    className="text-2xl sm:text-3.5xl md:text-4xl font-black text-black font-serif tracking-[0.16em] uppercase block w-full text-center"
                    style={{
                      lineHeight: '1.2',
                      paddingTop: '3px',
                      paddingBottom: '5px',
                      margin: 0,
                    }}
                  >
                    CERTIFICATE
                  </h2>

                  {/* Bottom Ornamental Line (Pure Vector SVG - guaranteed to never overlap text) */}
                  <svg
                    className="w-full max-w-[280px] sm:max-w-[340px] h-3.5 sm:h-4 mx-auto block mt-1"
                    viewBox="0 0 340 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="8" y1="8" x2="135" y2="8" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
                    <g transform="translate(170, 8)">
                      <polygon points="0,-6 6,0 0,6 -6,0" fill="#d97706" />
                      <polygon points="-16,-4 -12,0 -16,4 -20,0" fill="#b45309" />
                      <polygon points="16,-4 20,0 16,4 12,0" fill="#b45309" />
                      <circle cx="-8" cy="0" r="1.5" fill="#d97706" />
                      <circle cx="8" cy="0" r="1.5" fill="#d97706" />
                    </g>
                    <line x1="205" y1="8" x2="332" y2="8" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Right: Student Photo Frame - FIXED PASSPORT DIMENSIONS & NO STRETCH */}
                <div className="flex justify-end pr-1 sm:pr-2 print:block">
                  {currentPhoto ? (
                    <div className="relative group shrink-0" style={{ width: '92px', height: '115px' }}>
                      <img
                        src={currentPhoto}
                        alt={studentName}
                        className="w-full h-full object-cover border-2 border-amber-600 shadow-sm rounded-xs"
                        style={{ width: '92px', height: '115px', objectFit: 'cover' }}
                      />
                      {showActions && isAdmin && (
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
                      className={`border border-slate-600 border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xs shrink-0 ${showActions && isAdmin ? 'cursor-pointer hover:bg-slate-100 hover:border-black hover:text-black transition-colors' : ''}`}
                      style={{ width: '96px', height: '118px' }}
                      title={showActions && isAdmin ? "Click to Upload Student Photo" : "Student Photo"}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                          <span className="text-[10px] font-bold mt-1 text-slate-700">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <User className="w-7 h-7 opacity-50" />
                          <span className="text-[10px] font-bold mt-1 text-center px-1">
                            {showActions && isAdmin ? 'Upload Photo' : 'Student Photo'}
                          </span>
                        </>
                      )}
                      {showActions && isAdmin && (
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
              <div className={`shrink-0 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-slate-900 leading-relaxed font-sans my-2 z-10 px-3 sm:px-5 ${useCompactCertificateBody ? 'certificate-body-compact' : ''}`}>
                {/* 1. Student Certification Line */}
                <p className="flex flex-wrap items-baseline gap-x-2 min-w-0 break-words [overflow-wrap:anywhere]">
                  <span className="text-slate-900">This is to certify that</span>
                  <span className="font-bold text-blue-700 text-sm sm:text-base tracking-wide uppercase">
                    {studentName}
                  </span>
                </p>

                {/* 2. Parent & Mobile Details */}
                <div className="space-y-1.5 py-0.5">
                  <div className="grid grid-cols-[135px_16px_1fr] sm:grid-cols-[150px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Father's Name</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="min-w-0 break-words font-bold text-blue-700 [overflow-wrap:anywhere]">{fatherName}</span>
                  </div>

                  {showMotherName && (
                    <div className="grid grid-cols-[135px_16px_1fr] sm:grid-cols-[150px_20px_1fr] items-baseline">
                      <span className="text-slate-900 font-medium">Mother's Name</span>
                      <span className="text-slate-900 font-bold">:</span>
                      <span className="min-w-0 break-words font-bold text-blue-700 [overflow-wrap:anywhere]">{motherName}</span>
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
                  <p className="text-slate-900">has successfully completed the course in</p>
                  <p className="min-w-0 break-words text-sm sm:text-base font-extrabold text-blue-700 tracking-wide py-0.5 [overflow-wrap:anywhere]">
                    {course}
                  </p>
                  {showSubject && subject && subject !== course && (
                    <p className="text-xs sm:text-sm text-slate-900 font-medium py-0.5">
                      in the subject of{' '}
                      <span className="min-w-0 break-words font-bold text-blue-700 [overflow-wrap:anywhere]">{subject}</span>
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-900 leading-snug">
                    at <span className="font-bold text-slate-900">SUCCESS POINT COMPUTER INSTITUTE</span>, Rudrapur, Udham Singh Nagar, Uttarakhand.
                  </p>
                </div>

                {/* 4. Academic Session, Percentage & Grade */}
                <div className="space-y-1.5 py-1">
                  <div className="grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Course Completed</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="min-w-0 break-words font-bold text-blue-700 [overflow-wrap:anywhere]">{course}</span>
                  </div>

                  {showSubject && subject && (
                    <div className="grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline">
                      <span className="text-slate-900 font-medium">Subject / Stream</span>
                      <span className="text-slate-900 font-bold">:</span>
                    <span className="min-w-0 break-words font-bold text-blue-700 [overflow-wrap:anywhere]">{subject}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline">
                    <span className="text-slate-900 font-medium">Academic Session</span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="min-w-0 break-words font-bold text-blue-700 font-mono [overflow-wrap:anywhere]">{session}</span>
                  </div>

                  <div
                    className={`grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline ${
                      showActions && isAdmin ? 'cursor-pointer hover:bg-amber-50/80 rounded px-1 -mx-1 group/pct transition-colors' : ''
                    }`}
                    onClick={() => {
                      if (showActions && isAdmin) {
                        setIsEditingPercentage(true);
                        if (isEditingMotherName) setIsEditingMotherName(false);
                        if (isEditingCourse) setIsEditingCourse(false);
                      }
                    }}
                    title={showActions && isAdmin ? 'Click to manually edit Percentage and Grade' : undefined}
                  >
                    <span className="text-slate-900 font-medium flex items-center gap-1">
                      <span>Percentage Obtained</span>
                      {showActions && isAdmin && (
                        <Edit2 className="w-2.5 h-2.5 text-amber-600 opacity-0 group-hover/pct:opacity-100 transition-opacity print:hidden" />
                      )}
                    </span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="min-w-0 break-words font-bold text-blue-700 font-mono [overflow-wrap:anywhere]">{marks}</span>
                  </div>

                  <div
                    className={`grid grid-cols-[160px_16px_1fr] sm:grid-cols-[180px_20px_1fr] items-baseline ${
                      showActions && isAdmin ? 'cursor-pointer hover:bg-amber-50/80 rounded px-1 -mx-1 group/grd transition-colors' : ''
                    }`}
                    onClick={() => {
                      if (showActions && isAdmin) {
                        setIsEditingPercentage(true);
                        if (isEditingMotherName) setIsEditingMotherName(false);
                        if (isEditingCourse) setIsEditingCourse(false);
                      }
                    }}
                    title={showActions && isAdmin ? 'Click to manually edit Percentage and Grade' : undefined}
                  >
                    <span className="text-slate-900 font-medium flex items-center gap-1">
                      <span>Grade Obtained</span>
                      {showActions && isAdmin && (
                        <Edit2 className="w-2.5 h-2.5 text-amber-600 opacity-0 group-hover/grd:opacity-100 transition-opacity print:hidden" />
                      )}
                    </span>
                    <span className="text-slate-900 font-bold">:</span>
                    <span className="min-w-0 break-words font-bold text-blue-700 [overflow-wrap:anywhere]">{grade}</span>
                  </div>
                </div>

                {/* 5. Recognition Conclusion Statement */}
                <p className="text-xs text-slate-800 leading-relaxed pt-1">
                  This certificate is issued in recognition of the successful completion of the above-mentioned course.
                </p>
              </div>

              {/* Signatures & Verification QR Code Row */}
              <div className="flex shrink-0 items-end justify-between pt-5 pb-2 my-1 border-b border-slate-200 z-10 px-2">
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

              {/* Accreditation Badges Row */}
              <div className="grid shrink-0 grid-cols-4 items-center justify-items-center gap-2 sm:gap-4 py-2 my-1 border-t border-slate-200">
                {/* Badge 1: ISO 9001 */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/iso.jpg"
                    alt="ISO 9001 Certified"
                    className="h-16 sm:h-20 max-w-full object-contain"
                  />
                </div>

                {/* Badge 2: Digital India */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/digitalindia.png"
                    alt="Digital India - Power To Empower"
                    className="h-16 sm:h-20 max-w-full object-contain"
                  />
                </div>

                {/* Badge 3: Skill India */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/skillindia.jpeg"
                    alt="Skill India - कौशल भारत - कुशल भारत"
                    className="h-16 sm:h-20 max-w-full object-contain"
                  />
                </div>

                {/* Badge 4: MSME */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/msme.jpeg"
                    alt="Ministry of MSME, Govt. of India"
                    className="h-16 sm:h-20 max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Office Address & Footer Info */}
              <div className="shrink-0 pt-2 text-left space-y-0.5 text-[10px] sm:text-xs text-slate-900 font-sans border-t border-slate-300">
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
            className="printable-certificate relative box-border w-full max-w-[297mm] bg-white text-slate-900 border-[8px] border-amber-600/80 p-8 sm:p-12 shadow-2xl rounded-sm aspect-[297/210] flex flex-col justify-between overflow-hidden print:shadow-none print:border-[8px]"
            style={{
              backgroundImage: `radial-gradient(circle at center, rgba(245, 158, 11, 0.03) 0%, transparent 70%)`,
              aspectRatio: '297 / 210',
              boxSizing: 'border-box',
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
                <img
                  src="/img/logosp.jpeg"
                  alt="Success Point Logo"
                  crossOrigin="anonymous"
                  className="w-16 h-16 sm:w-[68px] sm:h-[68px] object-contain rounded-lg shadow-sm"
                  style={{ width: '68px', height: '68px', objectFit: 'contain' }}
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
                <h2
                  className="landscape-student-name max-w-full break-words text-2xl sm:text-4xl font-bold text-slate-900 font-serif border-b-2 border-amber-600/40 pb-1 px-8 [overflow-wrap:anywhere]"
                  style={{ '--student-name-scale': Math.min(1, 48 / Math.max(studentName.length, 1)) } as React.CSSProperties}
                >
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
                  <p className="max-w-full break-words text-xl sm:text-2xl font-bold text-amber-800 font-serif tracking-wide [overflow-wrap:anywhere]">
                  {course}
                </p>
                {showSubject && subject && (
                  <p className="max-w-full break-words text-xs sm:text-sm font-semibold text-amber-900 mt-1 [overflow-wrap:anywhere]">
                    in the subject of: <span className="font-bold text-amber-950 underline decoration-amber-400">{subject}</span>
                  </p>
                )}
                <p className="text-xs text-slate-600 font-medium mt-1">
                  at <span className="font-semibold text-slate-800">SUCCESS POINT COMPUTER INSTITUTE</span>, Rudrapur, Udham Singh Nagar, Uttarakhand
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center justify-center flex-wrap gap-1">
                  <span>Academic Session: <span className="font-semibold font-mono text-slate-700">{session}</span></span>
                  <span
                    className={showActions && isAdmin ? 'cursor-pointer hover:text-amber-700 underline decoration-amber-400 decoration-dotted' : ''}
                    onClick={() => {
                      if (showActions && isAdmin) {
                        setIsEditingPercentage(true);
                        if (isEditingMotherName) setIsEditingMotherName(false);
                        if (isEditingCourse) setIsEditingCourse(false);
                      }
                    }}
                    title={showActions && isAdmin ? 'Click to manually edit Percentage and Grade' : undefined}
                  >
                    &nbsp;|&nbsp; Percentage Obtained: <span className="font-semibold font-mono text-slate-700">{marks}</span>
                  </span>

                  <span
                    className={showActions && isAdmin ? 'cursor-pointer hover:text-amber-700 underline decoration-amber-400 decoration-dotted' : ''}
                    onClick={() => {
                      if (showActions && isAdmin) {
                        setIsEditingPercentage(true);
                        if (isEditingMotherName) setIsEditingMotherName(false);
                        if (isEditingCourse) setIsEditingCourse(false);
                      }
                    }}
                    title={showActions && isAdmin ? 'Click to manually edit Percentage and Grade' : undefined}
                  >
                    &nbsp;|&nbsp; Grade Obtained: <span className="font-semibold text-slate-700">{grade}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Footer Metadata & Verification */}
            <div className="grid grid-cols-3 items-end pt-6 border-t border-slate-200 relative z-10">
              {/* Left: Issue Details & Student Photo */}
              <div className="flex items-center gap-3 text-left">
                {currentPhoto ? (
                  <div className="relative group">
                    <img
                      src={currentPhoto}
                      alt={studentName}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-sm"
                      style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                    />
                    {showActions && isAdmin && (
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
                    className={`w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 border-dashed flex flex-col items-center justify-center text-slate-400 ${showActions && isAdmin ? 'cursor-pointer hover:bg-slate-200 hover:border-amber-600 hover:text-amber-700 transition-colors' : ''
                      }`}
                    title={showActions && isAdmin ? "Click to Upload Student Photo" : "Student Photo"}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                    {showActions && isAdmin && (
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
