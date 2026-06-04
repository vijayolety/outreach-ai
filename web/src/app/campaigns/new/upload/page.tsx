import { UploadForm } from "./UploadForm";
import { Stepper } from "@/components/Stepper";

export default function UploadPage() {
  return (
    <div className="flex flex-col h-full">
      <Stepper />
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <UploadForm />
      </div>
    </div>
  );
}
