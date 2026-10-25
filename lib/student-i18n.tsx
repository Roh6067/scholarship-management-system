"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type StudentLanguage = "en" | "hi";

type Messages = Record<string, string>;

const en: Messages = {
  Student: "Student", Workspace: "Workspace", "Student Dashboard": "Student Dashboard", Overview: "Overview", Dashboard: "Dashboard", "My applications": "My applications", "My Applications": "My Applications", Scholarships: "Scholarships", Documents: "Documents", "My profile": "My profile", "My Profile": "My Profile", Notifications: "Notifications", "Sign out": "Sign out", "Close navigation": "Close navigation", "Open navigation": "Open navigation", "Refresh data": "Refresh data", Drafts: "Drafts", "Awaiting verification": "Awaiting verification", Approved: "Approved", "Correction requests": "Correction requests", "Available scholarships": "Available scholarships", "All saved and submitted applications": "All saved and submitted applications", "Applications still in progress": "Applications still in progress", "Submitted for review": "Submitted for review", "Applications approved": "Applications approved", "Need your attention": "Need your attention", "Open opportunities": "Open opportunities", "Good to see you, {name}.": "Good to see you, {name}.", "Here is the latest view of your scholarship activity and work queue.": "Here is the latest view of your scholarship activity and work queue.", "My Application Status": "My Application Status", "Track the status of your scholarship applications": "Track the status of your scholarship applications", "My Monthly Applications": "My Monthly Applications", "Submitted applications": "Submitted applications", "Application workflow": "Application workflow", "No applications found.": "No applications found.", "No scholarships found.": "No scholarships found.", "Loading...": "Loading...", "Mark read": "Mark read", "Your documents": "Your documents", "Save profile": "Save profile", "Upload document": "Upload document", "Apply now": "Apply now", "Start application": "Start application", "Submit application": "Submit application", "Resubmit Application": "Resubmit Application", "Correction Required": "Correction Required", Submitted: "Submitted", Draft: "Draft", Rejected: "Rejected", "Under Department Verification": "Under Department Verification", "Under Officer Verification": "Under Officer Verification", "Sign in securely": "Sign in securely", "Student registration": "Student registration", "Sign in to your workspace": "Sign in to your workspace", "Full name": "Full name", "Student ID": "Student ID", "Email address": "Email address", Password: "Password"
};

const hi: Messages = {
  Student: "छात्र", Workspace: "कार्यस्थल", "Student Dashboard": "छात्र डैशबोर्ड", Overview: "अवलोकन", Dashboard: "डैशबोर्ड", "My applications": "मेरे आवेदन", "My Applications": "मेरे आवेदन", Scholarships: "छात्रवृत्तियां", Documents: "दस्तावेज़", "My profile": "मेरी प्रोफ़ाइल", "My Profile": "मेरी प्रोफ़ाइल", Notifications: "सूचनाएं", "Sign out": "साइन आउट", "Close navigation": "नेविगेशन बंद करें", "Open navigation": "नेविगेशन खोलें", "Refresh data": "डेटा रीफ़्रेश करें", Drafts: "प्रारूप", "Awaiting verification": "सत्यापन की प्रतीक्षा", Approved: "स्वीकृत", "Correction requests": "सुधार अनुरोध", "Available scholarships": "उपलब्ध छात्रवृत्तियां", "All saved and submitted applications": "सभी सहेजे और जमा किए गए आवेदन", "Applications still in progress": "प्रगति पर आवेदन", "Submitted for review": "समीक्षा के लिए जमा", "Applications approved": "स्वीकृत आवेदन", "Need your attention": "आपके ध्यान की आवश्यकता", "Open opportunities": "खुले अवसर", "Good to see you, {name}.": "आपसे मिलकर खुशी हुई, {name}।", "Here is the latest view of your scholarship activity and work queue.": "यह आपकी छात्रवृत्ति गतिविधि और कार्य सूची का नवीनतम विवरण है।", "My Application Status": "मेरे आवेदन की स्थिति", "Track the status of your scholarship applications": "अपने छात्रवृत्ति आवेदनों की स्थिति देखें", "My Monthly Applications": "मेरे मासिक आवेदन", "Submitted applications": "जमा किए गए आवेदन", "Application workflow": "आवेदन प्रक्रिया", "No applications found.": "कोई आवेदन नहीं मिला।", "No scholarships found.": "कोई छात्रवृत्ति नहीं मिली।", "Loading...": "लोड हो रहा है...", "Mark read": "पढ़ा हुआ चिह्नित करें", "Your documents": "आपके दस्तावेज़", "Save profile": "प्रोफ़ाइल सहेजें", "Upload document": "दस्तावेज़ अपलोड करें", "Apply now": "अभी आवेदन करें", "Start application": "आवेदन शुरू करें", "Submit application": "आवेदन जमा करें", "Resubmit Application": "आवेदन दोबारा जमा करें", "Correction Required": "सुधार आवश्यक", Submitted: "जमा किया गया", Draft: "प्रारूप", Rejected: "अस्वीकृत", "Under Department Verification": "विभागीय सत्यापन जारी", "Under Officer Verification": "अधिकारी सत्यापन जारी", "Sign in securely": "सुरक्षित रूप से साइन इन करें", "Student registration": "छात्र पंजीकरण", "Sign in to your workspace": "अपने कार्यस्थल में साइन इन करें", "Full name": "पूरा नाम", "Student ID": "छात्र आईडी", "Email address": "ईमेल पता", Password: "पासवर्ड"
};

const LanguageContext = createContext<{ language: StudentLanguage; setLanguage: (language: StudentLanguage) => void; t: (key: string, values?: Record<string, string | number>) => string } | null>(null);

export function StudentLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<StudentLanguage>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("scholarflow-student-language");
    if (saved === "hi" || saved === "en") setLanguageState(saved);
  }, []);
  const setLanguage = (next: StudentLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem("scholarflow-student-language", next);
  };
  const value = useMemo(() => ({ language, setLanguage, t: (key: string, values?: Record<string, string | number>) => { let result = (language === "hi" ? hi[key] : en[key]) ?? en[key] ?? key; Object.entries(values ?? {}).forEach(([name, value]) => { result = result.replace(`{${name}}`, String(value)); }); return result; } }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useStudentLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useStudentLanguage must be used inside StudentLanguageProvider");
  return context;
}
