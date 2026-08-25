import PatientPortalContent from "@/components/shared/PatientPortalContent";

/**
 * An iPhone-style device frame that wraps the patient portal content.
 * Used for embedding in the desktop MHAV page as a visual demo.
 */
export default function PhoneMockup() {
  return (
    <div className="flex flex-col items-center">
      {/* iPhone frame */}
      <div className="relative w-[320px] h-[660px] rounded-[3rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-gray-900 rounded-b-2xl z-20" />

        {/* Status bar */}
        <div className="relative z-10 bg-teal-700 px-6 pt-2 pb-0 flex items-center justify-between text-white text-[9px]">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2z" /></svg>
            <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="1" y="6" width="18" height="12" rx="2" /><rect x="20" y="9" width="3" height="6" rx="1" /></svg>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="h-[calc(100%-28px)] overflow-y-auto overflow-x-hidden bg-gradient-to-b from-teal-50 to-white">
          <PatientPortalContent />
        </div>

        {/* Home indicator bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-gray-700 z-20" />
      </div>
    </div>
  );
}
