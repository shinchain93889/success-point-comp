'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { CertificateQRCode } from './qr-code';
import { StudentRecord } from '@/lib/types/portal';
import { CheckCircle2, Download, Printer, Share2, ShieldCheck, User, Layout, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateCardProps {
  student: StudentRecord;
  showActions?: boolean;
}

export function CertificateCard({ student, showActions = true }: CertificateCardProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateView, setTemplateView] = useState<'official' | 'ornamental'>('official');

  const studentName = student.student_name || student.name || 'Student';
  const fatherName = student.father_name || 'Father Name';
  const rollNo = student.roll_no || student.roll_number || student.student_id || '10101';
  const enrollNo = student.enrollment_no || `EN-${rollNo}`;
  const certNo = student.certificate_no || `SP-${rollNo}`;
  const course = student.course || 'Computer Application';
  const duration = student.duration || student.session || '6 Months';
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  templateView === 'official'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Official Institute A4
              </button>
              <button
                onClick={() => setTemplateView('ornamental')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  templateView === 'ornamental'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layout className="w-3.5 h-3.5" /> Modern Landscape
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
      <div className="bg-slate-100 p-2 sm:p-6 rounded-2xl print:p-0 print:bg-white flex justify-center">
        {templateView === 'official' ? (
          /* Official Institute Portrait A4 Template (Matches certificate copy.jpeg) */
          <div
            ref={certRef}
            className="w-full max-w-[210mm] bg-white text-slate-900 border-[3px] border-black p-6 sm:p-10 shadow-2xl rounded-sm flex flex-col justify-between print:shadow-none print:border-[3px] font-sans"
            style={{
              aspectRatio: '1 / 1.414',
            }}
          >
            {/* Top Roll & Enrollment Header */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 font-sans">
              <div>Roll no : <span className="font-mono">{rollNo}</span></div>
              <div>Enrollment No: <span className="font-mono">{enrollNo}</span></div>
            </div>

            {/* Main Institute Header */}
            <div className="text-center space-y-1 my-2">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-black font-sans uppercase">
                SUCCESS POINT COMPUTER INSTITUTE
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-800 font-medium">
                (An autonomous body registered under the sr act section 9(1) act 2012)
              </p>
              <p className="text-[10px] sm:text-xs text-slate-800 font-medium">
                cr act department for promotion of I.I.T govt of india
              </p>
              <p className="text-[10px] sm:text-xs text-slate-800 font-medium">
                Gov.regn no hr/kkr/2015/00328
              </p>
            </div>

            {/* Logo, Title & Student Photo Grid */}
            <div className="grid grid-cols-3 items-center my-4">
              {/* Left: Institute Logo */}
              <div className="flex justify-start">
                <Image
                  src="/img/logosp.jpeg"
                  alt="Success Point Logo"
                  width={110}
                  height={110}
                  className="w-24 sm:w-28 h-auto object-contain"
                />
              </div>

              {/* Center: CERTIFICATE Title */}
              <div className="text-center">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-black font-sans tracking-wide">
                  CERTIFICATE
                </h2>
              </div>

              {/* Right: Student Photo Frame */}
              <div className="flex justify-end">
                {student.profile_picture_url ? (
                  <Image
                    src={student.profile_picture_url}
                    alt={studentName}
                    width={100}
                    height={120}
                    className="w-24 h-28 object-cover border border-black shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-28 border border-slate-600 border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-50">
                    <User className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-semibold mt-1">Photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Certification Body Text */}
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-900 leading-relaxed font-sans my-2">
              <p>
                this is to certify &nbsp;
                <span className="font-bold underline text-black text-sm sm:text-base px-1">
                  {studentName}
                </span>
              </p>
              <p>
                Father name Mr. &nbsp;
                <span className="font-bold underline text-black px-1">
                  {fatherName}
                </span>
              </p>
              <p>
                has completed &nbsp;
                <span className="font-bold underline text-black px-1">{course}</span>
                &nbsp; Course Duration : &nbsp;
                <span className="font-bold underline text-black px-1">{duration}</span>
              </p>
              <p>
                At{' '}
                <span className="font-bold text-blue-700 font-sans text-xs sm:text-sm">
                  success point computer instutite (rudrapur udam singh nagar uttrakhand)
                </span>
              </p>
              <p>
                with the following subject computer &nbsp;
                <span className="font-bold underline text-black px-1">{subject}</span>
              </p>
              <p>
                he/she has scored &nbsp;
                <span className="font-bold underline text-black px-1">{marks}</span>
                &nbsp; Marks.
              </p>
              <p>
                with Grade &nbsp;
                <span className="font-bold underline text-black px-1">"{grade}"</span>
              </p>
            </div>

            {/* Signatures Row */}
            <div className="flex items-end justify-between pt-8 pb-4 my-2 border-b border-slate-200">
              <div className="text-left font-bold text-xs sm:text-sm text-black">
                <div className="h-8 border-b border-slate-400 mb-1" />
                Controller Of Exam
              </div>
              <div className="text-right font-bold text-xs sm:text-sm text-black">
                <div className="h-8 border-b border-slate-400 mb-1" />
                SUCCESS POINT COMPUTER
              </div>
            </div>

            {/* Accreditation Badges Row */}
            <div className="grid grid-cols-4 items-center justify-between gap-2 py-2">
              {/* Badge 1: ISO 9001 */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full border-2 border-blue-900 bg-blue-50/50 p-1 flex flex-col items-center justify-center text-blue-900 relative shadow-sm">
                  <div className="w-full h-full rounded-full border border-blue-800 border-dashed flex flex-col items-center justify-center p-0.5">
                    <span className="text-[6px] font-extrabold uppercase tracking-tighter">CERTIFIED</span>
                    <span className="text-[8px] font-black leading-tight border-y border-blue-900 px-0.5 my-0.5">ISO 9001</span>
                    <span className="text-[6px] font-extrabold uppercase tracking-tighter">CERTIFIED</span>
                  </div>
                </div>
              </div>

              {/* Badge 2: Digital India */}
              <div className="flex items-center justify-center">
                <Image
                  src="/img/digitalindia.png"
                  alt="Digital India - Power To Empower"
                  width={110}
                  height={50}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </div>

              {/* Badge 3: Skill India */}
              <div className="flex flex-col items-center text-center leading-none">
                <div className="w-6 h-5 mb-0.5">
                  <svg viewBox="0 0 100 80" className="w-full h-full">
                    <rect x="15" y="10" width="70" height="45" rx="4" fill="#0284c7" />
                    <rect x="22" y="16" width="56" height="33" fill="#ffffff" />
                    <polygon points="50,20 60,38 40,38" fill="#f97316" />
                    <rect x="42" y="55" width="16" height="15" fill="#334155" />
                    <rect x="30" y="70" width="40" height="6" fill="#334155" />
                  </svg>
                </div>
                <span className="font-extrabold text-[9px] text-blue-950">Skill India</span>
                <span className="text-[6px] text-slate-700">कौशल भारत - कुशल भारत</span>
              </div>

              {/* Badge 4: MSME */}
              <div className="flex items-center gap-1 border-l border-slate-300 pl-1.5">
                <div className="w-5 h-7 shrink-0">
                  <svg viewBox="0 0 40 50" className="w-full h-full text-slate-800">
                    <path d="M20 2 L24 8 L32 8 L27 14 L29 22 L20 17 L11 22 L13 14 L8 8 L16 8 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                    <rect x="12" y="24" width="16" height="16" fill="#475569" />
                    <rect x="16" y="40" width="8" height="6" fill="#1e293b" />
                  </svg>
                </div>
                <div className="leading-none text-[6px]">
                  <span className="block font-black text-[9px] text-slate-900">MSME</span>
                  <span className="block text-[6px] text-slate-700 font-bold">MICRO, SMALL & MEDIUM</span>
                  <span className="block text-[5.5px] text-slate-600">Ministry of MSME, Govt. of India</span>
                </div>
              </div>
            </div>

            {/* Office Address & Footer Info */}
            <div className="pt-2 text-left space-y-0.5 text-[10px] sm:text-xs text-slate-900 font-sans border-t border-slate-300">
              <p className="font-bold">Office Address:</p>
              <p>Azad Nagar Ward No-07, Transit Camp Rudrapur, Udham Singh Nagar, Uttrakhand-263153.</p>
              <p>website: <span className="font-semibold text-blue-800">www.successpointrdr.in</span></p>
              <p>email: <span className="font-semibold text-slate-800">info.success.get@gmail.com</span></p>
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
                {student.profile_picture_url ? (
                  <Image
                    src={student.profile_picture_url}
                    alt={studentName}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                    <User className="w-7 h-7" />
                  </div>
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
