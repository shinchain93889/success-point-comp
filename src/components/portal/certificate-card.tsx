import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { CertificateQRCode } from './qr-code';
import { StudentRecord } from '@/lib/types/portal';
import { CheckCircle2, Download, Printer, Share2, ShieldCheck, User, Layout, FileText, Camera, Upload, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { uploadStudentPhotoFile, updateStudent } from '@/lib/supabase/student-service';

interface CertificateCardProps {
  student: StudentRecord;
  showActions?: boolean;
  onPhotoUpdated?: (updated: StudentRecord) => void;
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
  if (!name) return 'N/A';
  let clean = name.trim();
  clean = clean.replace(/^(mr\.?\s*)+/i, '');
  clean = formatTitleCase(clean);
  return `Mr. ${clean}`;
}

export function CertificateCard({ student, showActions = true, onPhotoUpdated }: CertificateCardProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateView, setTemplateView] = useState<'official' | 'ornamental'>('official');

  const [currentPhoto, setCurrentPhoto] = useState<string | null>(
    student.profile_picture_url || student.photo_url || student.student_image || null
  );

  useEffect(() => {
    setCurrentPhoto(student.profile_picture_url || student.photo_url || student.student_image || null);
  }, [student]);

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

  const rawStudentName = student.student_name || student.name || 'Student';
  const studentName = formatTitleCase(rawStudentName);

  const rawFatherName = student.father_name || 'Father Name';
  const fatherName = formatFatherName(rawFatherName);

  const rollNo = student.roll_no || student.roll_number || student.student_id || '10101';
  const enrollNo = student.enrollment_no || `EN-${rollNo}`;
  const certNo = student.certificate_no || `SP-${rollNo}`;
  const course = student.course || 'Diploma in Computer Application (DCA)';
  const duration = student.duration || student.session || '2023-2024';
  const subject = student.subject || course;
  const marks = student.marks || '85%';
  const grade = student.grade || 'A';
  const certUrl = student.certificate_url || student.pdf_url;

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
            {student.course_status === 'completed' ? (
              <>
                <button
                  onClick={handleDownloadImage}
                  disabled={isGeneratingImage}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingImage ? 'Generating...' : 'Download A4 Image'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
              </>
            ) : (
              <button
                disabled
                title="Course status is Pending. Download available once marked Completed by institute."
                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-not-allowed"
              >
                <Download className="w-4 h-4 opacity-50" />
                Download Locked
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable Certificate Frame */}
      <div className="bg-slate-100 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-transparent printable-certificate-wrapper flex justify-center w-full">
        {templateView === 'official' ? (
          /* Official Institute Portrait A4 Template with Designer Border */
          <div
            ref={certRef}
            className="printable-certificate w-full max-w-[210mm] bg-white text-slate-900 border-[10px] border-double border-amber-600/90 p-4 sm:p-5 shadow-2xl rounded-sm flex flex-col justify-between print:shadow-none print:border-[10px] font-sans relative box-border"
            style={{
              aspectRatio: '1 / 1.414',
              boxSizing: 'border-box',
            }}
          >
            {/* Designer Inner Border & Corner Ornaments */}
            <div className="border-2 border-amber-600/70 p-5 sm:p-6 flex flex-col justify-between h-full relative bg-gradient-to-b from-amber-50/20 via-white to-amber-50/20 box-border">
              {/* Designer Corner Flourishes */}
              <div className="absolute top-1 left-1 w-8 h-8 border-t-4 border-l-4 border-amber-600" />
              <div className="absolute top-2 left-2 w-10 h-10 border-t border-l border-amber-500/60" />
              <div className="absolute top-1 right-1 w-8 h-8 border-t-4 border-r-4 border-amber-600" />
              <div className="absolute top-2 right-2 w-10 h-10 border-t border-r border-amber-500/60" />
              <div className="absolute bottom-1 left-1 w-8 h-8 border-b-4 border-l-4 border-amber-600" />
              <div className="absolute bottom-2 left-2 w-10 h-10 border-b border-l border-amber-500/60" />
              <div className="absolute bottom-1 right-1 w-8 h-8 border-b-4 border-r-4 border-amber-600" />
              <div className="absolute bottom-2 right-2 w-10 h-10 border-b border-r border-amber-500/60" />

              {/* Top Roll & Enrollment Header */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 font-sans z-10 px-2">
                <div>Roll No : <span className="font-mono text-blue-700 font-bold">{rollNo}</span></div>
                <div>Enrollment No : <span className="font-mono text-blue-700 font-bold">{enrollNo}</span></div>
              </div>

              {/* Main Institute Header */}
              <div className="text-center space-y-1 my-2 z-10 px-4">
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
              <div className="grid grid-cols-3 items-center my-3 z-10 px-3">
                {/* Left: Institute Logo - INSET WITH SAFE PADDING TO PREVENT CUTOFF */}
                <div className="flex justify-start items-center pl-2">
                  <div className="w-22 h-22 sm:w-26 sm:h-26 flex items-center justify-center shrink-0">
                    <img
                      src="/img/logosp.jpeg"
                      alt="Success Point Logo"
                      className="max-w-full max-h-full object-contain"
                      style={{ width: '96px', height: '96px', objectFit: 'contain' }}
                    />
                  </div>
                </div>

                {/* Center: CERTIFICATE Title */}
                <div className="text-center">
                  <h2 className="text-2xl sm:text-4xl font-black text-black font-sans tracking-widest inline-block px-4">
                    CERTIFICATE
                  </h2>
                </div>

                {/* Right: Student Photo Frame - FIXED PASSPORT DIMENSIONS & NO STRETCH */}
                <div className="flex justify-end pr-2 print:block">
                  {currentPhoto ? (
                    <div className="relative group shrink-0" style={{ width: '96px', height: '112px' }}>
                      <img
                        src={currentPhoto}
                        alt={studentName}
                        className="w-full h-full object-cover border-2 border-amber-600 shadow-sm rounded-xs"
                        style={{ width: '96px', height: '112px', objectFit: 'cover' }}
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
                      style={{ width: '96px', height: '112px' }}
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
              <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm text-slate-900 leading-relaxed font-sans my-2 z-10 px-3 sm:px-5">
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>This is to certify that</span>
                  <span className="font-bold text-blue-700 text-sm sm:text-base px-1 uppercase tracking-wide">
                    {studentName}
                  </span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>Father's Name:</span>
                  <span className="font-bold text-blue-700 px-1">
                    {fatherName}
                  </span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>has completed</span>
                  <span className="font-bold text-blue-700 px-1">{course}</span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>Course Duration :</span>
                  <span className="font-bold text-blue-700 px-1">{duration}</span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>At</span>
                  <span className="font-bold text-blue-800 font-sans text-xs sm:text-sm uppercase tracking-wide">
                    SUCCESS POINT COMPUTER INSTITUTE (RUDRAPUR, UDHAM SINGH NAGAR, UTTARAKHAND)
                  </span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>with the following subject/course:</span>
                  <span className="font-bold text-blue-700 px-1">{subject}</span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>He/She has scored</span>
                  <span className="font-bold text-blue-700 px-1">{marks}</span>
                  <span>Marks.</span>
                </p>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span>with Grade</span>
                  <span className="font-bold text-blue-700 px-1">"{grade}"</span>
                </p>
              </div>

              {/* Signatures & Verification QR Code Row */}
              <div className="flex items-end justify-between pt-6 pb-2 my-2 border-b border-slate-200 z-10 px-2">
                <div className="text-left font-bold text-xs sm:text-sm text-black">
                  <div className="h-8 border-b border-slate-400 mb-1 w-32 sm:w-40" />
                  Controller Of Examination
                </div>

                {/* QR Code in Official Certificate Footer */}
                <div className="flex flex-col items-center text-center">
                  <CertificateQRCode value={verificationUrl} size={64} className="p-1" />
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5">Scan to Verify</span>
                </div>

                <div className="text-right font-bold text-xs sm:text-sm text-black">
                  <div className="h-8 border-b border-slate-400 mb-1 w-32 sm:w-40 ml-auto" />
                  <p>Director / Authorized Signatory</p>
                  <p className="text-[10px] sm:text-xs text-slate-700 font-semibold">SUCCESS POINT COMPUTER INSTITUTE</p>
                </div>
              </div>

              {/* Accreditation Badges Row */}
              <div className="grid grid-cols-4 items-center justify-items-center gap-2 sm:gap-4 py-2 my-1 border-t border-slate-200">
                {/* Badge 1: ISO 9001 */}
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-blue-900 bg-blue-50/50 p-1 flex flex-col items-center justify-center text-blue-900 relative shadow-sm">
                    <div className="w-full h-full rounded-full border border-blue-800 border-dashed flex flex-col items-center justify-center p-0.5">
                      <span className="text-[5px] sm:text-[6px] font-extrabold uppercase tracking-tighter text-blue-950">CERTIFIED</span>
                      <span className="text-[7px] sm:text-[9px] font-black leading-none border-y border-blue-900 px-0.5 my-0.5 text-blue-900">ISO 9001</span>
                      <span className="text-[5px] sm:text-[6px] font-extrabold uppercase tracking-tighter text-blue-950">CERTIFIED</span>
                    </div>
                  </div>
                </div>

                {/* Badge 2: Digital India */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/digitalindia.png"
                    alt="Digital India - Power To Empower"
                    className="h-8 sm:h-12 max-w-full object-contain"
                  />
                </div>

                {/* Badge 3: Skill India */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/skillindia.jpeg"
                    alt="Skill India - कौशल भारत - कुशल भारत"
                    className="h-8 sm:h-12 max-w-full object-contain"
                  />
                </div>

                {/* Badge 4: MSME */}
                <div className="flex items-center justify-center">
                  <img
                    src="/img/msme.jpeg"
                    alt="Ministry of MSME, Govt. of India"
                    className="h-8 sm:h-12 max-w-full object-contain"
                  />
                </div>
              </div>

              {/* Office Address & Footer Info */}
              <div className="pt-2 text-left space-y-0.5 text-[10px] sm:text-xs text-slate-900 font-sans border-t border-slate-300">
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
                Son/Daughter of <span className="font-semibold text-slate-900">{fatherName}</span>, Roll No.{' '}
                <span className="font-mono font-semibold text-amber-800">{rollNo}</span>, has successfully completed the prescribed course of study in
              </p>

              <div className="py-2">
                <p className="text-xl sm:text-2xl font-bold text-amber-800 font-serif tracking-wide">
                  {course}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Academic Session: <span className="font-semibold text-slate-700">{duration}</span>
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
              <div className="text-right space-y-1">
                <div className="h-10 flex items-end justify-end">
                  <span className="font-serif italic text-lg text-amber-900 tracking-widest border-b border-slate-400 px-4 pb-0.5">
                    Authorized Director
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Success Point Institute</p>
                <p className="text-[10px] text-slate-500">Seal & Signature</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
